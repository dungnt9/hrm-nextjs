"use client";

import { useEffect, useState, ReactNode } from "react";
import { useDispatch } from "react-redux";
import { checkAuthStatus, refreshAccessToken, getAccessToken } from "@/lib/auth";
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
        const authData = await checkAuthStatus();

        if (authData) {
          dispatch(
            setAuthenticated({
              user: authData.user,
              token: authData.token,
            })
          );

          // Setup token refresh interval
          const refreshInterval = setInterval(async () => {
            const newToken = await refreshAccessToken();
            if (newToken) {
              dispatch(
                setAuthenticated({
                  user: authData.user,
                  token: newToken,
                })
              );
            }
          }, 4 * 60 * 1000); // Refresh every 4 minutes

          // Cleanup on unmount
          return () => clearInterval(refreshInterval);
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
