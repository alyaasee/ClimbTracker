import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
 * - Clearing all cached data when user changes to prevent data leakage
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
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<number | null>(null);
  
  const { data: user, isLoading, error } = useQuery<AuthUserResponse>({
    queryKey: ["api", "auth", "user"],
    queryFn: () => fetch('/api/auth/user', { credentials: 'include' }).then(res => res.json()),
    retry: false, // Don't retry failed auth checks to avoid infinite loops
    staleTime: 5 * 60 * 1000, // Cache auth data for 5 minutes to reduce server requests
  });

  // Critical security feature: Clear all cached data when user changes
  // This prevents data leakage between different user accounts
  useEffect(() => {
    if (user?.id && previousUserIdRef.current !== null && previousUserIdRef.current !== user.id) {
      console.log(`🔄 User changed from ${previousUserIdRef.current} to ${user.id}, clearing all cached data`);
      // Clear entire query cache to prevent any cross-user data contamination
      queryClient.clear();
      // Force immediate refresh of all data for the new user
      queryClient.invalidateQueries();
    }
    
    if (user?.id) {
      previousUserIdRef.current = user.id;
    }
  }, [user?.id, queryClient]);

  return {
    user,
    isLoading,
    error,
    // Double-check authentication status from both user existence and server response
    isAuthenticated: !!user?.isAuthenticated,
  };
}