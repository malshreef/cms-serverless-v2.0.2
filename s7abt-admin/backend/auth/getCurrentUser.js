const response = require('./shared/response');

exports.handler = async (event) => {
  try {
    // Extract user information from Cognito authorizer context
    const claims = event.requestContext.authorizer.claims;
    
    if (!claims) {
      return response.error('Unauthorized', 401);
    }

    const user = {
      id: claims.sub,
      email: claims.email,
      name: claims.name || claims.email,
      role: claims['custom:role'] || 'viewer',
      groups: claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [],
      emailVerified: claims.email_verified === 'true',
    };

    return response.success(user);
  } catch (err) {
    console.error('Error getting current user:', err);
    return response.error('Failed to get user information', 500, err.message);
  }
};

