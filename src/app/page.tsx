"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { RootState } from "@/store";
import { login as loginApi } from "@/lib/auth";
import { setAuthenticated } from "@/store/slices/authSlice";

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      const { user, token } = await loginApi(username, password);
      dispatch(setAuthenticated({ user, token }));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
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

  if (isAuthenticated) {
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
        <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            HRM System
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            paragraph
            textAlign="center"
          >
            Human Resource Management System
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loginLoading}
              autoFocus
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginLoading}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loginLoading || !username || !password}
            >
              {loginLoading ? <CircularProgress size={24} /> : "Login"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
