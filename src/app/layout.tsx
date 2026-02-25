"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { ApolloProvider } from "@apollo/client";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { store } from "@/store";
import { apolloClient } from "@/lib/apollo";
import AuthProvider from "@/components/providers/AuthProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import Layout from "@/components/layout/CollapsibleLayout";
import "./globals.css";

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
            <ThemeProvider>
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
