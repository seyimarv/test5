/**
 * Auto-login initialization for Shipper-generated apps
 *
 * When a user generates an app in Shipper, they should automatically be
 * logged in as an admin with their Shipper account credentials.
 *
 * This file handles:
 * - Retrieving the pre-created admin user from the database (created server-side)
 * - Auto-logging them in on first load using localStorage
 * - Seamless experience without manual signup
 *
 * NOTE: This works in iframes! localStorage is scoped to the app's origin (sandbox URL),
 * and the iframe's sandbox attribute includes "allow-same-origin" which enables
 * localStorage access. The app runs independently inside the iframe with its own
 * isolated localStorage, which is exactly what we need.
 */

import { createFlexibleRepository } from "../repositories/flexibleEntityRepository";
import type { AuthUser } from "../hooks/useAuth";

const ADMIN_INITIALIZED_KEY = "shipper_admin_initialized";
const AUTH_SESSION_TOKEN = "auth_session_token";

/**
 * Generate a random session token
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Get admin user info from environment variables
 * These are injected by Shipper when creating the sandbox
 */
function getAdminInfo(): { name: string; email: string } | null {
  // Check environment variables (set by Shipper during sandbox creation)
  const name = import.meta.env.VITE_ADMIN_NAME;
  const email = import.meta.env.VITE_ADMIN_EMAIL;

  if (name && email) {
    return { name, email };
  }

  // Fallback: check for hardcoded values in window (for development)
  if (typeof window !== "undefined" && (window as any).__SHIPPER_ADMIN__) {
    return (window as any).__SHIPPER_ADMIN__;
  }

  return null;
}

/**
 * Initialize admin user and auto-login
 *
 * This function:
 * 1. Checks if admin has already been initialized (runs only once)
 * 2. Gets admin info from environment variables
 * 3. Retrieves the pre-created admin user from database
 * 4. Auto-logs them in using their session token
 *
 * Note: The admin user is created server-side during sandbox creation,
 * so this function just retrieves the existing user and logs them in.
 *
 * Call this in your App or main component on mount.
 */
export async function initializeAdminUser(): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    // Check if already initialized
    const alreadyInitialized = localStorage.getItem(ADMIN_INITIALIZED_KEY);

    if (alreadyInitialized === "true") {
      return { success: true };
    }

    // Get admin info from environment
    const adminInfo = getAdminInfo();
    if (!adminInfo) {
      return { success: true };
    }

    const { email } = adminInfo;
    const normalizedEmail = email.toLowerCase();
    const repo = createFlexibleRepository({ entityType: "AuthUser" });

    // Find the admin user (should have been created server-side during sandbox creation)
    // Use list() to get fresh data and filter with case-insensitive comparison
    const allUsers = await repo.list<AuthUser>();

    const adminUser = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!adminUser) {
      // Will be created on next app load when database is ready
      return { success: true };
    }

    // Ensure user has a session token
    if (!adminUser.sessionToken) {
      const sessionToken = generateSessionToken();
      await repo.update<AuthUser>(adminUser.id, {
        sessionToken,
        lastLogin: new Date().toISOString(),
      });
      adminUser.sessionToken = sessionToken;
    }

    // Set session token in localStorage to auto-login
    // Sessions expire after 30 days
    const sessionExpiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    localStorage.setItem(AUTH_SESSION_TOKEN, adminUser.sessionToken);
    localStorage.setItem("auth_session_expiry", sessionExpiry);
    localStorage.setItem(ADMIN_INITIALIZED_KEY, "true");

    // Dispatch custom event to trigger session reload in useAuth hook
    // (storage events only fire in other tabs/windows, not same tab)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth_session_updated"));
    }

    return { success: true, user: adminUser };
  } catch (error) {
    console.error(
      "[initializeAdminUser] ❌ ERROR: Failed to initialize admin user:",
      error
    );
    if (error instanceof Error) {
      console.error("[initializeAdminUser] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if app has admin auto-login configured
 */
export function hasAdminAutoLogin(): boolean {
  return getAdminInfo() !== null;
}

/**
 * Get admin info for display purposes
 */
export function getConfiguredAdminInfo(): {
  name: string;
  email: string;
} | null {
  return getAdminInfo();
}

/**
 * Reset admin initialization (useful for development/testing)
 */
export function resetAdminInitialization(): void {
  localStorage.removeItem(ADMIN_INITIALIZED_KEY);
  console.log("[Shipper] Admin initialization reset");
}
