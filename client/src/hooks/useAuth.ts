import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthUserResponse {
  id: number;
  email: string | null;
  firstName: string | null;
  profileImageUrl: string | null;
  isAuthenticated: boolean;
}

/**
 * Custom hook for managing user authentication state across the application.
 * 
 * This hook handles:
 * - Fetching current user session data from the backend
 * - Providing authentication status for route protection
 * - Caching user data to reduce API calls
 * - Managing loading states during authentication checks
 * 
 * The hook uses React Query for efficient state management and caching.
 * Session validation happens server-side via HTTP-only cookies.
 * 
 * @returns {Object} Authentication state and user data
 * @returns {AuthUserResponse | undefined} user - Current user data if authenticated
 * @returns {boolean} isLoading - True while checking authentication status
 * @returns {Error | null} error - Any error that occurred during auth check
 * @returns {boolean} isAuthenticated - True if user has valid session
 */
export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUserResponse>({
    queryKey: ["api", "auth", "user"],
    retry: false, // Don't retry failed auth checks to avoid infinite loops
    staleTime: 5 * 60 * 1000, // Cache auth data for 5 minutes to reduce server requests
  });

  return {
    user,
    isLoading,
    error,
    // Double-check authentication status from both user existence and server response
    isAuthenticated: !!user?.isAuthenticated,
  };
}