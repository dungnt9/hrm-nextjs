"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Badge,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Check as MarkReadIcon,
  MarkEmailRead as MarkAllReadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { notificationApi } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationApi.getAll({ pageSize: 50 });

      // Format notifications
      const formattedNotifications = (data?.data || data || []).map(
        (n: any) => ({
          id: n.id,
          title: n.title || n.type,
          message: n.message || n.content,
          type: n.type || "info",
          read: n.isRead || n.read || false,
          createdAt: n.createdAt || n.timestamp || new Date().toISOString(),
          icon: n.icon,
        })
      );

      setNotifications(formattedNotifications);
      setUnreadCount(
        formattedNotifications.filter((n: any) => !n.read).length
      );
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err.message || "Failed to load notifications");
      // Set sample data for demo
      setNotifications([
        {
          id: "1",
          title: "Leave Request Approved",
          message: "Your leave request for Dec 25-26 has been approved",
          type: "success",
          read: true,
          createdAt: dayjs().subtract(2, "hours").toISOString(),
        },
        {
          id: "2",
          title: "New Team Member",
          message: "John Doe has been added to your team",
          type: "info",
          read: true,
          createdAt: dayjs().subtract(1, "day").toISOString(),
        },
        {
          id: "3",
          title: "Attendance Alert",
          message: "You were marked late on Dec 23",
          type: "warning",
          read: false,
          createdAt: dayjs().subtract(3, "days").toISOString(),
        },
      ]);
      setUnreadCount(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deletedNotif = notifications.find((n) => n.id === id);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <SuccessIcon sx={{ color: "success.main" }} />;
      case "warning":
        return <WarningIcon sx={{ color: "warning.main" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "error.main" }} />;
      default:
        return <InfoIcon sx={{ color: "info.main" }} />;
    }
  };

  const getNotificationChip = (type: string) => {
    switch (type) {
      case "success":
        return <Chip label="Success" color="success" size="small" />;
      case "warning":
        return <Chip label="Warning" color="warning" size="small" />;
      case "error":
        return <Chip label="Error" color="error" size="small" />;
      default:
        return <Chip label="Info" color="info" size="small" />;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Stay updated with your activities
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Badge badgeContent={unreadCount} color="error">
            <Button
              variant="contained"
              startIcon={<MarkAllReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          </Badge>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Notifications</Typography>
              <Typography variant="h4">{notifications.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: "warning.light" }}>
            <CardContent>
              <Typography color="text.secondary">Unread</Typography>
              <Typography variant="h4" color="warning.main">
                {unreadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Typography color="text.secondary">Read</Typography>
              <Typography variant="h4" color="success.main">
                {readNotifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Unread
                  {unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" />
                  )}
                </Box>
              }
            />
            <Tab label="Read" />
            <Tab label="All" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : unreadNotifications.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.light" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold" }}
                        align="center"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unreadNotifications.map((notif) => (
                      <TableRow
                        key={notif.id}
                        hover
                        sx={{
                          bgcolor: "action.hover",
                          "&:hover": { bgcolor: "action.selected" },
                        }}
                      >
                        <TableCell>{getNotificationIcon(notif.type)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {notif.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notif.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(notif.createdAt).fromNow()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Mark as Read">
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notif.id)}
                            >
                              <MarkReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(notif.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No unread notifications
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : readNotifications.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.light" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold" }}
                        align="center"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {readNotifications.map((notif) => (
                      <TableRow key={notif.id} hover>
                        <TableCell>{getNotificationIcon(notif.type)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notif.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notif.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(notif.createdAt).fromNow()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(notif.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No read notifications
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.light" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold" }}
                        align="center"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notifications.map((notif) => (
                      <TableRow key={notif.id} hover>
                        <TableCell>{getNotificationIcon(notif.type)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {notif.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notif.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {notif.read ? (
                            <Chip label="Read" size="small" color="default" />
                          ) : (
                            <Chip
                              label="Unread"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(notif.createdAt).fromNow()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {!notif.read && (
                            <Tooltip title="Mark as Read">
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsRead(notif.id)}
                              >
                                <MarkReadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(notif.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
