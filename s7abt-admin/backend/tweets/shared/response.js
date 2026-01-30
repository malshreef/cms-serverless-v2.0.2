/**
 * Standard response formatter for API Gateway
 */

function success(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

function error(message, statusCode = 500, details = null) {
  console.error('API Error:', message, details);

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: false,
      error: message,
      details: details || undefined,
    }),
  };
}

function validationError(message, errors = []) {
  return error(message, 400, errors);
}

function notFound(message = 'Resource not found') {
  return error(message, 404);
}

function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

function forbidden(message = 'Forbidden') {
  return error(message, 403);
}

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
};
