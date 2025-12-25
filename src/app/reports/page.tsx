"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
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
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { attendanceApi, leaveApi, employeeApi } from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import dayjs from "dayjs";

export default function ReportsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isManagerOrHr =
    roles.includes("manager") ||
    roles.includes("hr_staff") ||
    roles.includes("system_admin");

  const [monthYear, setMonthYear] = useState(dayjs().format("YYYY-MM"));
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [leaveStats, setLeaveStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ["#1976d2", "#dc004e", "#f57c00", "#388e3c", "#7b1fa2"];

  useEffect(() => {
    if (isManagerOrHr) {
      fetchReportData();
    }
  }, [isManagerOrHr, monthYear]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [startDate, endDate] = [
        dayjs(monthYear).startOf("month").format("YYYY-MM-DD"),
        dayjs(monthYear).endOf("month").format("YYYY-MM-DD"),
      ];

      // Fetch attendance data
      const attendance = await attendanceApi.getHistory({
        startDate,
        endDate,
        pageSize: 1000,
      });

      // Generate attendance trend data
      const days = [];
      for (let i = 1; i <= dayjs(monthYear).daysInMonth(); i++) {
        const day = dayjs(monthYear).date(i);
        const dayAttendance = (attendance?.data || []).filter((a: any) =>
          dayjs(a.date).isSame(day, "day")
        );
        days.push({
          date: day.format("MMM DD"),
          present: dayAttendance.filter(
            (a: any) =>
              a.checkInStatus === "on_time" || a.checkInStatus === "ontime"
          ).length,
          late: dayAttendance.filter((a: any) => a.checkInStatus === "late")
            .length,
          absent: dayAttendance.filter((a: any) => a.checkInStatus === "absent")
            .length,
        });
      }
      setAttendanceData(days);

      // Fetch leave statistics
      const leaveRequests = await leaveApi.getRequests({
        pageSize: 1000,
      });
      const leaveByType = (leaveRequests?.data || []).reduce(
        (acc: any, leave: any) => {
          const existing = acc.find((l: any) => l.name === leave.leaveType);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: leave.leaveType, value: 1 });
          }
          return acc;
        },
        []
      );
      setLeaveStats(leaveByType);

      // Fetch department stats
      const employees = await employeeApi.getAll({ pageSize: 1000 });
      const byDepartment = (employees?.data || []).reduce(
        (acc: any, emp: any) => {
          const existing = acc.find(
            (d: any) => d.name === emp.departmentName
          );
          if (existing) {
            existing.employees += 1;
          } else {
            acc.push({ name: emp.departmentName || "Unassigned", employees: 1 });
          }
          return acc;
        },
        []
      );
      setDepartmentStats(byDepartment);
    } catch (err: any) {
      console.error("Failed to fetch report data:", err);
      setError(err.message || "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Present", "Late", "Absent"];
    const rows = attendanceData.map((d) => [d.date, d.present, d.late, d.absent]);

    exportToCSV({
      filename: `attendance-report-${monthYear}`,
      headers,
      rows,
    });
  };

  if (!isManagerOrHr) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Reports & Analytics
        </Typography>
        <Alert severity="warning">
          You don't have permission to access this page. Only Managers and HR
          Staff can view reports.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor attendance, leave, and department statistics
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Month/Year</InputLabel>
              <Select
                value={monthYear}
                label="Month/Year"
                onChange={(e) => setMonthYear(e.target.value)}
              >
                {[...Array(12)].map((_, i) => {
                  const date = dayjs().subtract(i, "month");
                  return (
                    <MenuItem key={i} value={date.format("YYYY-MM")}>
                      {date.format("MMMM YYYY")}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={isLoading || attendanceData.length === 0}
            >
              Export Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Attendance Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Daily Attendance Trend</Typography>
                </Box>
                {attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#388e3c" name="Present" />
                      <Bar dataKey="late" fill="#f57c00" name="Late" />
                      <Bar dataKey="absent" fill="#d32f2f" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">No data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Statistics */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Requests by Type
                </Typography>
                {leaveStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={leaveStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaveStats.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">No leave requests</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Department Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <PeopleIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Employees by Department</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "primary.light" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Department
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="right">
                          Employee Count
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Distribution
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {departmentStats.map((dept, idx) => {
                        const total = departmentStats.reduce(
                          (sum, d) => sum + d.employees,
                          0
                        );
                        const percentage = (
                          (dept.employees / total) *
                          100
                        ).toFixed(1);
                        return (
                          <TableRow key={idx}>
                            <TableCell>{dept.name}</TableCell>
                            <TableCell align="right">
                              {dept.employees}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={parseFloat(percentage)}
                                  sx={{ flex: 1, minWidth: 100 }}
                                />
                                <Typography variant="body2">
                                  {percentage}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Stats */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TimeIcon sx={{ mr: 1, color: "success.main" }} />
                  <Typography color="text.secondary">
                    Total Attendances
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {attendanceData.reduce(
                    (sum, d) => sum + d.present + d.late,
                    0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TimeIcon sx={{ mr: 1, color: "warning.main" }} />
                  <Typography color="text.secondary">Total Late</Typography>
                </Box>
                <Typography variant="h4">
                  {attendanceData.reduce((sum, d) => sum + d.late, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TimeIcon sx={{ mr: 1, color: "error.main" }} />
                  <Typography color="text.secondary">Total Absent</Typography>
                </Box>
                <Typography variant="h4">
                  {attendanceData.reduce((sum, d) => sum + d.absent, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography color="text.secondary">
                    Leave Requests
                  </Typography>
                </Box>
                <Typography variant="h4">{leaveStats.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
