"use client";

import { useEffect, useState } from "react";
import {
  Box,
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
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  BreakfastDining as BreakIcon,
} from "@mui/icons-material";
import { attendanceApi } from "@/lib/api";
import dayjs from "dayjs";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await attendanceApi.getShifts();
      setShifts(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      console.error("Failed to fetch shifts:", err);
      setError(err.message || "Failed to load shifts");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    try {
      return dayjs(time, "HH:mm:ss").format("HH:mm");
    } catch {
      return time;
    }
  };

  const calculateShiftDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "-";
    try {
      const start = dayjs(startTime, "HH:mm:ss");
      const end = dayjs(endTime, "HH:mm:ss");
      const duration = end.diff(start, "hours", true);
      return `${duration.toFixed(1)} hours`;
    } catch {
      return "-";
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Shift Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View and manage company work shifts
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Total Shifts</Typography>
              </Box>
              <Typography variant="h4">{shifts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TimeIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Active Shifts</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {shifts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <BreakIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Avg Break Time</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {shifts.length > 0
                  ? (
                      shifts.reduce(
                        (sum, s) => sum + (s.breakMinutes || 0),
                        0
                      ) / shifts.length
                    ).toFixed(0)
                  : 0}
                m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shifts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Shift Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Start Time
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                End Time
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Duration
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Break Time
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Status
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
            ) : shifts.length > 0 ? (
              shifts.map((shift, idx) => (
                <TableRow key={shift.id || idx} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {shift.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: "1.2rem", color: "primary.main" }} />
                      <Typography variant="body2">
                        {formatTime(shift.startTime)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: "1.2rem", color: "success.main" }} />
                      <Typography variant="body2">
                        {formatTime(shift.endTime)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {calculateShiftDuration(shift.startTime, shift.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <BreakIcon sx={{ fontSize: "1.2rem", color: "warning.main" }} />
                      <Typography variant="body2">
                        {shift.breakMinutes || 0} min
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No shifts configured yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info Box */}
      <Card sx={{ mt: 3, bgcolor: "info.light" }}>
        <CardContent>
          <Typography variant="h6" color="info.main" gutterBottom>
            About Work Shifts
          </Typography>
          <Typography variant="body2" color="info.dark">
            Work shifts define the standard working hours for employees. Each shift
            specifies the start time, end time, and break duration. Employees are
            assigned shifts during the hiring process and can be updated as needed by
            HR staff.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
