"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { RootState } from "@/store";
import { login } from "@/lib/keycloak";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h3" component="h1" gutterBottom>
            HRM System
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Human Resource Management System
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={login}
            sx={{ mt: 2 }}
          >
            Login with Keycloak
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
