const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const db = require('./shared/db');
const { success: successResponse, error: errorResponse } = require('./shared/response');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'me-central-1' });
const USER_POOL_ID = process.env.USER_POOL_ID;

/**
 * Create User with Cognito Integration
 * 
 * Creates user in both Cognito and database:
 * - Cognito: Authentication, password, email
 * - Database: Extended profile, role, social links
 */
exports.handler = async (event) => {
  console.log('Creating user with Cognito integration:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      email,
      password,
      name,
      brief = '',
      role = 'viewer',
      active = 1,
      image = '',
      twitter = '',
      facebook = '',
      linkedin = '',
    } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return errorResponse('Email, password, name, and role are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate password strength (min 8 chars, Cognito requires uppercase, lowercase, number, symbol)
    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters long', 400);
    }

    // Validate role
    const validRoles = ['admin', 'content_manager', 'content_specialist', 'viewer'];
    if (!validRoles.includes(role)) {
      return errorResponse('Invalid role. Must be one of: admin, content_manager, content_specialist, viewer', 400);
    }

    // Validate name length
    if (name.length > 100) {
      return errorResponse('Name must not exceed 100 characters', 400);
    }

    // Validate brief length
    if (brief.length > 200) {
      return errorResponse('Brief must not exceed 200 characters', 400);
    }

    const connection = await db.getConnection();

    try {
      // Check if email already exists in database
      const [existingUsers] = await connection.execute(
        'SELECT s7b_user_id FROM s7b_user WHERE s7b_user_email = ? AND s7b_user_deleted_at IS NULL',
        [email]
      );

      if (existingUsers.length > 0) {
        return errorResponse('User with this email already exists', 409);
      }

      // Step 1: Create user in Cognito
      console.log('Creating user in Cognito...');
      const createUserParams = {
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: role },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
        TemporaryPassword: password,
      };

      const createUserResult = await cognito.send(new AdminCreateUserCommand(createUserParams));
      const cognitoUsername = createUserResult.User.Username;
      console.log('Cognito user created:', cognitoUsername);

      // Step 2: Set permanent password (mark as not temporary)
      console.log('Setting permanent password...');
      const setPasswordParams = {
        UserPoolId: USER_POOL_ID,
        Username: cognitoUsername,
        Password: password,
        Permanent: true,
      };

      await cognito.send(new AdminSetUserPasswordCommand(setPasswordParams));
      console.log('Password set successfully');

      // Step 3: Create user in database
      console.log('Creating user in database...');
      const [result] = await connection.execute(
        `INSERT INTO s7b_user (
          s7b_user_username,
          s7b_user_password,
          s7b_user_email,
          s7b_user_name,
          s7b_user_brief,
          s7b_user_role,
          s7b_user_active,
          s7b_user_image,
          s7b_user_twitter,
          s7b_user_facebook,
          s7b_user_linkedin,
          s7b_user_cognito_id,
          s7b_user_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [email, '', email, name, brief, role, active, image, twitter, facebook, linkedin, cognitoUsername]
      );

      const userId = result.insertId;
      console.log('Database user created with ID:', userId);

      // Fetch the created user
      const [users] = await connection.execute(
        `SELECT 
          s7b_user_id as id,
          s7b_user_email as email,
          s7b_user_name as name,
          s7b_user_brief as brief,
          s7b_user_role as role,
          s7b_user_active as active,
          s7b_user_image as image,
          s7b_user_twitter as twitter,
          s7b_user_facebook as facebook,
          s7b_user_linkedin as linkedin,
          s7b_user_cognito_id as cognitoId,
          s7b_user_created_at as createdAt
        FROM s7b_user 
        WHERE s7b_user_id = ?`,
        [userId]
      );

      return successResponse({
        message: 'User created successfully',
        user: users[0],
      }, 201);

    } catch (error) {
      // Rollback: If database creation fails, try to delete Cognito user
      if (error.code !== 'UsernameExistsException') {
        console.error('Error during user creation, attempting rollback...');
        try {
          const { AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
          await cognito.send(new AdminDeleteUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
          }));
          console.log('Cognito user deleted during rollback');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating user:', error);

    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      return errorResponse('User with this email already exists in Cognito', 409);
    }
    if (error.name === 'InvalidPasswordException') {
      return errorResponse('Password does not meet requirements: minimum 8 characters, must contain uppercase, lowercase, number, and symbol', 400);
    }
    if (error.name === 'InvalidParameterException') {
      return errorResponse('Invalid user parameters: ' + error.message, 400);
    }

    return errorResponse(error.message || 'Failed to create user', 500);
  }
};

