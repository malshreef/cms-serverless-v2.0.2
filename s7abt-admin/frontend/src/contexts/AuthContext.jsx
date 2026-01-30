import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession, fetchUserAttributes, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import {
  canPerform,
  canPerformOnResource,
  canPublish,
  isOwnershipBased,
  getRolePermissions,
  canAccessRoute,
  getRoleDisplayName,
} from '../lib/permissions';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      // Fetch user attributes to get name and email
      const attributes = await fetchUserAttributes();

      setUser({
        username: currentUser.username,
        userId: currentUser.userId,
        signInDetails: currentUser.signInDetails,
        groups: session.tokens?.accessToken?.payload['cognito:groups'] || [],
        // Add user attributes (name, email, etc.)
        name: attributes.name || null,
        email: attributes.email || null,
        givenName: attributes.given_name || null,
        familyName: attributes.family_name || null,
        // Add role from custom attributes
        role: attributes['custom:role'] || 'viewer',
      });
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password,
      });

      if (isSignedIn) {
        await checkAuth();
        return { success: true };
      }

      // Handle different next steps
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return {
          success: false,
          requiresNewPassword: true,
          message: 'You must change your password',
        };
      }

      return {
        success: false,
        message: 'Additional authentication steps required',
      };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const resetPasswordRequest = async (username) => {
    try {
      const output = await resetPassword({ username });
      const { nextStep } = output;
      return { success: true, nextStep };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { success: false, message: error.message };
    }
  };

  const resetPasswordConfirm = async (username, newPassword, confirmationCode) => {
    try {
      await confirmResetPassword({ username, newPassword, confirmationCode });
      return { success: true };
    } catch (error) {
      console.error('Error confirming password reset:', error);
      return { success: false, message: error.message };
    }
  };

  // Memoized permission helpers based on user role
  const permissions = useMemo(() => {
    const role = user?.role || 'viewer';

    return {
      // Check if user can perform an action on a resource
      can: (resource, action) => canPerform(role, resource, action),

      // Check if user can perform action on a specific resource (with ownership)
      canOnResource: (resource, action, resourceOwnerId, currentUserId) =>
        canPerformOnResource(role, resource, action, resourceOwnerId, currentUserId || user?.userId),

      // Check if user can publish content
      canPublish: (resource) => canPublish(role, resource),

      // Check if permission is ownership-based
      isOwnershipBased: (resource, action) => isOwnershipBased(role, resource, action),

      // Check if user can access a route
      canAccessRoute: (path) => canAccessRoute(role, path),

      // Get all permissions for current role
      getAll: () => getRolePermissions(role),

      // Get role display name
      getRoleDisplayName: () => getRoleDisplayName(role),
    };
  }, [user?.role, user?.userId]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    resetPasswordRequest,
    resetPasswordConfirm,
    checkAuth,
    isAuthenticated: !!user,
    permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

