"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Download as DownloadIcon } from "@mui/icons-material";
import { attendanceApi } from "@/lib/api";
import { exportAttendanceToCSV } from "@/lib/export";
import dayjs, { Dayjs } from "dayjs";

export default function AttendancePage() {
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getHistory({
        startDate: startDate?.format("YYYY-MM-DD"),
        endDate: endDate?.format("YYYY-MM-DD"),
        page,
        pageSize: 10,
      });
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch attendance history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchHistory();
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

  const handleExport = () => {
    if (history?.data && history.data.length > 0) {
      exportAttendanceToCSV(history.data);
    } else {
      alert("No attendance records to export");
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Attendance History</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!history?.data?.length}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary Card */}
      {history?.summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4">
                  {history.summary.presentDays}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Present
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4">
                  {history.summary.lateCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Late
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4">
                  {history.summary.earlyLeaveCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Early Leave
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4">
                  {history.summary.totalHours.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4">
                  {history.summary.averageHoursPerDay.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Hours/Day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button variant="contained" onClick={handleSearch} fullWidth>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check In Status</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Check Out Status</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : history?.data?.length > 0 ? (
              history.data.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {dayjs(record.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>{formatTime(record.checkInTime)}</TableCell>
                  <TableCell>
                    {getStatusChip(record.checkInStatus)}
                    {record.lateMinutes > 0 && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        (+{record.lateMinutes} min)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                  <TableCell>
                    {record.checkOutTime &&
                      getStatusChip(record.checkOutStatus)}
                    {record.earlyLeaveMinutes > 0 && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        (-{record.earlyLeaveMinutes} min)
                      </Typography>
                    )}
                    {record.overtimeMinutes > 0 && (
                      <Typography
                        variant="caption"
                        color="info.main"
                        sx={{ ml: 1 }}
                      >
                        (+{record.overtimeMinutes} min OT)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{record.totalHours?.toFixed(2) || "-"}</TableCell>
                  <TableCell>{record.note || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No attendance records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {history?.totalCount > 10 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Typography sx={{ display: "flex", alignItems: "center" }}>
            Page {page} of {Math.ceil(history.totalCount / 10)}
          </Typography>
          <Button
            disabled={page >= Math.ceil(history.totalCount / 10)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
