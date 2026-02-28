"use client";

import { useState, useTransition, useEffect } from "react";
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
  alpha,
  CircularProgress,
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
  CalendarMonth as CalendarMonthIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Receipt as ReceiptIcon,
  Campaign as CampaignIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { logout } from "@/lib/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";
import { useThemeMode } from "@/components/providers/ThemeProvider";

const DRAWER_EXPANDED = 260;
const DRAWER_COLLAPSED = 72;

const BUSINESS_ROLES = ["system_admin", "hr_staff", "manager", "employee"];

function getPrimaryRole(roles: string[] | undefined): string {
  if (!roles?.length) return "";
  const found = roles.find((r) => BUSINESS_ROLES.includes(r));
  return found ?? roles[0];
}

// ── Design tokens ─────────────────────────────────────────────────────────────
// Light: "Periwinkle Pearl" — soft indigo-lavender tones, no pure white
// Dark:  "Deep Sapphire"   — rich navy-blue, no pure black
function getSB(isDark: boolean) {
  return isDark
    ? {
        // Deep Sapphire
        bg: "linear-gradient(160deg, #141929 0%, #1c2647 55%, #152338 100%)",
        selectedBg: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)",
        hoverBg: "rgba(255,255,255,0.07)",
        text: "#dde3f5",
        textSecondary: "rgba(221,227,245,0.48)",
        icon: "rgba(221,227,245,0.42)",
        divider: "rgba(221,227,245,0.08)",
        logoBg: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
        avatarBg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
        selectedGlow: "0 0 14px rgba(99,102,241,0.5)",
        userCardBg: "rgba(255,255,255,0.05)",
        userCardBorder: "rgba(255,255,255,0.08)",
        // AppBar
        appBarBg: "rgba(20, 25, 41, 0.88)",
        appBarBorder: "rgba(221,227,245,0.08)",
        appBarText: "#dde3f5",
        btnBg: "rgba(221,227,245,0.08)",
        btnHoverBg: "rgba(221,227,245,0.15)",
      }
    : {
        // Periwinkle Pearl
        bg: "linear-gradient(160deg, #f0f2ff 0%, #ece8ff 55%, #e8f3ff 100%)",
        selectedBg: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)",
        hoverBg: "rgba(99,102,241,0.09)",
        text: "#2d2b55",
        textSecondary: "#6b6f9a",
        icon: "#9596c0",
        divider: "rgba(99,102,241,0.1)",
        logoBg: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
        avatarBg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
        selectedGlow: "0 0 14px rgba(99,102,241,0.28)",
        userCardBg: "rgba(99,102,241,0.07)",
        userCardBorder: "rgba(99,102,241,0.14)",
        // AppBar
        appBarBg: "rgba(240, 242, 255, 0.88)",
        appBarBorder: "rgba(99,102,241,0.12)",
        appBarText: "#2d2b55",
        btnBg: "rgba(99,102,241,0.09)",
        btnHoverBg: "rgba(99,102,241,0.16)",
      };
}

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Attendance", icon: <AccessTimeIcon />, path: "/attendance" },
  { text: "Leave Requests", icon: <EventNoteIcon />, path: "/leave" },
  { text: "Overtime", icon: <OvertimeIcon />, path: "/overtime" },
  { text: "Payroll", icon: <ReceiptIcon />, path: "/payroll" },
  { text: "Announcements", icon: <CampaignIcon />, path: "/announcements" },
  { text: "Calendar", icon: <CalendarMonthIcon />, path: "/calendar" },
  { text: "Employees", icon: <PeopleIcon />, path: "/employees" },
  {
    text: "Employee Development",
    icon: <TrendingUpIcon />,
    path: "/employee-development",
  },
  { text: "Departments", icon: <BusinessIcon />, path: "/departments" },
  { text: "Teams", icon: <GroupIcon />, path: "/teams" },
  {
    text: "Team Attendance",
    icon: <AttendanceCheckIcon />,
    path: "/team-attendance",
  },
  { text: "Shifts", icon: <ScheduleIcon />, path: "/shifts" },
  { text: "Organization", icon: <AccountTreeIcon />, path: "/organization" },
  { text: "Approvals", icon: <EventNoteIcon />, path: "/approvals" },
  { text: "Reports", icon: <BarChartIcon />, path: "/reports" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function CollapsibleLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";
  const SB = getSB(isDark);

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const { unreadCount } = useSelector((state: RootState) => state.notification);

  const [isPending, startTransition] = useTransition();
  const [navTarget, setNavTarget] = useState<string | null>(null);

  // Top progress bar animation
  const [barProgress, setBarProgress] = useState(0);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    if (isPending) {
      setBarVisible(true);
      setBarProgress(0);
      const t = setTimeout(() => setBarProgress(82), 30);
      return () => clearTimeout(t);
    } else {
      setBarProgress(100);
      const t = setTimeout(() => {
        setBarVisible(false);
        setBarProgress(0);
        setNavTarget(null);
      }, 380);
      return () => clearTimeout(t);
    }
  }, [isPending]);

  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleNavigation = (path: string) => {
    if (path === pathname) return;
    setNavTarget(path);
    startTransition(() => {
      router.push(path);
    });
    if (isMobile) setMobileOpen(false);
  };

  // ── Drawer content ────────────────────────────────────────────────────────
  const drawerContent = (collapsed: boolean) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: SB.bg,
        overflow: "hidden",
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : 2.5,
          minHeight: 64,
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {/* Logo icon */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: SB.logoBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}
        >
          <BusinessIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
              sx={{
                color: SB.text,
                letterSpacing: 0.5,
                lineHeight: 1.2,
              }}
            >
              HRM System
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: SB.textSecondary, letterSpacing: 1, fontSize: 10 }}
            >
              ENTERPRISE
            </Typography>
          </Box>
        )}
      </Box>

      {/* Divider */}
      <Box sx={{ mx: 2, borderBottom: `1px solid ${SB.divider}`, mb: 1 }} />

      {/* Nav list */}
      <List
        sx={{
          flexGrow: 1,
          py: 0.5,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: SB.divider,
            borderRadius: 2,
          },
        }}
      >
        {menuItems.map((item) => {
          const selected = pathname === item.path;
          const isLoading = isPending && navTarget === item.path;
          const isActive = selected || isLoading;

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ display: "block", px: 1, mb: 0.5 }}
            >
              <Tooltip
                title={collapsed ? item.text : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  selected={selected}
                  disabled={isPending}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 44,
                    justifyContent: collapsed ? "center" : "initial",
                    px: collapsed ? 0 : 1.5,
                    borderRadius: 2,
                    color: isActive ? "#fff" : SB.text,
                    background: isActive ? SB.selectedBg : "transparent",
                    boxShadow: isActive ? SB.selectedGlow : "none",
                    opacity: isPending && !isLoading ? 0.55 : 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: isActive ? SB.selectedBg : SB.hoverBg,
                    },
                    "& .MuiListItemIcon-root": {
                      color: isActive ? "#fff" : SB.icon,
                      transition: "color 0.2s",
                    },
                    "&.Mui-selected": {
                      background: SB.selectedBg,
                      "&:hover": { background: SB.selectedBg },
                    },
                    "&.Mui-disabled": {
                      opacity: isPending && !isLoading ? 0.55 : 1,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      justifyContent: "center",
                      position: "relative",
                      width: 24,
                      height: 24,
                    }}
                  >
                    {/* Spinner ring behind icon when this item is loading */}
                    {isLoading && (
                      <CircularProgress
                        size={32}
                        thickness={2}
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          mt: "-16px",
                          ml: "-16px",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      />
                    )}
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: 13.5,
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: 0.2,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Divider */}
      <Box sx={{ mx: 2, borderBottom: `1px solid ${SB.divider}`, mt: 1 }} />

      {/* User card at bottom */}
      <Box
        sx={{
          p: collapsed ? 1 : 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: 64,
          overflow: "hidden",
          mx: 1,
          mb: 0.5,
          mt: 0.5,
          borderRadius: 2,
          background: SB.userCardBg,
          border: `1px solid ${SB.userCardBorder}`,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            background: SB.avatarBg,
            flexShrink: 0,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(139,92,246,0.4)",
          }}
        >
          {user?.firstName?.[0] || "U"}
        </Avatar>
        {!collapsed && (
          <Box sx={{ overflow: "hidden", flexGrow: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ color: SB.text }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: SB.textSecondary, fontSize: 11 }}
            >
              {getPrimaryRole(user?.roles)}
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

      {/* ── Top progress bar ── */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: (t) => t.zIndex.drawer + 10,
          pointerEvents: "none",
          opacity: barVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${barProgress}%`,
            background:
              "linear-gradient(90deg, #6366f1 0%, #3b82f6 60%, #06b6d4 100%)",
            transition:
              barProgress === 0
                ? "none"
                : barProgress === 100
                  ? "width 0.25s ease-out"
                  : "width 0.9s cubic-bezier(0.1, 0.05, 0, 1)",
            borderRadius: "0 3px 3px 0",
            boxShadow:
              "0 0 10px rgba(99,102,241,0.7), 0 0 4px rgba(59,130,246,0.9)",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              right: -1,
              top: "50%",
              transform: "translateY(-50%)",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#06b6d4",
              boxShadow: "0 0 8px 2px rgba(6,182,212,0.8)",
            },
          }}
        />
      </Box>

      {/* ── AppBar ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_COLLAPSED}px)` },
          ml: { sm: `${DRAWER_COLLAPSED}px` },
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: SB.appBarBg,
          borderBottom: `1px solid ${SB.appBarBorder}`,
          color: SB.appBarText,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 1,
              display: { sm: "none" },
              color: SB.appBarText,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              fontWeight={700}
              sx={{
                color: SB.appBarText,
                fontSize: 18,
              }}
            >
              {menuItems.find((item) => item.path === pathname)?.text || "HRM"}
            </Typography>
          </Box>

          <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: SB.btnBg,
                color: SB.appBarText,
                "&:hover": { bgcolor: SB.btnHoverBg },
                transition: "background 0.2s",
              }}
            >
              {isDark ? (
                <Brightness7Icon fontSize="small" />
              ) : (
                <Brightness4Icon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationClick}
              size="small"
              sx={{
                bgcolor: SB.btnBg,
                color: SB.appBarText,
                "&:hover": { bgcolor: SB.btnHoverBg },
                transition: "background 0.2s",
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          <Tooltip title={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  background: SB.avatarBg,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(139,92,246,0.35)",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                {user?.firstName?.[0] || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar nav ── */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_COLLAPSED }, flexShrink: { sm: 0 } }}
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
              border: "none",
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
              border: "none",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: isHovered
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
              boxSizing: "border-box",
              boxShadow: isHovered
                ? isDark
                  ? "4px 0 28px rgba(0,0,0,0.45)"
                  : "4px 0 28px rgba(99,102,241,0.18)"
                : isDark
                  ? "2px 0 10px rgba(0,0,0,0.3)"
                  : "2px 0 10px rgba(99,102,241,0.1)",
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
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${DRAWER_COLLAPSED}px)` },
          mt: 8,
          minHeight: "calc(100vh - 64px)",
          bgcolor: "background.default",
          opacity: isPending ? 0.6 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {children}
      </Box>

      {/* ── User menu ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            overflow: "visible",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 16,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              borderBottom: "none",
              borderRight: "none",
            },
          },
        }}
      >
        {/* User info header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            background: isDark
              ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.18))"
              : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Typography variant="body2" fontWeight={700}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getPrimaryRole(user?.roles)}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => handleNavigation("/profile")}
          sx={{ py: 1.2, gap: 1.5 }}
        >
          <PersonIcon fontSize="small" sx={{ color: "primary.main" }} />
          Profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ py: 1.2, gap: 1.5, color: "error.main" }}
        >
          <LogoutIcon fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* ── Notifications menu ── */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            maxHeight: 420,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDark
              ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.18))"
              : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 10,
                background: "linear-gradient(90deg, #6366f1, #3b82f6)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {unreadCount} new
            </Box>
          )}
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            handleNavigation("/notifications");
            handleNotificationClose();
          }}
          sx={{
            justifyContent: "center",
            color: "primary.main",
            fontWeight: 600,
            py: 1.5,
          }}
        >
          View all notifications
        </MenuItem>
      </Menu>
    </Box>
  );
}
