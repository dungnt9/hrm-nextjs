const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Simple JWT decode without external library
function decodeJwt<T>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface DecodedToken {
  sub: string;
  preferred_username: string;
  email: string;
  given_name: string;
  family_name: string;
  realm_access?: {
    roles: string[];
  };
  exp: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

const TOKEN_KEY = "hrm_access_token";
const REFRESH_TOKEN_KEY = "hrm_refresh_token";

// Token storage
export const saveTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt<DecodedToken>(token);
  if (!decoded) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Get user info from token
export const getUserFromToken = (token: string): User | null => {
  const decoded = decodeJwt<DecodedToken>(token);
  if (!decoded) return null;
  return {
    id: decoded.sub,
    username: decoded.preferred_username || "",
    email: decoded.email || "",
    firstName: decoded.given_name || "",
    lastName: decoded.family_name || "",
    roles: decoded.realm_access?.roles || [],
  };
};

// Login API
export const login = async (
  username: string,
  password: string
): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Invalid username or password");
  }

  const data: TokenResponse = await response.json();

  if (!data.accessToken) {
    throw new Error("No access token received");
  }

  saveTokens(data.accessToken, data.refreshToken);

  const user = getUserFromToken(data.accessToken);
  if (!user) {
    throw new Error("Failed to decode user info");
  }

  return { user, token: data.accessToken };
};

// Refresh token API
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data: TokenResponse = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
};

// Logout API
export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore logout errors
    }
  }

  clearTokens();
};

// Check auth status on load
export const checkAuthStatus = async (): Promise<{ user: User; token: string } | null> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(accessToken)) {
    // Try to refresh
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return null;
    }

    const user = getUserFromToken(newToken);
    if (!user) {
      return null;
    }

    return { user, token: newToken };
  }

  const user = getUserFromToken(accessToken);
  if (!user) {
    clearTokens();
    return null;
  }

  return { user, token: accessToken };
};

// Get valid token (refresh if needed)
export const getValidToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  if (isTokenExpired(accessToken)) {
    return await refreshAccessToken();
  }

  return accessToken;
};
