/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Defines permissions for each role in the system.
 *
 * Roles (highest to lowest):
 * - admin: Full system access
 * - content_manager: Manage all content, cannot manage users/settings
 * - content_specialist: Create/manage own content only
 * - viewer: Read-only access
 */

const ROLES = {
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  CONTENT_SPECIALIST: 'content_specialist',
  VIEWER: 'viewer',
};

const VALID_ROLES = Object.values(ROLES);

/**
 * Permission definitions for each role
 *
 * Permission types:
 * - true: Full access
 * - false: No access
 * - 'own': Can only access own resources (based on s7b_user_id)
 */
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    // User Management
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    // Articles
    articles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // News
    news: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // Sections (Categories)
    sections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    // Tags
    tags: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    // Tweets
    tweets: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // Settings
    settings: {
      read: true,
      update: true,
    },
    // Analytics
    analytics: {
      read: true,
    },
  },

  [ROLES.CONTENT_MANAGER]: {
    // User Management - Limited
    users: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    // Articles - Full content access
    articles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // News - Full content access
    news: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // Sections - Can manage
    sections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    // Tags - Can manage
    tags: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    // Tweets - Can manage
    tweets: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    // Settings - No access
    settings: {
      read: false,
      update: false,
    },
    // Analytics
    analytics: {
      read: true,
    },
  },

  [ROLES.CONTENT_SPECIALIST]: {
    // User Management - No access
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
    },
    // Articles - Own content only
    articles: {
      create: true,
      read: true,
      update: 'own',
      delete: 'own',
      list: true,
      publish: false,
    },
    // News - Own content only
    news: {
      create: true,
      read: true,
      update: 'own',
      delete: 'own',
      list: true,
      publish: false,
    },
    // Sections - Read only
    sections: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    // Tags - Read only
    tags: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    // Tweets - No access
    tweets: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      publish: false,
    },
    // Settings - No access
    settings: {
      read: false,
      update: false,
    },
    // Analytics - No access
    analytics: {
      read: false,
    },
  },

  [ROLES.VIEWER]: {
    // User Management - No access
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
    },
    // Articles - Read only
    articles: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      publish: false,
    },
    // News - Read only
    news: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      publish: false,
    },
    // Sections - Read only
    sections: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    // Tags - Read only
    tags: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    // Tweets - No access
    tweets: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      publish: false,
    },
    // Settings - No access
    settings: {
      read: false,
      update: false,
    },
    // Analytics - No access
    analytics: {
      read: false,
    },
  },
};

/**
 * Get user role from Lambda event
 * @param {object} event - Lambda event object
 * @returns {string} User role (defaults to 'viewer')
 */
function getUserRole(event) {
  return event.requestContext?.authorizer?.claims?.['custom:role'] || ROLES.VIEWER;
}

/**
 * Get user ID from Lambda event (Cognito sub or email)
 * @param {object} event - Lambda event object
 * @returns {string|null} User identifier
 */
function getUserId(event) {
  const claims = event.requestContext?.authorizer?.claims;
  return claims?.sub || claims?.email || null;
}

/**
 * Get user email from Lambda event
 * @param {object} event - Lambda event object
 * @returns {string|null} User email
 */
function getUserEmail(event) {
  return event.requestContext?.authorizer?.claims?.email || null;
}

/**
 * Check if user has permission for an action
 * @param {string} role - User role
 * @param {string} resource - Resource name (e.g., 'articles', 'users')
 * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
 * @returns {boolean|string} true, false, or 'own'
 */
function hasPermission(role, resource, action) {
  const normalizedRole = VALID_ROLES.includes(role) ? role : ROLES.VIEWER;
  const rolePermissions = PERMISSIONS[normalizedRole];

  if (!rolePermissions || !rolePermissions[resource]) {
    return false;
  }

  return rolePermissions[resource][action] || false;
}

/**
 * Check if user can perform action (simple true/false check)
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean}
 */
function canPerform(role, resource, action) {
  const permission = hasPermission(role, resource, action);
  return permission === true || permission === 'own';
}

/**
 * Check if permission is ownership-based
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean}
 */
function isOwnershipBased(role, resource, action) {
  return hasPermission(role, resource, action) === 'own';
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object} All permissions for the role
 */
function getRolePermissions(role) {
  const normalizedRole = VALID_ROLES.includes(role) ? role : ROLES.VIEWER;
  return PERMISSIONS[normalizedRole] || PERMISSIONS[ROLES.VIEWER];
}

/**
 * Validate role value
 * @param {string} role - Role to validate
 * @returns {boolean}
 */
function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

module.exports = {
  ROLES,
  VALID_ROLES,
  PERMISSIONS,
  getUserRole,
  getUserId,
  getUserEmail,
  hasPermission,
  canPerform,
  isOwnershipBased,
  getRolePermissions,
  isValidRole,
};
