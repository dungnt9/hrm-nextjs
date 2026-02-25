"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  Button,
  Skeleton,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download as DownloadIcon } from "@mui/icons-material";
import { RootState } from "@/store";
import {
  attendanceApi,
  leaveApi,
  overtimeApi,
  employeeApi,
  departmentApi,
  teamApi,
} from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import dayjs from "dayjs";

const COLORS = ["#1976d2", "#dc004e", "#f57c00", "#388e3c", "#7b1fa2"];

function getWeeksOfMonth(monthYear: string) {
  const start = dayjs(monthYear).startOf("month");
  const end = dayjs(monthYear).endOf("month");
  const weeks: { label: string; start: string; end: string }[] = [];
  let current = start;
  let weekNum = 1;

  while (current.isBefore(end) || current.isSame(end, "day")) {
    const weekEnd = current.endOf("week").isAfter(end)
      ? end
      : current.endOf("week");
    weeks.push({
      label: `Week ${weekNum}`,
      start: current.format("YYYY-MM-DD"),
      end: weekEnd.format("YYYY-MM-DD"),
    });
    current = weekEnd.add(1, "day");
    weekNum++;
  }
  return weeks;
}

function SectionSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={height - 80} />
    </Paper>
  );
}

function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 1 }}>
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>
      {badge && (
        <Chip label={badge} size="small" variant="outlined" color="primary" />
      )}
    </Box>
  );
}

export default function ReportsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isHrOrAdmin =
    roles.includes("hr_staff") || roles.includes("system_admin");
  const isManagerOrAbove =
    roles.includes("manager") || isHrOrAdmin;

  const [monthYear, setMonthYear] = useState(dayjs().format("YYYY-MM"));

  // Attendance
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // Leave balance
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [leaveLoading, setLeaveLoading] = useState(true);

  // Overtime
  const [weeklyOvertime, setWeeklyOvertime] = useState<any[]>([]);
  const [overtimeLoading, setOvertimeLoading] = useState(true);

  // Company overview (HR/Admin only)
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [orgStats, setOrgStats] = useState({
    employees: 0,
    departments: 0,
    teams: 0,
  });
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
    fetchLeaveBalance();
    fetchOvertime();
    if (isHrOrAdmin) {
      fetchOrgData();
    }
  }, [monthYear, isHrOrAdmin]);

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const startDate = dayjs(monthYear).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs(monthYear).endOf("month").format("YYYY-MM-DD");
      const result = await attendanceApi.getHistory({
        startDate,
        endDate,
        pageSize: 1000,
      });
      const records: any[] = result?.data || [];

      const weeks = getWeeksOfMonth(monthYear);
      const weeklyData = weeks.map((week) => {
        const weekRecords = records.filter((r: any) => {
          const d = dayjs(r.date || r.checkInTime);
          return (
            !d.isBefore(dayjs(week.start)) && !d.isAfter(dayjs(week.end))
          );
        });
        return {
          week: week.label,
          present: weekRecords.filter(
            (r: any) =>
              r.checkInStatus === "on_time" || r.checkInStatus === "ontime"
          ).length,
          late: weekRecords.filter((r: any) => r.checkInStatus === "late")
            .length,
          earlyCheckout: weekRecords.filter(
            (r: any) => r.checkOutStatus === "early"
          ).length,
        };
      });
      setWeeklyAttendance(weeklyData);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setWeeklyAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    setLeaveLoading(true);
    try {
      const year = parseInt(monthYear.split("-")[0]);
      const balance = await leaveApi.getBalance(undefined, year);
      setLeaveBalance(balance);
    } catch (err) {
      console.error("Failed to fetch leave balance:", err);
      setLeaveBalance(null);
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchOvertime = async () => {
    setOvertimeLoading(true);
    try {
      const startDate = dayjs(monthYear).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs(monthYear).endOf("month").format("YYYY-MM-DD");
      const result = await overtimeApi.getRequests({
        status: "Approved",
        startDate,
        endDate,
        pageSize: 1000,
      });
      const records: any[] = result?.data || [];

      const weeks = getWeeksOfMonth(monthYear);
      const weeklyData = weeks.map((week) => {
        const weekRecords = records.filter((r: any) => {
          const d = dayjs(r.date);
          return (
            !d.isBefore(dayjs(week.start)) && !d.isAfter(dayjs(week.end))
          );
        });
        const totalMinutes = weekRecords.reduce(
          (sum: number, r: any) => sum + (r.totalMinutes || 0),
          0
        );
        return {
          week: week.label,
          hours: parseFloat((totalMinutes / 60).toFixed(1)),
        };
      });
      setWeeklyOvertime(weeklyData);
    } catch (err) {
      console.error("Failed to fetch overtime:", err);
      setWeeklyOvertime([]);
    } finally {
      setOvertimeLoading(false);
    }
  };

  const fetchOrgData = async () => {
    setOrgLoading(true);
    try {
      const [empResult, departments, teams] = await Promise.all([
        employeeApi.getAll({ pageSize: 1000 }),
        departmentApi.getAll(),
        teamApi.getAll(),
      ]);

      const empList: any[] = empResult?.data || [];
      const deptList: any[] = Array.isArray(departments) ? departments : [];
      const teamList: any[] = Array.isArray(teams) ? teams : [];

      const byDept = deptList
        .map((dept: any) => ({
          name: dept.name,
          employees: empList.filter((e: any) => e.departmentId === dept.id)
            .length,
        }))
        .filter((d) => d.employees > 0);

      setDeptStats(byDept);
      setOrgStats({
        employees: empList.length,
        departments: deptList.length,
        teams: teamList.length,
      });
    } catch (err) {
      console.error("Failed to fetch org data:", err);
    } finally {
      setOrgLoading(false);
    }
  };

  const leavePieData = leaveBalance
    ? [
        { name: "Annual Used", value: leaveBalance.annual?.used || 0 },
        { name: "Sick Used", value: leaveBalance.sick?.used || 0 },
        { name: "Unpaid", value: leaveBalance.unpaidUsed || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const handleExport = () => {
    exportToCSV({
      filename: `attendance-report-${monthYear}`,
      headers: ["Week", "On Time", "Late", "Early Checkout"],
      rows: weeklyAttendance.map((d) => [
        d.week,
        d.present,
        d.late,
        d.earlyCheckout,
      ]),
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {isManagerOrAbove
              ? "Company-wide analytics & insights"
              : "Your personal attendance & leave analytics"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={attendanceLoading || weeklyAttendance.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Month picker */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Period:
          </Typography>
          <input
            type="month"
            value={monthYear}
            max={dayjs().format("YYYY-MM")}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          <Chip
            label={dayjs(monthYear).format("MMMM YYYY")}
            color="primary"
            size="small"
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* ── Section 1: Attendance Overview ── */}
        <Grid item xs={12}>
          <SectionHeading
            title="Attendance Overview"
            badge={isManagerOrAbove ? "Company-wide" : "Personal"}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          {attendanceLoading ? (
            <SectionSkeleton />
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Weekly breakdown — On Time / Late / Early Checkout
              </Typography>
              {weeklyAttendance.some(
                (w) => w.present + w.late + w.earlyCheckout > 0
              ) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#388e3c" name="On Time" />
                    <Bar dataKey="late" fill="#f57c00" name="Late" />
                    <Bar
                      dataKey="earlyCheckout"
                      fill="#1976d2"
                      name="Early Checkout"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  }}
                >
                  <Typography color="text.secondary">
                    No attendance data for this period
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {attendanceLoading ? (
            <SectionSkeleton height={200} />
          ) : (
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Monthly totals
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  {
                    label: "On Time",
                    value: weeklyAttendance.reduce(
                      (s, w) => s + w.present,
                      0
                    ),
                    color: "#388e3c",
                  },
                  {
                    label: "Late",
                    value: weeklyAttendance.reduce((s, w) => s + w.late, 0),
                    color: "#f57c00",
                  },
                  {
                    label: "Early Checkout",
                    value: weeklyAttendance.reduce(
                      (s, w) => s + w.earlyCheckout,
                      0
                    ),
                    color: "#1976d2",
                  },
                ].map(({ label, value, color }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ color }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* ── Section 2: Leave Statistics ── */}
        <Grid item xs={12}>
          <SectionHeading title="Leave Statistics" />
        </Grid>

        <Grid item xs={12} md={5}>
          {leaveLoading ? (
            <SectionSkeleton />
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Leave balance
              </Typography>
              {leaveBalance ? (
                <Box sx={{ mt: 1 }}>
                  {[
                    {
                      type: "Annual Leave",
                      data: leaveBalance.annual,
                      color: "#1976d2",
                    },
                    {
                      type: "Sick Leave",
                      data: leaveBalance.sick,
                      color: "#dc004e",
                    },
                  ].map(
                    ({ type, data, color }) =>
                      data && (
                        <Box key={type} sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              {type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {data.used} / {data.total} days used
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={
                              data.total > 0
                                ? Math.min((data.used / data.total) * 100, 100)
                                : 0
                            }
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: `${color}22`,
                              "& .MuiLinearProgress-bar": {
                                bgcolor: color,
                                borderRadius: 5,
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {data.remaining} days remaining
                          </Typography>
                        </Box>
                      )
                  )}
                  {(leaveBalance.unpaidUsed ?? 0) > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        bgcolor: "warning.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Unpaid leave used:{" "}
                        <strong>{leaveBalance.unpaidUsed} days</strong>
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  No leave balance data available
                </Typography>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={7}>
          {leaveLoading ? (
            <SectionSkeleton />
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Used leave breakdown by type
              </Typography>
              {leavePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={leavePieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}d`}
                      dataKey="value"
                    >
                      {leavePieData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} days`, ""]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 220,
                  }}
                >
                  <Typography color="text.secondary">
                    No leave used yet this year
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* ── Section 3: Overtime Trends ── */}
        <Grid item xs={12}>
          <SectionHeading
            title="Overtime Trends"
            badge={isManagerOrAbove ? "Approved OT" : "Your approved OT"}
          />
        </Grid>

        <Grid item xs={12}>
          {overtimeLoading ? (
            <SectionSkeleton />
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Approved overtime hours by week
              </Typography>
              {weeklyOvertime.some((w) => w.hours > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={weeklyOvertime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis unit="h" />
                    <Tooltip
                      formatter={(val) => [`${val} hrs`, "OT Hours"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#1976d2"
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                      name="OT Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  }}
                >
                  <Typography color="text.secondary">
                    No approved overtime for this period
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* ── Section 4: Company Overview (HR / Admin only) ── */}
        {isHrOrAdmin && (
          <>
            <Grid item xs={12}>
              <SectionHeading
                title="Company Overview"
                badge="HR / Admin"
              />
            </Grid>

            {orgLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Paper sx={{ p: 3, textAlign: "center" }}>
                      <Skeleton
                        variant="text"
                        width="50%"
                        height={60}
                        sx={{ mx: "auto" }}
                      />
                      <Skeleton
                        variant="text"
                        width="70%"
                        height={24}
                        sx={{ mx: "auto" }}
                      />
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <SectionSkeleton height={360} />
                </Grid>
              </>
            ) : (
              <>
                {[
                  {
                    label: "Total Employees",
                    value: orgStats.employees,
                    color: "#1976d2",
                  },
                  {
                    label: "Departments",
                    value: orgStats.departments,
                    color: "#dc004e",
                  },
                  {
                    label: "Teams",
                    value: orgStats.teams,
                    color: "#388e3c",
                  },
                ].map(({ label, value, color }) => (
                  <Grid item xs={12} sm={4} key={label}>
                    <Paper
                      sx={{ p: 3, textAlign: "center" }}
                      elevation={2}
                    >
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{ color }}
                      >
                        {value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Headcount by department
                    </Typography>
                    {deptStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={Math.max(300, deptStats.length * 50)}>
                        <BarChart data={deptStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={140}
                            tick={{ fontSize: 13 }}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="employees"
                            fill="#1976d2"
                            name="Employees"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        No department data available
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}
