"use client";

import { useEffect, useState, ReactNode } from "react";
import { useDispatch } from "react-redux";
import {
  initKeycloak,
  getUserInfo,
  getToken,
  isAuthenticated,
} from "@/lib/keycloak";
import {
  setAuthenticated,
  setUnauthenticated,
  setLoading,
} from "@/store/slices/authSlice";
import { CircularProgress, Box } from "@mui/material";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = await initKeycloak();

        if (authenticated) {
          const user = getUserInfo();
          const token = getToken();

          if (user && token) {
            dispatch(
              setAuthenticated({
                user: {
                  id: user.id || "",
                  username: user.username || "",
                  email: user.email || "",
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                  roles: user.roles || [],
                },
                token,
              })
            );
          }
        } else {
          dispatch(setUnauthenticated());
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        dispatch(setUnauthenticated());
      } finally {
        dispatch(setLoading(false));
        setInitialized(true);
      }
    };

    init();
  }, [dispatch]);

  if (!initialized) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
