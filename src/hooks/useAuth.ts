import { useCallback, useEffect, useState } from "react";
import { createFlexibleRepository } from "../repositories/flexibleEntityRepository";

/**
 * AuthUser type matching the AuthUser entity
 */
export type AuthUser = {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin" | "moderator";
  sessionToken?: string;
  isActive: string;
  lastLogin?: string;
  profileImage?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Simple password hashing using Web Crypto API
 * In production, use a proper backend hashing library like bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a random session token
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Session expiration time: 30 days (in milliseconds)
 * Sessions expire after 30 days of inactivity
 */
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Get session expiry timestamp
 */
function getSessionExpiry(): string {
  return new Date(Date.now() + SESSION_EXPIRY_MS).toISOString();
}

/**
 * Check if a session has expired
 */
function isSessionExpired(expiryTimestamp: string | undefined): boolean {
  if (!expiryTimestamp) return true;
  return new Date(expiryTimestamp) < new Date();
}

/**
 * Custom hook for authentication operations
 *
 * Features:
 * - User signup with email/password
 * - User login with email/password
 * - Logout
 * - Session persistence (localStorage) with 30-day expiration
 * - Current user state management
 * - Automatic session expiration checking
 *
 * Security Note: Sessions are stored in localStorage and expire after 30 days.
 * See SECURITY.md for security considerations and recommendations.
 *
 * Usage:
 * ```tsx
 * const { currentUser, login, signup, logout, loading, error } = useAuth();
 *
 * // Signup
 * await signup("user@example.com", "password123", "John Doe");
 *
 * // Login
 * await login("user@example.com", "password123");
 *
 * // Logout
 * logout();
 * ```
 */
export const useAuth = () => {
  const repo = createFlexibleRepository({ entityType: "AuthUser" });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current user from session on mount and when session token changes
  useEffect(() => {
    const loadSession = async () => {
      console.log("[useAuth] Loading session...");
      setLoading(true);
      try {
        const sessionToken = localStorage.getItem("auth_session_token");
        const sessionExpiry = localStorage.getItem("auth_session_expiry");

        // Check if session has expired
        if (sessionExpiry && isSessionExpired(sessionExpiry)) {
          console.warn("[useAuth] ⚠️ Session expired, clearing...");
          localStorage.removeItem("auth_session_token");
          localStorage.removeItem("auth_session_expiry");
          setCurrentUser(null);
          return;
        }

        if (sessionToken) {
          // Use list() to get fresh data and filter by session token
          const allUsers = await repo.list<AuthUser>();
          const user = allUsers.find((u) => u.sessionToken === sessionToken);

          if (user) {
            console.log("[useAuth] ✅ User session loaded successfully");
            setCurrentUser(user);
          } else {
            console.warn(
              "[useAuth] ❌ No user found with matching session token"
            );
            // Invalid session token
            localStorage.removeItem("auth_session_token");
            localStorage.removeItem("auth_session_expiry");
            setCurrentUser(null);
          }
        } else {
          console.log("[useAuth] ⚠️ No session token found in localStorage");
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("[useAuth] ❌ ERROR: Failed to load session:", err);
        if (err instanceof Error) {
          console.error("[useAuth] Error details:", {
            message: err.message,
            stack: err.stack,
          });
        }
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for storage changes (when initializeAdminUser sets the token)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_session_token" || e.key === "auth_session_expiry") {
        console.log("[useAuth] Storage event detected, reloading session");
        loadSession();
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      console.log(
        "[useAuth] auth_session_updated event detected, reloading session"
      );
      loadSession();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_session_updated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "auth_session_updated",
        handleCustomStorageChange
      );
    };
  }, []);

  /**
   * Sign up a new user
   */
  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: "user" | "admin" | "moderator" = "user"
    ): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        // Check if user already exists - use list() to get fresh data
        const allUsers = await repo.list<AuthUser>();
        const existingUser = allUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
          const errorMsg = "User with this email already exists";
          setError(errorMsg);
          setLoading(false);
          return {
            success: false,
            error: errorMsg,
          };
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate session token
        const sessionToken = generateSessionToken();
        const sessionExpiry = getSessionExpiry();

        // Create user - double-check one more time right before creation
        const recheckUsers = await repo.list<AuthUser>();
        const recheckExisting = recheckUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (recheckExisting) {
          const errorMsg = "User with this email already exists";
          setError(errorMsg);
          setLoading(false);
          return {
            success: false,
            error: errorMsg,
          };
        }

        // Create user
        const newUser = await repo.create<AuthUser>({
          email: email.toLowerCase(), // Normalize email to lowercase
          passwordHash,
          name,
          role,
          sessionToken,
          isActive: "true",
          lastLogin: new Date().toISOString(),
        } as any);

        // Save session with expiry
        localStorage.setItem("auth_session_token", sessionToken);
        localStorage.setItem("auth_session_expiry", sessionExpiry);
        // Dispatch event to trigger session reload
        window.dispatchEvent(new Event("auth_session_updated"));
        setCurrentUser(newUser);

        return { success: true };
      } catch (err: any) {
        const errorMsg = err.message || "Failed to create account";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [repo]
  );

  /**
   * Log in an existing user
   */
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        // Find user by email - normalize to lowercase for comparison
        const allUsers = await repo.list<AuthUser>();
        const user = allUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
          setError("Invalid email or password");
          return { success: false, error: "Invalid email or password" };
        }

        // Check if account is active
        if (user.isActive !== "true") {
          setError("Account is deactivated");
          return { success: false, error: "Account is deactivated" };
        }

        // Verify password
        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
          setError("Invalid email or password");
          return { success: false, error: "Invalid email or password" };
        }

        // Generate new session token
        const sessionToken = generateSessionToken();
        const sessionExpiry = getSessionExpiry();

        // Update user with new session token and last login
        await repo.update<AuthUser>(user.id, {
          sessionToken,
          lastLogin: new Date().toISOString(),
        });

        // Save session with expiry
        localStorage.setItem("auth_session_token", sessionToken);
        localStorage.setItem("auth_session_expiry", sessionExpiry);
        // Dispatch event to trigger session reload
        window.dispatchEvent(new Event("auth_session_updated"));

        // Reload user with updated data
        const updatedUser = await repo.get<AuthUser>(user.id);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }

        return { success: true };
      } catch (err: any) {
        const errorMsg = err.message || "Failed to log in";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [repo]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(async () => {
    try {
      if (currentUser) {
        // Clear session token from database
        await repo.update<AuthUser>(currentUser.id, {
          sessionToken: "",
        });
      }
    } catch (err) {
      console.error("Failed to clear session:", err);
    } finally {
      // Clear local state regardless of DB update success
      localStorage.removeItem("auth_session_token");
      localStorage.removeItem("auth_session_expiry");
      setCurrentUser(null);
      setError(null);
    }
  }, [currentUser, repo]);

  /**
   * Update current user profile
   */
  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<AuthUser, "name" | "profileImage">>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) {
        return { success: false, error: "No user logged in" };
      }

      setLoading(true);
      setError(null);

      try {
        await repo.update<AuthUser>(currentUser.id, updates);
        const updatedUser = await repo.get<AuthUser>(currentUser.id);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
        return { success: true };
      } catch (err: any) {
        const errorMsg = err.message || "Failed to update profile";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [currentUser, repo]
  );

  /**
   * Change user password
   */
  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) {
        return { success: false, error: "No user logged in" };
      }

      setLoading(true);
      setError(null);

      try {
        // Verify current password
        const currentHash = await hashPassword(currentPassword);
        if (currentUser.passwordHash !== currentHash) {
          setError("Current password is incorrect");
          return { success: false, error: "Current password is incorrect" };
        }

        // Hash new password
        const newHash = await hashPassword(newPassword);

        // Update password
        await repo.update<AuthUser>(currentUser.id, {
          passwordHash: newHash,
        });

        return { success: true };
      } catch (err: any) {
        const errorMsg = err.message || "Failed to change password";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [currentUser, repo]
  );

  return {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    signup,
    login,
    logout,
    updateProfile,
    changePassword,
  };
};
