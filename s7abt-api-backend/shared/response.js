/**
 * Response Utility Module
 * Standardized API response formatting
 */

/**
 * Create a successful response
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} API Gateway response object
 */
const success = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Configure based on your domain
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} details - Additional error details
 * @returns {object} API Gateway response object
 */
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
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

/**
 * Create a not found response
 * @param {string} resource - Resource that was not found
 * @returns {object} API Gateway response object
 */
const notFound = (resource = 'Resource') => {
  return error(`${resource} not found`, 404);
};

/**
 * Create a bad request response
 * @param {string} message - Error message
 * @returns {object} API Gateway response object
 */
const badRequest = (message) => {
  return error(message, 400);
};

/**
 * Create an unauthorized response
 * @returns {object} API Gateway response object
 */
const unauthorized = () => {
  return error('Unauthorized', 401);
};

module.exports = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized
};
