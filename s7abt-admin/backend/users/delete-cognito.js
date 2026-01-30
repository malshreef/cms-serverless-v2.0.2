const { CognitoIdentityProviderClient, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const db = require('./shared/db');
const { success: successResponse, error: errorResponse } = require('./shared/response');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'me-central-1' });
const USER_POOL_ID = process.env.USER_POOL_ID;

/**
 * Delete User with Cognito Integration
 * 
 * Deletes user from both Cognito and database (soft delete in DB):
 * - Cognito: Permanently delete user
 * - Database: Soft delete (set deleted_at timestamp)
 */
exports.handler = async (event) => {
  console.log('Deleting user with Cognito integration:', JSON.stringify(event, null, 2));

  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    // Get current user from Cognito context
    const currentUserRole = event.requestContext?.authorizer?.claims?.['custom:role'] || 'viewer';
    const currentUserEmail = event.requestContext?.authorizer?.claims?.email;

    // Only admins can delete users
    if (currentUserRole !== 'admin') {
      return errorResponse('Only administrators can delete users', 403);
    }

    const connection = await db.getConnection();

    try {
      // Get user to delete
      const [users] = await connection.execute(
        `SELECT 
          s7b_user_id as id,
          s7b_user_email as email,
          s7b_user_role as role,
          s7b_user_cognito_id as cognitoId
        FROM s7b_user 
        WHERE s7b_user_id = ? AND s7b_user_deleted_at IS NULL`,
        [userId]
      );

      if (users.length === 0) {
        return errorResponse('User not found', 404);
      }

      const userToDelete = users[0];

      // Prevent self-deletion
      if (userToDelete.email === currentUserEmail) {
        return errorResponse('You cannot delete your own account', 403);
      }

      // Check if this is the last admin
      if (userToDelete.role === 'admin') {
        const [adminCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM s7b_user WHERE s7b_user_role = ? AND s7b_user_deleted_at IS NULL',
          ['admin']
        );

        if (adminCount[0].count <= 1) {
          return errorResponse('Cannot delete the last admin user', 403);
        }
      }

      // Check if user has content (articles or news)
      const [articleCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM s7b_article WHERE s7b_user_id = ? AND s7b_article_deleted_at IS NULL',
        [userId]
      );

      const [newsCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM s7b_news WHERE s7b_user_id = ? AND s7b_news_deleted_at IS NULL',
        [userId]
      );

      const totalContent = articleCount[0].count + newsCount[0].count;

      if (totalContent > 0) {
        return errorResponse(
          `Cannot delete user: User has ${articleCount[0].count} article(s) and ${newsCount[0].count} news item(s). Please reassign or delete their content first.`,
          409
        );
      }

      const cognitoUsername = userToDelete.cognitoId || userToDelete.email;

      // Step 1: Delete from Cognito
      console.log('Deleting user from Cognito...');
      try {
        await cognito.send(new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoUsername,
        }));
        console.log('User deleted from Cognito');
      } catch (cognitoError) {
        if (cognitoError.name !== 'UserNotFoundException') {
          // If Cognito deletion fails (except user not found), don't proceed with DB deletion
          throw cognitoError;
        }
        console.log('User not found in Cognito, proceeding with database deletion');
      }

      // Step 2: Soft delete from database
      console.log('Soft deleting user from database...');
      await connection.execute(
        'UPDATE s7b_user SET s7b_user_deleted_at = NOW() WHERE s7b_user_id = ?',
        [userId]
      );

      return successResponse({
        message: 'User deleted successfully',
        deletedUserId: userId,
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting user:', error);

    // Handle specific Cognito errors
    if (error.name === 'UserNotFoundException') {
      // User doesn't exist in Cognito, but might exist in DB
      // This is handled above, but just in case
      return errorResponse('User not found in Cognito', 404);
    }

    return errorResponse(error.message || 'Failed to delete user', 500);
  }
};

