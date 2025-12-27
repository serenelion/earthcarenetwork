const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL as
  | string
  | undefined;
const SUPABASE_PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_REF as
  | string
  | undefined;

const mapEndpointToFunction = (url: URL): { url: string; isFunction: boolean } => {
  if (!FUNCTIONS_BASE_URL) {
    return { url: url.toString(), isFunction: false };
  }

  const path = url.pathname;
  const searchParams = url.searchParams;

  if (path === "/api/auth/user") {
    return { url: `${FUNCTIONS_BASE_URL}/auth-user${url.search}`, isFunction: true };
  }

  if (path === "/api/enterprises") {
    return { url: `${FUNCTIONS_BASE_URL}/enterprises${url.search}`, isFunction: true };
  }

  if (path === "/api/favorites") {
    return { url: `${FUNCTIONS_BASE_URL}/favorites${url.search}`, isFunction: true };
  }

  if (path.startsWith("/api/favorites/")) {
    const enterpriseId = path.split("/").pop() ?? "";
    searchParams.set("enterpriseId", enterpriseId);
    return {
      url: `${FUNCTIONS_BASE_URL}/favorites?${searchParams.toString()}`,
      isFunction: true,
    };
  }

  if (path === "/api/favorites/stats") {
    return {
      url: `${FUNCTIONS_BASE_URL}/favorites-stats${url.search}`,
      isFunction: true,
    };
  }

  if (path.startsWith("/api/enterprises/") && path.endsWith("/favorite-status")) {
    const [, , , enterpriseId] = path.split("/");
    searchParams.set("enterpriseId", enterpriseId ?? "");
    return {
      url: `${FUNCTIONS_BASE_URL}/favorite-status?${searchParams.toString()}`,
      isFunction: true,
    };
  }

  return { url: url.toString(), isFunction: false };
};

const getSupabaseToken = (): string | null => {
  const directToken = localStorage.getItem("supabaseAccessToken");
  if (directToken) return directToken;

  if (SUPABASE_PROJECT_REF) {
    const storageKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return (
          parsed?.access_token ||
          parsed?.currentSession?.access_token ||
          parsed?.currentSession?.provider_token ||
          null
        );
      } catch (error) {
        console.warn("Failed to parse Supabase token from storage", error);
      }
    }
  }

  return null;
};

export const resolveRequest = (
  input: string,
  hasBody: boolean,
): { url: string; isFunction: boolean; headers: HeadersInit; credentials: RequestCredentials } => {
  const parsed = new URL(input, window.location.origin);
  const { url, isFunction } = mapEndpointToFunction(parsed);

  const headers: Record<string, string> = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (isFunction) {
    const token = getSupabaseToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return {
    url,
    isFunction,
    headers,
    credentials: isFunction ? "omit" : "include",
  };
};

export const fetchWithGateway = async (
  input: string,
  init: RequestInit = {},
): Promise<Response> => {
  const { url, headers, credentials } = resolveRequest(
    input,
    !!init.body,
  );

  const mergedHeaders = {
    ...(init.headers || {}),
    ...headers,
  } as HeadersInit;

  return fetch(url, {
    ...init,
    headers: mergedHeaders,
    credentials,
  });
};
