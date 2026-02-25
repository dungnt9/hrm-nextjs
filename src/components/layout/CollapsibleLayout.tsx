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
  Tooltip,
  useMediaQuery,
  useTheme,
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
  MoreTime as OvertimeIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { logout } from "@/lib/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";

const DRAWER_EXPANDED = 260;
const DRAWER_COLLAPSED = 72;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: "Dashboard",      icon: <DashboardIcon />,      path: "/dashboard" },
  { text: "Attendance",     icon: <AccessTimeIcon />,     path: "/attendance" },
  { text: "Leave Requests", icon: <EventNoteIcon />,      path: "/leave" },
  { text: "Overtime",       icon: <OvertimeIcon />,       path: "/overtime" },
  { text: "Employees",      icon: <PeopleIcon />,         path: "/employees" },
  { text: "Departments",    icon: <BusinessIcon />,       path: "/departments" },
  { text: "Teams",          icon: <GroupIcon />,          path: "/teams" },
  { text: "Team Attendance",icon: <AttendanceCheckIcon />,path: "/team-attendance" },
  { text: "Shifts",         icon: <ScheduleIcon />,       path: "/shifts" },
  { text: "Organization",   icon: <AccountTreeIcon />,    path: "/organization" },
  { text: "Approvals",      icon: <EventNoteIcon />,      path: "/approvals" },
  { text: "Reports",        icon: <BarChartIcon />,       path: "/reports" },
  { text: "Settings",       icon: <SettingsIcon />,       path: "/settings" },
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

  // Hover state for desktop sidebar
  const [isHovered, setIsHovered] = useState(false);
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);
  // User account menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotificationClick = (e: React.MouseEvent<HTMLElement>) =>
    setNotificationAnchor(e.currentTarget);
  const handleNotificationClose = () => setNotificationAnchor(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    dispatch(setUnauthenticated());
    router.push("/");
  };

  const hasAccess = (roles: string[]) => {
    if (!user?.roles) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  // ── Drawer content ────────────────────────────────────────────────────────
  const drawerContent = (collapsed: boolean) => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 1 : 2.5,
          minHeight: 64,
        }}
      >
        {collapsed ? (
          <BusinessIcon color="primary" />
        ) : (
          <Typography variant="h6" noWrap fontWeight="bold" color="primary">
            HRM System
          </Typography>
        )}
      </Toolbar>

      <Divider />

      <List sx={{ flexGrow: 1, py: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menuItems.map((item) => (
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
                    borderRadius: 1,
                    mx: 0.5,
                    color: "text.primary",
                    "& .MuiListItemIcon-root": { color: "text.secondary" },
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "& .MuiListItemIcon-root": {
                        color: "primary.contrastText",
                      },
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                    "&:hover": { bgcolor: "action.hover" },
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
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ noWrap: true, fontSize: 14 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
      </List>

      <Divider />
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: 64,
          overflow: "hidden",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "secondary.main",
            flexShrink: 0,
            fontSize: 14,
          }}
        >
          {user?.firstName?.[0] || "U"}
        </Avatar>
        {!collapsed && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.roles?.[0]}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* ── AppBar ── */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_COLLAPSED}px)` },
          ml: { sm: `${DRAWER_COLLAPSED}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
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

      {/* ── Sidebar nav ── */}
      <Box
        component="nav"
        sx={{
          width: { sm: DRAWER_COLLAPSED },
          flexShrink: { sm: 0 },
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_EXPANDED,
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>

        {/* Desktop hover drawer */}
        <Drawer
          variant="permanent"
          PaperProps={{
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
            sx: {
              width: isHovered ? DRAWER_EXPANDED : DRAWER_COLLAPSED,
              overflowX: "hidden",
              whiteSpace: "nowrap",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: isHovered
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
              boxSizing: "border-box",
              boxShadow: isHovered ? 4 : 0,
            },
          }}
          sx={{ display: { xs: "none", sm: "block" } }}
          open
        >
          {drawerContent(!isHovered)}
        </Drawer>
      </Box>

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_COLLAPSED}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>

      {/* ── User account menu ── */}
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

      {/* ── Notifications menu ── */}
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
