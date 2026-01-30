/**
 * Authorization Middleware for Lambda Functions
 *
 * Provides authorization checks for RBAC system.
 */

const { forbidden } = require('./response');
const {
  getUserRole,
  getUserEmail,
  hasPermission,
  canPerform,
  isOwnershipBased,
  ROLES,
} = require('./permissions');
const db = require('./db');

/**
 * Check authorization for a resource action
 *
 * @param {object} event - Lambda event object
 * @param {string} resource - Resource name (e.g., 'articles', 'users')
 * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
 * @returns {object|null} Returns forbidden response if not authorized, null if authorized
 */
function checkAuthorization(event, resource, action) {
  const role = getUserRole(event);
  const claims = event.requestContext?.authorizer?.claims;

  console.log('checkAuthorization - Claims:', JSON.stringify(claims, null, 2));
  console.log('checkAuthorization - Role extracted:', role);
  console.log('checkAuthorization - Resource:', resource, 'Action:', action);
  console.log('checkAuthorization - canPerform result:', canPerform(role, resource, action));

  if (!canPerform(role, resource, action)) {
    console.log('checkAuthorization - DENIED for role:', role);
    return forbidden(`You do not have permission to ${action} ${resource}. Your role: ${role}`);
  }

  console.log('checkAuthorization - ALLOWED for role:', role);
  return null; // Authorized
}

/**
 * Check ownership-based authorization
 *
 * For actions that require ownership verification (e.g., content_specialist editing their own articles)
 *
 * @param {object} event - Lambda event object
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {number|string} resourceOwnerId - The user ID who owns the resource
 * @param {number|string} currentUserId - The current user's database ID
 * @returns {object|null} Returns forbidden response if not authorized, null if authorized
 */
function checkOwnershipAuthorization(event, resource, action, resourceOwnerId, currentUserId) {
  const role = getUserRole(event);
  const permission = hasPermission(role, resource, action);

  // Full permission - no ownership check needed
  if (permission === true) {
    return null;
  }

  // Ownership-based permission
  if (permission === 'own') {
    // Convert to numbers for comparison (database IDs)
    const ownerId = parseInt(resourceOwnerId, 10);
    const userId = parseInt(currentUserId, 10);

    if (ownerId === userId) {
      return null; // User owns the resource
    }

    return forbidden(`You can only ${action} your own ${resource}`);
  }

  // No permission at all
  return forbidden(`You do not have permission to ${action} ${resource}`);
}

/**
 * Get current user's database ID from their email
 *
 * @param {string} email - User email from Cognito
 * @returns {Promise<number|null>} User's database ID or null
 */
async function getUserDbId(email) {
  if (!email) {
    console.log('getUserDbId: No email provided');
    return null;
  }

  // Normalize email: trim whitespace and convert to lowercase for comparison
  const normalizedEmail = email.trim().toLowerCase();
  console.log('getUserDbId: Looking up user with email:', normalizedEmail);

  // Use LOWER() for case-insensitive comparison
  const user = await db.queryOne(
    'SELECT s7b_user_id, s7b_user_email FROM s7b_user WHERE LOWER(TRIM(s7b_user_email)) = ? AND s7b_user_deleted_at IS NULL',
    [normalizedEmail]
  );

  console.log('getUserDbId: Found user:', user ? { id: user.s7b_user_id, email: user.s7b_user_email } : null);

  return user ? user.s7b_user_id : null;
}

/**
 * Check if the current user is the owner of a resource
 *
 * @param {object} event - Lambda event object
 * @param {string} tableName - Database table name
 * @param {string} idColumn - ID column name
 * @param {number|string} resourceId - Resource ID to check
 * @param {string} ownerColumn - Column name that stores owner ID (default: 's7b_user_id')
 * @returns {Promise<{isOwner: boolean, ownerId: number|null, currentUserId: number|null}>}
 */
async function checkResourceOwnership(event, tableName, idColumn, resourceId, ownerColumn = 's7b_user_id') {
  const email = getUserEmail(event);
  const currentUserId = await getUserDbId(email);

  if (!currentUserId) {
    return { isOwner: false, ownerId: null, currentUserId: null };
  }

  const resource = await db.queryOne(
    `SELECT ${ownerColumn} as owner_id FROM ${tableName} WHERE ${idColumn} = ?`,
    [resourceId]
  );

  if (!resource) {
    return { isOwner: false, ownerId: null, currentUserId };
  }

  return {
    isOwner: resource.owner_id === currentUserId,
    ownerId: resource.owner_id,
    currentUserId,
  };
}

/**
 * Full authorization check with ownership verification
 *
 * Use this for update/delete operations that may require ownership checks
 *
 * @param {object} event - Lambda event object
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {string} tableName - Database table name
 * @param {string} idColumn - ID column name
 * @param {number|string} resourceId - Resource ID
 * @param {string} ownerColumn - Owner column name (default: 's7b_user_id')
 * @returns {Promise<{authorized: boolean, response: object|null, currentUserId: number|null}>}
 */
async function authorizeWithOwnership(event, resource, action, tableName, idColumn, resourceId, ownerColumn = 's7b_user_id') {
  const role = getUserRole(event);

  // First check basic permission
  if (!canPerform(role, resource, action)) {
    return {
      authorized: false,
      response: forbidden(`You do not have permission to ${action} ${resource}`),
      currentUserId: null,
    };
  }

  // If ownership-based, verify ownership
  if (isOwnershipBased(role, resource, action)) {
    const ownership = await checkResourceOwnership(event, tableName, idColumn, resourceId, ownerColumn);

    if (!ownership.currentUserId) {
      return {
        authorized: false,
        response: forbidden('Unable to verify user identity'),
        currentUserId: null,
      };
    }

    if (!ownership.isOwner) {
      return {
        authorized: false,
        response: forbidden(`You can only ${action} your own ${resource}`),
        currentUserId: ownership.currentUserId,
      };
    }

    return {
      authorized: true,
      response: null,
      currentUserId: ownership.currentUserId,
    };
  }

  // Full permission, get user ID for reference
  const email = getUserEmail(event);
  const currentUserId = await getUserDbId(email);

  return {
    authorized: true,
    response: null,
    currentUserId,
  };
}

/**
 * Check if user can publish content
 *
 * @param {object} event - Lambda event object
 * @param {string} resource - Resource name ('articles', 'news', 'tweets')
 * @returns {boolean}
 */
function canPublish(event, resource) {
  const role = getUserRole(event);
  return hasPermission(role, resource, 'publish') === true;
}

/**
 * Filter status change based on publish permission
 *
 * If user doesn't have publish permission, they can only set status to 'draft'
 *
 * @param {object} event - Lambda event object
 * @param {string} resource - Resource name
 * @param {string} requestedStatus - Status requested by user
 * @returns {string} Allowed status
 */
function filterStatusChange(event, resource, requestedStatus) {
  if (!canPublish(event, resource) && requestedStatus === 'published') {
    return 'draft'; // Downgrade to draft if can't publish
  }
  return requestedStatus;
}

module.exports = {
  checkAuthorization,
  checkOwnershipAuthorization,
  getUserDbId,
  checkResourceOwnership,
  authorizeWithOwnership,
  canPublish,
  filterStatusChange,
};
