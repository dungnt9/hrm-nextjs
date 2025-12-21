/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    NEXT_PUBLIC_KEYCLOAK_URL:
      process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "hrm",
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID:
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "hrm-frontend",
    NEXT_PUBLIC_NOTIFICATION_HUB_URL:
      process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
      "http://localhost:5005/hubs/notification",
  },
};

module.exports = nextConfig;
