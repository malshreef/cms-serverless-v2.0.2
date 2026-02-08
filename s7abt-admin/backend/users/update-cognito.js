const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand, AdminSetUserPasswordCommand, AdminEnableUserCommand, AdminDisableUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const db = require('./shared/db');
const { success: successResponse, error: errorResponse } = require('./shared/response');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'me-central-1' });
const USER_POOL_ID = process.env.USER_POOL_ID;

/**
 * Update User with Cognito Integration
 * 
 * Updates user in both Cognito and database:
 * - Cognito: Email, name, role, password, enabled/disabled status
 * - Database: All profile fields
 */
exports.handler = async (event) => {
  console.log('Updating user with Cognito integration:', JSON.stringify(event, null, 2));

  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const {
      name,
      brief,
      role,
      active,
      image,
      twitter,
      facebook,
      linkedin,
      password, // Optional: only if changing password
    } = body;

    // Get current user from Cognito context (the one making the request)
    const currentUserRole = event.requestContext?.authorizer?.claims?.['custom:role'] || 'viewer';

    // Only admins can update users
    if (currentUserRole !== 'admin') {
      return errorResponse('Only administrators can update users', 403);
    }

    const connection = await db.getConnection();

    try {
      // Get existing user from database
      const [users] = await connection.query(
        `SELECT 
          s7b_user_id as id,
          s7b_user_email as email,
          s7b_user_name as name,
          s7b_user_role as role,
          s7b_user_active as active,
          s7b_user_cognito_id as cognitoId
        FROM s7b_user 
        WHERE s7b_user_id = ? AND s7b_user_deleted_at IS NULL`,
        [userId]
      );

      if (users.length === 0) {
        return errorResponse('User not found', 404);
      }

      const existingUser = users[0];
      const cognitoUsername = existingUser.cognitoId || existingUser.email;

      // Prepare update fields
      const updates = [];
      const values = [];

      if (name !== undefined) {
        if (name.length > 100) {
          return errorResponse('Name must not exceed 100 characters', 400);
        }
        updates.push('s7b_user_name = ?');
        values.push(name);
      }

      if (brief !== undefined) {
        if (brief.length > 200) {
          return errorResponse('Brief must not exceed 200 characters', 400);
        }
        updates.push('s7b_user_brief = ?');
        values.push(brief);
      }

      if (role !== undefined) {
        const validRoles = ['admin', 'content_manager', 'content_specialist', 'viewer'];
        if (!validRoles.includes(role)) {
          return errorResponse('Invalid role', 400);
        }

        // Check if this is the last admin
        if (existingUser.role === 'admin' && role !== 'admin') {
          const [adminCount] = await connection.query(
            'SELECT COUNT(*) as count FROM s7b_user WHERE s7b_user_role = ? AND s7b_user_deleted_at IS NULL',
            ['admin']
          );

          if (adminCount[0].count <= 1) {
            return errorResponse('Cannot change role: This is the last admin user', 403);
          }
        }

        updates.push('s7b_user_role = ?');
        values.push(role);
      }

      if (active !== undefined) {
        updates.push('s7b_user_active = ?');
        values.push(active);
      }

      if (image !== undefined) {
        updates.push('s7b_user_image = ?');
        values.push(image);
      }

      if (twitter !== undefined) {
        updates.push('s7b_user_twitter = ?');
        values.push(twitter);
      }

      if (facebook !== undefined) {
        updates.push('s7b_user_facebook = ?');
        values.push(facebook);
      }

      if (linkedin !== undefined) {
        updates.push('s7b_user_linkedin = ?');
        values.push(linkedin);
      }

      // Step 1: Update Cognito user attributes
      console.log('Updating Cognito user attributes...');
      const cognitoAttributes = [];

      if (name !== undefined) {
        cognitoAttributes.push({ Name: 'name', Value: name });
      }

      if (role !== undefined) {
        cognitoAttributes.push({ Name: 'custom:role', Value: role });
      }

      if (cognitoAttributes.length > 0) {
        await cognito.send(new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoUsername,
          UserAttributes: cognitoAttributes,
        }));
        console.log('Cognito attributes updated');
      }

      // Step 2: Update password if provided
      if (password) {
        if (password.length < 8) {
          return errorResponse('Password must be at least 8 characters long', 400);
        }

        console.log('Updating password in Cognito...');
        await cognito.send(new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoUsername,
          Password: password,
          Permanent: true,
        }));
        console.log('Password updated successfully');
      }

      // Step 3: Enable/Disable user in Cognito
      if (active !== undefined) {
        if (active === 1 && existingUser.active === 0) {
          console.log('Enabling user in Cognito...');
          await cognito.send(new AdminEnableUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: cognitoUsername,
          }));
        } else if (active === 0 && existingUser.active === 1) {
          console.log('Disabling user in Cognito...');
          await cognito.send(new AdminDisableUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: cognitoUsername,
          }));
        }
      }

      // Step 4: Update database
      if (updates.length > 0) {
        console.log('Updating database...');
        values.push(userId);
        await connection.query(
          `UPDATE s7b_user SET ${updates.join(', ')} WHERE s7b_user_id = ?`,
          values
        );
      }

      // Fetch updated user
      const [updatedUsers] = await connection.query(
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
        message: 'User updated successfully',
        user: updatedUsers[0],
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating user:', error);

    // Handle specific Cognito errors
    if (error.name === 'UserNotFoundException') {
      return errorResponse('User not found in Cognito', 404);
    }
    if (error.name === 'InvalidPasswordException') {
      return errorResponse('Password does not meet requirements: minimum 8 characters, must contain uppercase, lowercase, number, and symbol', 400);
    }
    if (error.name === 'InvalidParameterException') {
      return errorResponse('Invalid user parameters: ' + error.message, 400);
    }

    return errorResponse(error.message || 'Failed to update user', 500);
  }
};

