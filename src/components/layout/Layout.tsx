"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  EventNote as EventNoteIcon,
  AccountTree as AccountTreeIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  AssignmentTurnedIn as AttendanceCheckIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { logout } from "@/lib/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
    roles: ["employee"],
  },
  {
    text: "Attendance",
    icon: <AccessTimeIcon />,
    path: "/attendance",
    roles: ["employee"],
  },
  {
    text: "Leave Requests",
    icon: <EventNoteIcon />,
    path: "/leave",
    roles: ["employee"],
  },
  {
    text: "Employees",
    icon: <PeopleIcon />,
    path: "/employees",
    roles: ["hr_staff", "manager", "system_admin"],
  },
  {
    text: "Teams",
    icon: <GroupIcon />,
    path: "/teams",
    roles: ["hr_staff", "manager", "system_admin"],
  },
  {
    text: "Team Attendance",
    icon: <AttendanceCheckIcon />,
    path: "/team-attendance",
    roles: ["manager", "hr_staff", "system_admin"],
  },
  {
    text: "Shifts",
    icon: <ScheduleIcon />,
    path: "/shifts",
    roles: ["employee"],
  },
  {
    text: "Organization",
    icon: <AccountTreeIcon />,
    path: "/organization",
    roles: ["employee"],
  },
  {
    text: "Approvals",
    icon: <EventNoteIcon />,
    path: "/approvals",
    roles: ["manager", "hr_staff"],
  },
  {
    text: "Reports",
    icon: <BarChartIcon />,
    path: "/reports",
    roles: ["manager", "hr_staff", "system_admin"],
  },
  {
    text: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
    roles: ["system_admin"],
  },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { unreadCount } = useSelector((state: RootState) => state.notification);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    dispatch(setUnauthenticated());
    router.push("/");
  };

  const hasAccess = (roles: string[]) => {
    if (!user?.roles) return false;
    return roles.some((role) => user.roles.includes(role));
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          HRM System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems
          .filter((item) => hasAccess(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => router.push(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </div>
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === pathname)?.text || "HRM"}
          </Typography>

          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.[0] || "U"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem disabled>
          <PersonIcon sx={{ mr: 1 }} />
          {user?.firstName} {user?.lastName}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => router.push("/profile")}>
          <PersonIcon sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications ({unreadCount} unread)
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            router.push("/notifications");
            handleNotificationClose();
          }}
        >
          View all notifications
        </MenuItem>
      </Menu>
    </Box>
  );
}
