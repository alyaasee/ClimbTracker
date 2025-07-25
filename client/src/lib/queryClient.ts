import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const json = await res.json();
      errorMessage = json.error || json.message || res.statusText;
    } catch {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  options: { method?: string; body?: any } = {}
) {
  const { method = "GET", body } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);

  // Handle errors with better error messages
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      // If response isn't JSON, use status text
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    // Throw error with server's error message
    const errorMessage = errorData?.error || errorData?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});