/**
 * Role-Based Access Control (RBAC) Configuration for Frontend
 *
 * Mirrors the backend permissions configuration.
 * Use this to show/hide UI elements based on user role.
 */

export const ROLES = {
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  CONTENT_SPECIALIST: 'content_specialist',
  VIEWER: 'viewer',
};

export const VALID_ROLES = Object.values(ROLES);

/**
 * Permission definitions for each role
 *
 * Permission types:
 * - true: Full access
 * - false: No access
 * - 'own': Can only access own resources
 */
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    dashboard: {
      read: true,
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    articles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    news: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    sections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    tags: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    tweets: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    settings: {
      read: true,
      update: true,
    },
    analytics: {
      read: true,
    },
  },

  [ROLES.CONTENT_MANAGER]: {
    dashboard: {
      read: true,
    },
    users: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    articles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    news: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    sections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    tags: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
    },
    tweets: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      publish: true,
    },
    settings: {
      read: false,
      update: false,
    },
    analytics: {
      read: true,
    },
  },

  [ROLES.CONTENT_SPECIALIST]: {
    dashboard: {
      read: true,
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
    },
    articles: {
      create: true,
      read: true,
      update: 'own',
      delete: 'own',
      list: true,
      publish: false,
    },
    news: {
      create: true,
      read: true,
      update: 'own',
      delete: 'own',
      list: true,
      publish: false,
    },
    sections: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    tags: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    tweets: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      publish: false,
    },
    settings: {
      read: false,
      update: false,
    },
    analytics: {
      read: false,
    },
  },

  [ROLES.VIEWER]: {
    dashboard: {
      read: true,
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
    },
    articles: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      publish: false,
    },
    news: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      publish: false,
    },
    sections: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    tags: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
    },
    tweets: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      publish: false,
    },
    settings: {
      read: false,
      update: false,
    },
    analytics: {
      read: false,
    },
  },
};

/**
 * Check if user has permission for an action
 * @param {string} role - User role
 * @param {string} resource - Resource name (e.g., 'articles', 'users')
 * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
 * @returns {boolean|string} true, false, or 'own'
 */
export function hasPermission(role, resource, action) {
  const normalizedRole = VALID_ROLES.includes(role) ? role : ROLES.VIEWER;
  const rolePermissions = PERMISSIONS[normalizedRole];

  if (!rolePermissions || !rolePermissions[resource]) {
    return false;
  }

  return rolePermissions[resource][action] || false;
}

/**
 * Check if user can perform action (simple true/false check)
 * Returns true if permission is true or 'own'
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean}
 */
export function canPerform(role, resource, action) {
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
export function isOwnershipBased(role, resource, action) {
  return hasPermission(role, resource, action) === 'own';
}

/**
 * Check if user can perform action on a specific resource
 * Takes into account ownership
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {number|string} resourceOwnerId - Owner ID of the resource
 * @param {number|string} currentUserId - Current user's ID
 * @returns {boolean}
 */
export function canPerformOnResource(role, resource, action, resourceOwnerId, currentUserId) {
  const permission = hasPermission(role, resource, action);

  // Full permission
  if (permission === true) {
    return true;
  }

  // Ownership-based permission
  if (permission === 'own') {
    return String(resourceOwnerId) === String(currentUserId);
  }

  return false;
}

/**
 * Check if user can publish content
 * @param {string} role - User role
 * @param {string} resource - Resource name ('articles', 'news', 'tweets')
 * @returns {boolean}
 */
export function canPublish(role, resource) {
  return hasPermission(role, resource, 'publish') === true;
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object} All permissions for the role
 */
export function getRolePermissions(role) {
  const normalizedRole = VALID_ROLES.includes(role) ? role : ROLES.VIEWER;
  return PERMISSIONS[normalizedRole] || PERMISSIONS[ROLES.VIEWER];
}

/**
 * Get role display name in Arabic
 * @param {string} role - Role code
 * @returns {string} Arabic role name
 */
export function getRoleDisplayName(role) {
  const names = {
    [ROLES.ADMIN]: 'مدير عام',
    [ROLES.CONTENT_MANAGER]: 'مدير المحتوى',
    [ROLES.CONTENT_SPECIALIST]: 'أخصائي محتوى',
    [ROLES.VIEWER]: 'مشاهد',
  };
  return names[role] || 'مشاهد';
}

/**
 * Get role badge color classes
 * @param {string} role - Role code
 * @returns {string} Tailwind CSS classes
 */
export function getRoleBadgeColor(role) {
  const colors = {
    [ROLES.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
    [ROLES.CONTENT_MANAGER]: 'bg-blue-100 text-blue-700 border-blue-200',
    [ROLES.CONTENT_SPECIALIST]: 'bg-green-100 text-green-700 border-green-200',
    [ROLES.VIEWER]: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[role] || colors[ROLES.VIEWER];
}

/**
 * Navigation items with required permissions
 */
export const NAVIGATION_PERMISSIONS = {
  '/dashboard': { resource: 'dashboard', action: 'read' },
  '/articles': { resource: 'articles', action: 'list' },
  '/news': { resource: 'news', action: 'list' },
  '/tweets': { resource: 'tweets', action: 'list' },
  '/sections': { resource: 'sections', action: 'list' },
  '/tags': { resource: 'tags', action: 'list' },
  '/users': { resource: 'users', action: 'list' },
  '/settings': { resource: 'settings', action: 'read' },
  '/insights': { resource: 'analytics', action: 'read' },
};

/**
 * Check if user can access a navigation route
 * @param {string} role - User role
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function canAccessRoute(role, path) {
  const permission = NAVIGATION_PERMISSIONS[path];
  if (!permission) {
    return true; // Allow access to routes without explicit permission
  }
  return canPerform(role, permission.resource, permission.action);
}

export default {
  ROLES,
  VALID_ROLES,
  hasPermission,
  canPerform,
  isOwnershipBased,
  canPerformOnResource,
  canPublish,
  getRolePermissions,
  getRoleDisplayName,
  getRoleBadgeColor,
  canAccessRoute,
  NAVIGATION_PERMISSIONS,
};
