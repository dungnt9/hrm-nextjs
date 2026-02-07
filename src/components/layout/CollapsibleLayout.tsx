"use client";

import { useState, useEffect } from "react";
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
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
  MoreTime as OvertimeIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { logout } from "@/lib/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";

const drawerWidthExpanded = 260;
const drawerWidthCollapsed = 72;

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
    text: "Overtime",
    icon: <OvertimeIcon />,
    path: "/overtime",
    roles: ["employee"],
  },
  {
    text: "Employees",
    icon: <PeopleIcon />,
    path: "/employees",
    roles: ["hr_staff", "manager", "system_admin"],
  },
  {
    text: "Departments",
    icon: <BusinessIcon />,
    path: "/departments",
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

export default function CollapsibleLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { unreadCount } = useSelector((state: RootState) => state.notification);

  // Load collapse state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  // Save collapse state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
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

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (collapsed: boolean = false) => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            HRM System
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleCollapseToggle} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems
          .filter((item) => hasAccess(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <Tooltip
                title={collapsed ? item.text : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? "center" : "initial",
                    px: collapsed ? 1.5 : 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.text} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
      </List>
      {!collapsed && (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {user?.roles?.[0]}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const drawerWidth = isCollapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
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
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              {user?.firstName?.[0] || "U"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidthExpanded,
            },
          }}
        >
          {drawer(false)}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer(isCollapsed)}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
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
        <MenuItem onClick={() => handleNavigation("/profile")}>
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
            handleNavigation("/notifications");
            handleNotificationClose();
          }}
        >
          View all notifications
        </MenuItem>
      </Menu>
    </Box>
  );
}
