"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import {
  setAttendanceStatus,
  setLoading,
  checkIn,
  checkOut,
} from "@/store/slices/attendanceSlice";
import { attendanceApi, leaveApi } from "@/lib/api";
import dayjs from "dayjs";

interface LeaveBalance {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  unpaidUsed: number;
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { status, isLoading } = useSelector(
    (state: RootState) => state.attendance
  );
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceStatus();
    fetchLeaveBalance();
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
      // Set default values when API fails
      setLeaveBalance({
        annual: { total: 12, used: 0, remaining: 12 },
        sick: { total: 7, used: 0, remaining: 7 },
        unpaidUsed: 0,
      });
    } finally {
      setLeaveLoading(false);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {dayjs().format("dddd, MMMM D, YYYY")}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Attendance Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Check In
                      </Typography>
                      <Typography variant="h5">
                        {formatTime(status.checkInTime)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Check Out
                      </Typography>
                      <Typography variant="h5">
                        {formatTime(status.checkOutTime)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Hours
                      </Typography>
                      <Typography variant="h5">
                        {status.currentHours.toFixed(1)}h
                      </Typography>
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
                        {checkInLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Check In"
                        )}
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
                        {checkInLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Check Out"
                        )}
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
          <Card>
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Annual Leave</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {leaveBalance.annual.remaining}/
                      {leaveBalance.annual.total} days
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Sick Leave</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {leaveBalance.sick.remaining}/{leaveBalance.sick.total}{" "}
                      days
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Unpaid Leave Used</Typography>
                    <Typography variant="body1" fontWeight="bold">
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

        {/* Quick Stats Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">This Month</Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {dayjs().date()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Working Days
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="success.main">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Late Days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
