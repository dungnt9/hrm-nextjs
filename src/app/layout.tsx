"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { ApolloProvider } from "@apollo/client";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { store } from "@/store";
import { apolloClient } from "@/lib/apollo";
import AuthProvider from "@/components/providers/AuthProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import Layout from "@/components/layout/Layout";
import "./globals.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <CssBaseline />
                <AuthProvider>
                  <NotificationProvider>
                    <Layout>{children}</Layout>
                  </NotificationProvider>
                </AuthProvider>
              </LocalizationProvider>
            </ThemeProvider>
          </ApolloProvider>
        </Provider>
      </body>
    </html>
  );
}
