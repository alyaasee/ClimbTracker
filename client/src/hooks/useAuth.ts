import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/auth/user");
        return response as AuthUser;
      } catch (error) {
        // If user is not authenticated, return null instead of throwing
        return null;
      }
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user?.isAuthenticated,
    error,
  };
}