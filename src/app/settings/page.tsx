"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
} from "@mui/material";

export default function SettingsPage() {
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    language: "en",
    timezone: "UTC",
  });

  const handleSaveSettings = () => {
    // TODO: Implement save settings
    setNotification({
      type: "success",
      message: "Settings saved successfully",
    });

    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {notification && (
        <Alert severity={notification.type} sx={{ mb: 3 }}>
          {notification.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="Email Notifications"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pushNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="Push Notifications"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.weeklyReports}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        weeklyReports: e.target.checked,
                      })
                    }
                  />
                }
                label="Weekly Reports"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Language"
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                margin="normal"
                select
                SelectProps={{ native: true }}
              >
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </TextField>

              <TextField
                fullWidth
                label="Timezone"
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
