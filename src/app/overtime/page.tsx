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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  AccessTime as OvertimeIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { overtimeApi } from "@/lib/api";
import dayjs, { Dayjs } from "dayjs";

export default function OvertimePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [overtimeRequests, setOvertimeRequests] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: dayjs() as Dayjs | null,
    startTime: dayjs().hour(18).minute(0) as Dayjs | null,
    endTime: dayjs().hour(20).minute(0) as Dayjs | null,
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const requestsData = await overtimeApi.getRequests();
      setOvertimeRequests(requestsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalMinutes = (
    startTime: Dayjs | null,
    endTime: Dayjs | null
  ): number => {
    if (!startTime || !endTime) return 0;
    const diffMs = endTime.diff(startTime);
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError("Please fill in all required fields");
      return;
    }

    const totalMinutes = calculateTotalMinutes(
      formData.startTime,
      formData.endTime
    );
    if (totalMinutes <= 0) {
      setError("End time must be after start time");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await overtimeApi.createRequest({
        date: formData.date.format("YYYY-MM-DD"),
        startTime: formData.startTime.format("HH:mm"),
        endTime: formData.endTime.format("HH:mm"),
        totalMinutes,
        reason: formData.reason,
      });
      setDialogOpen(false);
      fetchData();
      // Reset form
      setFormData({
        date: dayjs(),
        startTime: dayjs().hour(18).minute(0),
        endTime: dayjs().hour(20).minute(0),
        reason: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit overtime request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Chip label="Pending" color="warning" size="small" />;
      case "approved":
        return <Chip label="Approved" color="success" size="small" />;
      case "rejected":
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Calculate statistics
  const requests = overtimeRequests?.data || [];
  const totalHoursThisMonth = requests
    .filter((r: any) => {
      const requestDate = dayjs(r.date);
      return (
        requestDate.month() === dayjs().month() &&
        requestDate.year() === dayjs().year() &&
        r.status?.toLowerCase() === "approved"
      );
    })
    .reduce((sum: number, r: any) => sum + (r.totalMinutes || 0), 0);

  const pendingCount = requests.filter(
    (r: any) => r.status?.toLowerCase() === "pending"
  ).length;

  const approvedCount = requests.filter(
    (r: any) => r.status?.toLowerCase() === "approved"
  ).length;

  const exportToCSV = () => {
    if (!requests.length) {
      alert("No overtime requests to export");
      return;
    }

    const headers = ["Date", "Start Time", "End Time", "Duration", "Reason", "Status", "Created At"];
    const csvRows = [headers.join(",")];

    requests.forEach((request: any) => {
      const row = [
        dayjs(request.date).format("YYYY-MM-DD"),
        request.startTime,
        request.endTime,
        `${Math.floor((request.totalMinutes || 0) / 60)}h ${(request.totalMinutes || 0) % 60}m`,
        `"${(request.reason || "").replace(/"/g, '""')}"`,
        request.status,
        dayjs(request.createdAt).format("YYYY-MM-DD HH:mm"),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `overtime_requests_${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
  };

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
        <Typography variant="h4">Overtime Requests</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={!requests.length}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Request
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <OvertimeIcon color="primary" />
                <Typography variant="h6" color="primary">
                  This Month
                </Typography>
              </Box>
              <Typography variant="h3">
                {Math.floor(totalHoursThisMonth / 60)}h {totalHoursThisMonth % 60}m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                approved overtime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Pending
              </Typography>
              <Typography variant="h3">{pendingCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                requests awaiting approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Approved
              </Typography>
              <Typography variant="h3">{approvedCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                total approved requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overtime Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : requests.length > 0 ? (
              requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {dayjs(request.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>{request.startTime}</TableCell>
                  <TableCell>{request.endTime}</TableCell>
                  <TableCell>
                    {Math.floor((request.totalMinutes || 0) / 60)}h{" "}
                    {(request.totalMinutes || 0) % 60}m
                  </TableCell>
                  <TableCell>{request.reason || "-"}</TableCell>
                  <TableCell>
                    {getStatusChip(request.status)}
                    {request.rejectionReason && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="error"
                      >
                        {request.rejectionReason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {dayjs(request.createdAt).format("MMM DD, YYYY")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No overtime requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Request Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Overtime Request</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(time) => setFormData({ ...formData, startTime: time })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(time) => setFormData({ ...formData, endTime: time })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            {formData.startTime && formData.endTime && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Duration:{" "}
                  {Math.floor(
                    calculateTotalMinutes(formData.startTime, formData.endTime) /
                      60
                  )}
                  h{" "}
                  {calculateTotalMinutes(formData.startTime, formData.endTime) %
                    60}
                  m
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Describe why you need to work overtime..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
