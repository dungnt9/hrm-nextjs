"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Download as DownloadIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { attendanceApi, employeeApi } from "@/lib/api";
import dayjs, { Dayjs } from "dayjs";

export default function TeamAttendancePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isManagerOrHr =
    roles.includes("manager") ||
    roles.includes("hr_staff") ||
    roles.includes("system_admin");

  const [attendance, setAttendance] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isManagerOrHr) {
      fetchTeamAttendance();
    }
  }, [isManagerOrHr, date, selectedEmployee]);

  const fetchTeamAttendance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get team members
      const membersData = await employeeApi.getAll({
        pageSize: 1000,
        teamId: (user as any)?.teamId,
      });
      setTeamMembers(membersData?.data || []);

      // Get attendance for the selected date
      const params: any = {
        startDate: date?.format("YYYY-MM-DD"),
        endDate: date?.format("YYYY-MM-DD"),
        page: 1,
        pageSize: 1000,
      };

      if (selectedEmployee) {
        params.employeeId = selectedEmployee;
      }

      const attendanceData = await attendanceApi.getHistory(params);
      setAttendance(attendanceData?.data || []);
    } catch (err: any) {
      console.error("Failed to fetch team attendance:", err);
      setError(err.message || "Failed to load team attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "on_time":
      case "ontime":
        return <Chip label="On Time" color="success" size="small" />;
      case "late":
        return <Chip label="Late" color="warning" size="small" />;
      case "early_leave":
      case "earlyleave":
        return <Chip label="Early Leave" color="warning" size="small" />;
      case "absent":
        return <Chip label="Absent" color="error" size="small" />;
      case "overtime":
        return <Chip label="Overtime" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    return dayjs(isoString).format("HH:mm");
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = teamMembers.find((m) => m.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const calculatePresenceRate = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(
      (a) =>
        a.checkInStatus === "on_time" ||
        a.checkInStatus === "ontime" ||
        a.checkInStatus === "late"
    ).length;
    return ((presentCount / attendance.length) * 100).toFixed(1);
  };

  const exportToCsv = () => {
    if (attendance.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee Code",
      "Date",
      "Check In",
      "Check Out",
      "Total Hours",
      "Status",
    ];

    const rows = attendance.map((record) => [
      getEmployeeName(record.employeeId),
      record.employeeCode || "-",
      dayjs(record.date).format("YYYY-MM-DD"),
      formatTime(record.checkInTime),
      formatTime(record.checkOutTime),
      record.totalHours?.toFixed(2) || "-",
      record.checkInStatus || "-",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-attendance-${date?.format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  if (!isManagerOrHr) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Team Attendance
        </Typography>
        <Alert severity="warning">
          You don't have permission to access this page. Only Managers and HR
          Staff can view team attendance.
        </Alert>
      </Box>
    );
  }

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
        <Typography variant="h4">Team Attendance</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToCsv}
          disabled={attendance.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PresentIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Present Today</Typography>
              </Box>
              <Typography variant="h4">
                {attendance.filter(
                  (a) =>
                    a.checkInStatus === "on_time" ||
                    a.checkInStatus === "ontime" ||
                    a.checkInStatus === "late"
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AbsentIcon color="error" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Absent</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {attendance.filter((a) => a.checkInStatus === "absent").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Presence Rate</Typography>
              <Typography variant="h4">{calculatePresenceRate()}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Date"
                value={date}
                onChange={setDate}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Filter by Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {teamMembers.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Employee
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Position
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Check In
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Check In Status
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Check Out
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Total Hours
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : attendance.length > 0 ? (
              attendance.map((record, idx) => (
                <TableRow key={record.id || idx} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {record.employeeCode?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {getEmployeeName(record.employeeId)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.employeeCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{record.position || "-"}</TableCell>
                  <TableCell>{formatTime(record.checkInTime)}</TableCell>
                  <TableCell>{getStatusChip(record.checkInStatus)}</TableCell>
                  <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {record.totalHours?.toFixed(2) || "-"}h
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No attendance records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
