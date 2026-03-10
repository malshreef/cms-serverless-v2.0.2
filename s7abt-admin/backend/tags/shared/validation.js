/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const errors = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }
  
  return errors;
}

/**
 * Validate string length
 */
function validateLength(value, fieldName, min, max) {
  const errors = [];
  
  if (value && typeof value === 'string') {
    if (min && value.length < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters`
      });
    }
    if (max && value.length > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${max} characters`
      });
    }
  }
  
  return errors;
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return [{
      field: 'email',
      message: 'Invalid email format'
    }];
  }
  
  return [];
}

/**
 * Validate enum value
 */
function validateEnum(value, fieldName, allowedValues) {
  if (value && !allowedValues.includes(value)) {
    return [{
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    }];
  }
  
  return [];
}

/**
 * Generate slug from text
 * Supports Arabic, English, and other Unicode characters
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters (including Arabic), numbers, spaces, hyphens
    .replace(/\s+/g, '-')               // Replace spaces with hyphens
    .replace(/-+/g, '-')                // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');           // Remove leading/trailing hyphens
}

/**
 * Sanitize HTML (basic)
 */
function sanitizeHtml(html) {
  // This is a basic sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

module.exports = {
  validateRequired,
  validateLength,
  validateEmail,
  validateEnum,
  generateSlug,
  sanitizeHtml
};

