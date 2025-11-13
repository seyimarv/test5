import { createContext, useContext, ReactNode, useEffect } from "react";
import { useAuth, type AuthUser } from "../hooks/useAuth";
import { initializeAdminUser, hasAdminAutoLogin } from "./initializeAuth";

/**
 * Authentication Context
 *
 * Provides global authentication state throughout the application.
 * Wrap your app with AuthProvider to enable authentication.
 */

type AuthContextType = {
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: "user" | "admin" | "moderator"
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<AuthUser, "name" | "profileImage">>
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 *
 * Wrap your application with this provider to enable authentication.
 *
 * Usage:
 * ```tsx
 * import { AuthProvider } from './lib/AuthContext';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  // Auto-initialize admin user if configured
  // This works in iframes - localStorage is isolated to the iframe's origin (sandbox URL)
  useEffect(() => {
    const hasAutoLogin = hasAdminAutoLogin();

    if (hasAutoLogin) {
      initializeAdminUser()
        .then((result) => {
          if (result.error) {
            console.error(
              "[AuthProvider] ❌ Admin initialization error:",
              result.error
            );
          }
        })
        .catch((err) => {
          console.error("[AuthProvider] ❌ Failed to initialize admin:", err);
        });
    }
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * useAuthContext Hook
 *
 * Access authentication state and methods anywhere in your app.
 * Must be used within an AuthProvider.
 *
 * Usage:
 * ```tsx
 * import { useAuthContext } from './lib/AuthContext';
 *
 * function MyComponent() {
 *   const { currentUser, login, logout, isAuthenticated } = useAuthContext();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return <div>Welcome, {currentUser?.name}!</div>;
 * }
 * ```
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
