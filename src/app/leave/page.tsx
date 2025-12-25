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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Add as AddIcon, Download as DownloadIcon } from "@mui/icons-material";
import { RootState } from "@/store";
import { leaveApi, employeeApi } from "@/lib/api";
import { exportLeaveRequestsToCSV } from "@/lib/export";
import dayjs, { Dayjs } from "dayjs";

export default function LeavePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [leaveRequests, setLeaveRequests] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    leaveType: "annual",
    startDate: dayjs() as Dayjs | null,
    endDate: dayjs() as Dayjs | null,
    reason: "",
    approverId: "",
    approverType: "manager",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [requestsData, balanceData] = await Promise.all([
        leaveApi.getRequests(),
        leaveApi.getBalance(),
      ]);
      setLeaveRequests(requestsData);
      setLeaveBalance(balanceData);

      // Fetch potential approvers (managers/HR)
      const employeesData = await employeeApi.getAll({ pageSize: 100 });
      // In real app, filter by role
      setManagers(employeesData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.approverId) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await leaveApi.createRequest({
        leaveType: formData.leaveType,
        startDate: formData.startDate.format("YYYY-MM-DD"),
        endDate: formData.endDate.format("YYYY-MM-DD"),
        reason: formData.reason,
        approverId: formData.approverId,
        approverType: formData.approverType,
      });
      setDialogOpen(false);
      fetchData();
      // Reset form
      setFormData({
        leaveType: "annual",
        startDate: dayjs(),
        endDate: dayjs(),
        reason: "",
        approverId: "",
        approverType: "manager",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
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

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Annual Leave";
      case "sick":
        return "Sick Leave";
      case "unpaid":
        return "Unpaid Leave";
      default:
        return type;
    }
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
        <Typography variant="h4">Leave Requests</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (leaveRequests?.data && leaveRequests.data.length > 0) {
                exportLeaveRequestsToCSV(leaveRequests.data);
              } else {
                alert("No leave requests to export");
              }
            }}
            disabled={!leaveRequests?.data?.length}
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

      {/* Leave Balance */}
      {leaveBalance && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Annual Leave
                </Typography>
                <Typography variant="h3">
                  {leaveBalance.annual.remaining}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  of {leaveBalance.annual.total} days remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Sick Leave
                </Typography>
                <Typography variant="h3">
                  {leaveBalance.sick.remaining}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  of {leaveBalance.sick.total} days remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Unpaid Leave
                </Typography>
                <Typography variant="h3">{leaveBalance.unpaidUsed}</Typography>
                <Typography variant="body2" color="text.secondary">
                  days taken this year
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Leave Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Approver</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : leaveRequests?.data?.length > 0 ? (
              leaveRequests.data.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell>{getLeaveTypeLabel(request.leaveType)}</TableCell>
                  <TableCell>
                    {dayjs(request.startDate).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>
                    {dayjs(request.endDate).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>{request.totalDays}</TableCell>
                  <TableCell>{request.reason || "-"}</TableCell>
                  <TableCell>{request.approverName}</TableCell>
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
                <TableCell colSpan={8} align="center">
                  No leave requests found
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
        <DialogTitle>New Leave Request</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={formData.leaveType}
                  label="Leave Type"
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                >
                  <MenuItem value="annual">Annual Leave</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="unpaid">Unpaid Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) =>
                  setFormData({ ...formData, startDate: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
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
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Approver Type</InputLabel>
                <Select
                  value={formData.approverType}
                  label="Approver Type"
                  onChange={(e) =>
                    setFormData({ ...formData, approverType: e.target.value })
                  }
                >
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Approver</InputLabel>
                <Select
                  value={formData.approverId}
                  label="Approver"
                  onChange={(e) =>
                    setFormData({ ...formData, approverId: e.target.value })
                  }
                >
                  {managers.map((m: any) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
