/**
 * Response Utility Module
 * Standardized API response formatting
 */

const success = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
};

const error = (message, statusCode = 500, details = null) => {
  const body = {
    success: false,
    error: {
      message
    }
  };

  if (details) {
    body.error.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

const notFound = (resource = 'Resource') => {
  return error(`${resource} not found`, 404);
};

const badRequest = (message) => {
  return error(message, 400);
};

const unauthorized = () => {
  return error('Unauthorized', 401);
};

const forbidden = (message = 'Forbidden') => {
  return error(message, 403);
};

const validationError = (errors) => {
  return error('Validation failed', 400, errors);
};

module.exports = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  validationError
};
