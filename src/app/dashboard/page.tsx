"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  Badge,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  ArrowForward as ArrowForwardIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import {
  setAttendanceStatus,
  setLoading,
  checkIn,
  checkOut,
} from "@/store/slices/attendanceSlice";
import {
  attendanceApi,
  leaveApi,
  overtimeApi,
  employeeApi,
  departmentApi,
  teamApi,
} from "@/lib/api";
import dayjs from "dayjs";

interface LeaveBalance {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  unpaidUsed: number;
}

interface ApprovalStats {
  pendingLeave: number;
  pendingOvertime: number;
}

interface OrgStats {
  totalEmployees: number;
  totalDepartments: number;
  totalTeams: number;
}

function hasRole(roles: string[], ...check: string[]) {
  return check.some((r) => roles.includes(r));
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { status, isLoading } = useSelector(
    (state: RootState) => state.attendance
  );

  const roles = user?.roles ?? [];
  const isAdmin = hasRole(roles, "system_admin");
  const isHR = hasRole(roles, "hr_staff");
  const isManager = hasRole(roles, "manager");
  const isManagerOrAbove = isManager || isHR || isAdmin;

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    workingDays: 0,
    lateDays: 0,
    pendingLeaveRequests: 0,
    pendingOvertimeRequests: 0,
    approvedOvertimeHours: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceStatus();
    fetchLeaveBalance();
    fetchMonthlyStats();
    if (isManagerOrAbove) fetchApprovalStats();
    if (isHR || isAdmin) fetchOrgStats();
  }, []);

  const fetchAttendanceStatus = async () => {
    try {
      dispatch(setLoading(true));
      setAttendanceError(null);
      const data = await attendanceApi.getStatus();
      dispatch(
        setAttendanceStatus({
          isCheckedIn: data.isCheckedIn ?? false,
          isCheckedOut: data.isCheckedOut ?? false,
          checkInTime: data.checkInTime ?? null,
          checkOutTime: data.checkOutTime ?? null,
          currentHours: data.currentHours ?? 0,
        })
      );
    } catch (error) {
      console.error("Failed to fetch attendance status:", error);
      setAttendanceError("Failed to load attendance status");
      dispatch(
        setAttendanceStatus({
          isCheckedIn: false,
          isCheckedOut: false,
          checkInTime: null,
          checkOutTime: null,
          currentHours: 0,
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      setLeaveLoading(true);
      setLeaveError(null);
      const data = await leaveApi.getBalance();
      setLeaveBalance(data);
    } catch (error) {
      console.error("Failed to fetch leave balance:", error);
      setLeaveError("Failed to load leave balance");
      setLeaveBalance({
        annual: { total: 12, used: 0, remaining: 12 },
        sick: { total: 7, used: 0, remaining: 7 },
        unpaidUsed: 0,
      });
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      setStatsLoading(true);
      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

      const [attendanceData, leaveRequests, overtimeRequests] =
        await Promise.all([
          attendanceApi.getHistory({ startDate: startOfMonth, endDate: endOfMonth }),
          leaveApi.getRequests({ status: "pending" }),
          overtimeApi.getRequests({ startDate: startOfMonth, endDate: endOfMonth }),
        ]);

      const records = attendanceData.data || [];
      const workingDays = records.length;
      const lateDays = records.filter((r: any) => r.isLate).length;

      const otRequests = overtimeRequests.data || [];
      const approvedOT = otRequests
        .filter((r: any) => r.status?.toLowerCase() === "approved")
        .reduce((sum: number, r: any) => sum + (r.totalMinutes || 0), 0);

      setMonthlyStats({
        workingDays,
        lateDays,
        pendingLeaveRequests: leaveRequests.data?.length || 0,
        pendingOvertimeRequests: otRequests.filter(
          (r: any) => r.status?.toLowerCase() === "pending"
        ).length,
        approvedOvertimeHours: Math.round(approvedOT / 60),
      });
    } catch (error) {
      console.error("Failed to fetch monthly stats:", error);
      setMonthlyStats({
        workingDays: dayjs().date(),
        lateDays: 0,
        pendingLeaveRequests: 0,
        pendingOvertimeRequests: 0,
        approvedOvertimeHours: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchApprovalStats = async () => {
    try {
      setApprovalLoading(true);
      const [leaveApprovals, overtimeApprovals] = await Promise.all([
        leaveApi.getPendingApprovals(),
        overtimeApi.getPendingRequests(),
      ]);
      setApprovalStats({
        pendingLeave: leaveApprovals?.data?.length ?? leaveApprovals?.length ?? 0,
        pendingOvertime: overtimeApprovals?.data?.length ?? overtimeApprovals?.length ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch approval stats:", error);
      setApprovalStats({ pendingLeave: 0, pendingOvertime: 0 });
    } finally {
      setApprovalLoading(false);
    }
  };

  const fetchOrgStats = async () => {
    try {
      setOrgLoading(true);
      const [empData, deptData, teamData] = await Promise.all([
        employeeApi.getAll({ pageSize: 1 }),
        departmentApi.getAll(),
        teamApi.getAll(),
      ]);
      setOrgStats({
        totalEmployees: empData.totalCount ?? 0,
        totalDepartments: Array.isArray(deptData) ? deptData.length : deptData?.length ?? 0,
        totalTeams: Array.isArray(teamData) ? teamData.length : teamData?.length ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch org stats:", error);
      setOrgStats({ totalEmployees: 0, totalDepartments: 0, totalTeams: 0 });
    } finally {
      setOrgLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      const data = await attendanceApi.checkIn();
      dispatch(checkIn(data.checkInTime));
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed. Please try again.");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckInLoading(true);
      const data = await attendanceApi.checkOut();
      dispatch(
        checkOut({
          checkOutTime: data.checkOutTime,
          totalHours: data.totalHours,
        })
      );
    } catch (error) {
      console.error("Check-out failed:", error);
      alert("Check-out failed. Please try again.");
    } finally {
      setCheckInLoading(false);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return dayjs(isoString).format("HH:mm");
  };

  const getRoleLabel = () => {
    if (isAdmin) return { label: "System Administrator", color: "error" as const, icon: <AdminIcon sx={{ fontSize: 16 }} /> };
    if (isHR) return { label: "HR Staff", color: "secondary" as const, icon: <BadgeIcon sx={{ fontSize: 16 }} /> };
    if (isManager) return { label: "Manager", color: "primary" as const, icon: <ManagerIcon sx={{ fontSize: 16 }} /> };
    return { label: "Employee", color: "default" as const, icon: <BadgeIcon sx={{ fontSize: 16 }} /> };
  };

  const roleInfo = getRoleLabel();
  const totalPending = (approvalStats?.pendingLeave ?? 0) + (approvalStats?.pendingOvertime ?? 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.firstName}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {dayjs().format("dddd, MMMM D, YYYY")}
          </Typography>
        </Box>
        <Chip
          icon={roleInfo.icon}
          label={roleInfo.label}
          color={roleInfo.color}
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* ── Row 1: Core widgets (all roles) ── */}

        {/* Attendance Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Attendance</Typography>
              </Box>

              {attendanceError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {attendanceError}
                </Alert>
              )}

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Check In</Typography>
                      <Typography variant="h5">{formatTime(status.checkInTime)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Check Out</Typography>
                      <Typography variant="h5">{formatTime(status.checkOutTime)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Hours</Typography>
                      <Typography variant="h5">{status.currentHours.toFixed(1)}h</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    {!status.isCheckedIn && (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleCheckIn}
                        disabled={checkInLoading}
                      >
                        {checkInLoading ? <CircularProgress size={24} /> : "Check In"}
                      </Button>
                    )}
                    {status.isCheckedIn && !status.isCheckedOut && (
                      <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        onClick={handleCheckOut}
                        disabled={checkInLoading}
                      >
                        {checkInLoading ? <CircularProgress size={24} /> : "Check Out"}
                      </Button>
                    )}
                    {status.isCheckedOut && (
                      <Chip label="Completed" color="success" />
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Balance Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EventNoteIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Leave Balance</Typography>
              </Box>

              {leaveError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {leaveError}
                </Alert>
              )}

              {leaveLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : leaveBalance ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">Annual Leave</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {leaveBalance.annual.remaining}/{leaveBalance.annual.total} days
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={leaveBalance.annual.total > 0 ? (leaveBalance.annual.remaining / leaveBalance.annual.total) * 100 : 0}
                      color="primary"
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">Sick Leave</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {leaveBalance.sick.remaining}/{leaveBalance.sick.total} days
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={leaveBalance.sick.total > 0 ? (leaveBalance.sick.remaining / leaveBalance.sick.total) * 100 : 0}
                      color="success"
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Unpaid Leave Used</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {leaveBalance.unpaidUsed} days
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* This Month Stats Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">This Month</Typography>
              </Box>

              {statsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {monthlyStats.workingDays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Working Days
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color={monthlyStats.lateDays > 0 ? "error.main" : "success.main"}
                    >
                      {monthlyStats.lateDays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late Days
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="secondary.main">
                      {monthlyStats.approvedOvertimeHours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overtime
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Row 2: Role-specific sections ── */}

        {/* HR / Admin: Company Overview */}
        {(isHR || isAdmin) && (
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Company Overview</Typography>
                </Box>

                {orgLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : orgStats ? (
                  <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <PeopleIcon color="primary" sx={{ mb: 0.5 }} />
                      <Typography variant="h4" color="primary.main">
                        {orgStats.totalEmployees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Employees
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <BusinessIcon color="secondary" sx={{ mb: 0.5 }} />
                      <Typography variant="h4" color="secondary.main">
                        {orgStats.totalDepartments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Departments
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <GroupsIcon sx={{ mb: 0.5, color: "success.main" }} />
                      <Typography variant="h4" color="success.main">
                        {orgStats.totalTeams}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Teams
                      </Typography>
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Manager / HR / Admin: Pending Approvals */}
        {isManagerOrAbove && (
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: "100%", border: totalPending > 0 ? "1px solid" : undefined, borderColor: totalPending > 0 ? "warning.main" : undefined }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Badge badgeContent={totalPending} color="warning" sx={{ mr: 1.5 }}>
                    <PendingActionsIcon color="warning" />
                  </Badge>
                  <Typography variant="h6">Pending Approvals</Typography>
                </Box>

                {approvalLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : approvalStats ? (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography variant="body1">Leave Requests</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={approvalStats.pendingLeave}
                          color={approvalStats.pendingLeave > 0 ? "warning" : "default"}
                          size="small"
                        />
                        <Link href="/leave/approvals" passHref>
                          <ArrowForwardIcon fontSize="small" color="action" sx={{ cursor: "pointer" }} />
                        </Link>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body1">Overtime Requests</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={approvalStats.pendingOvertime}
                          color={approvalStats.pendingOvertime > 0 ? "warning" : "default"}
                          size="small"
                        />
                        <Link href="/overtime/approvals" passHref>
                          <ArrowForwardIcon fontSize="small" color="action" sx={{ cursor: "pointer" }} />
                        </Link>
                      </Box>
                    </Box>

                    {totalPending > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                          {totalPending} request{totalPending > 1 ? "s" : ""} awaiting your approval
                        </Alert>
                      </Box>
                    )}
                    {totalPending === 0 && (
                      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="success.main">
                          All caught up!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Employee only: Pending Requests (own requests) */}
        {!isManagerOrAbove && (
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EventNoteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">My Pending Requests</Typography>
                </Box>

                {statsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography variant="body1">Leave Requests</Typography>
                      <Chip
                        label={monthlyStats.pendingLeaveRequests}
                        color={monthlyStats.pendingLeaveRequests > 0 ? "warning" : "default"}
                        size="small"
                      />
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="body1">Overtime Requests</Typography>
                      <Chip
                        label={monthlyStats.pendingOvertimeRequests}
                        color={monthlyStats.pendingOvertimeRequests > 0 ? "warning" : "default"}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        component={Link}
                        href="/leave"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        Request Leave
                      </Button>
                      <Button
                        component={Link}
                        href="/overtime"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        Request OT
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Actions — role-aware */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ArrowForwardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Quick Actions</Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  component={Link}
                  href="/attendance"
                  variant="outlined"
                  size="small"
                  startIcon={<AccessTimeIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  View Attendance History
                </Button>
                <Button
                  component={Link}
                  href="/leave"
                  variant="outlined"
                  size="small"
                  startIcon={<EventNoteIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Leave Requests
                </Button>
                <Button
                  component={Link}
                  href="/overtime"
                  variant="outlined"
                  size="small"
                  startIcon={<TrendingUpIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Overtime Requests
                </Button>

                {isManagerOrAbove && (
                  <>
                    <Divider />
                    <Button
                      component={Link}
                      href="/employees"
                      variant="outlined"
                      size="small"
                      startIcon={<PeopleIcon />}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Employee Directory
                    </Button>
                    <Button
                      component={Link}
                      href="/attendance?view=team"
                      variant="outlined"
                      size="small"
                      startIcon={<GroupsIcon />}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Team Attendance
                    </Button>
                  </>
                )}

                {(isHR || isAdmin) && (
                  <>
                    <Button
                      component={Link}
                      href="/employees/departments"
                      variant="outlined"
                      size="small"
                      startIcon={<BusinessIcon />}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Departments & Teams
                    </Button>
                    <Button
                      component={Link}
                      href="/shifts"
                      variant="outlined"
                      size="small"
                      startIcon={<AccessTimeIcon />}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      Manage Shifts
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
