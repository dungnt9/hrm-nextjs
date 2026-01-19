"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccountCircle as ProfileIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { authApi, employeeApi, notificationApi } from "@/lib/api";
import { setAuthenticated } from "@/store/slices/authSlice";
import dayjs from "dayjs";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    team: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchNotificationSettings();
    }
  }, [user?.id]);

  const fetchNotificationSettings = async () => {
    try {
      const settings = await notificationApi.getSettings();
      if (settings) {
        setNotificationSettings({
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          pushNotifications: settings.pushNotifications ?? true,
        });
      }
    } catch (err) {
      // Use default settings if API fails
      console.log("Using default notification settings");
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeApi.getById(user?.id || "");
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        position: data.position || "",
        department: data.departmentName || "",
        team: data.teamName || "",
      });
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Failed to load profile");
      // Set default values from Redux state
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: (user as any).phone || "",
          position: (user as any).position || "",
          department: "",
          team: "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await employeeApi.update(user?.id || "", formData);

      // Update Redux state
      dispatch(
        setAuthenticated({
          user: { ...user, ...formData } as any,
          token: localStorage.getItem("access_token") || "",
        })
      );

      setIsEditing(false);
      setProfile({ ...profile, ...formData });
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationSettingsChange = async (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings],
    };
    setNotificationSettings(newSettings);

    try {
      setSavingNotifications(true);
      setNotificationSuccess(false);
      await notificationApi.updateSettings(newSettings);
      setNotificationSuccess(true);
      setTimeout(() => setNotificationSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save notification settings:", err);
      // Revert on error
      setNotificationSettings(notificationSettings);
    } finally {
      setSavingNotifications(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Header Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: "primary.main",
                    fontSize: "2rem",
                  }}
                >
                  {formData.firstName?.[0]}
                  {formData.lastName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <Box>
                      <Typography variant="h5">
                        {formData.firstName} {formData.lastName}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        gutterBottom
                      >
                        {formData.position || "Employee"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Employee ID: {profile?.employeeCode || user?.id}
                      </Typography>
                      {profile?.joinDate && (
                        <Typography variant="body2" color="text.secondary">
                          Joined:{" "}
                          {dayjs(profile.joinDate).format("MMMM DD, YYYY")}
                        </Typography>
                      )}
                    </Box>
                    {!isEditing && (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ProfileIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Profile Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name *"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name *"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email *"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={formData.department}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Team"
                      value={formData.team}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={submitting}
                      >
                        {submitting ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setIsEditing(false);
                          fetchProfile();
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.firstName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.phone || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Position
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.position || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.department || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Team
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.team || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Security Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Security</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <NotificationsIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Notifications</Typography>
                </Box>
                {savingNotifications && (
                  <CircularProgress size={20} />
                )}
                {notificationSuccess && (
                  <Typography variant="caption" color="success.main">
                    Saved!
                  </Typography>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={() =>
                        handleNotificationSettingsChange("emailNotifications")
                      }
                      disabled={savingNotifications}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onChange={() =>
                        handleNotificationSettingsChange("smsNotifications")
                      }
                      disabled={savingNotifications}
                    />
                  }
                  label="SMS Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={() =>
                        handleNotificationSettingsChange("pushNotifications")
                      }
                      disabled={savingNotifications}
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password *"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password *"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password *"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
