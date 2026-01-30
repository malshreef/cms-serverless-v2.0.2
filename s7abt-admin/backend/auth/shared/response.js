/**
 * Create a success response
 */
function success(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

/**
 * Create an error response
 */
function error(message, statusCode = 500, details = null) {
  console.error('Error response:', { message, statusCode, details });

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        details
      }
    })
  };
}

/**
 * Create a validation error response
 */
function validationError(errors) {
  return error('Validation failed', 400, errors);
}

/**
 * Create a not found response
 */
function notFound(resource = 'Resource') {
  return error(`${resource} not found`, 404);
}

/**
 * Create an unauthorized response
 */
function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

/**
 * Create a forbidden response
 */
function forbidden(message = 'Forbidden') {
  return error(message, 403);
}

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden
};
