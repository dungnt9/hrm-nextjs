import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "hrm",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "hrm-frontend",
};

let keycloakInstance: Keycloak | null = null;

export const getKeycloak = (): Keycloak => {
  if (typeof window === "undefined") {
    throw new Error("Keycloak can only be initialized on the client side");
  }

  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

export const initKeycloak = async (): Promise<boolean> => {
  const keycloak = getKeycloak();

  try {
    const authenticated = await keycloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri:
        typeof window !== "undefined"
          ? `${window.location.origin}/silent-check-sso.html`
          : undefined,
      pkceMethod: "S256",
    });

    if (authenticated) {
      // Set up token refresh
      setInterval(() => {
        keycloak.updateToken(60).catch(() => {
          console.log("Failed to refresh token");
        });
      }, 30000);
    }

    return authenticated;
  } catch (error) {
    console.error("Keycloak init error:", error);
    return false;
  }
};

export const login = () => {
  const keycloak = getKeycloak();
  keycloak.login();
};

export const logout = () => {
  const keycloak = getKeycloak();
  keycloak.logout({ redirectUri: window.location.origin });
};

export const getToken = (): string | undefined => {
  const keycloak = getKeycloak();
  return keycloak.token;
};

export const isAuthenticated = (): boolean => {
  const keycloak = getKeycloak();
  return keycloak.authenticated || false;
};

export const hasRole = (role: string): boolean => {
  const keycloak = getKeycloak();
  return keycloak.hasRealmRole(role);
};

export const getUserInfo = () => {
  const keycloak = getKeycloak();
  if (keycloak.tokenParsed) {
    return {
      id: keycloak.tokenParsed.sub,
      username: keycloak.tokenParsed.preferred_username,
      email: keycloak.tokenParsed.email,
      firstName: keycloak.tokenParsed.given_name,
      lastName: keycloak.tokenParsed.family_name,
      roles: keycloak.tokenParsed.realm_access?.roles || [],
    };
  }
  return null;
};
