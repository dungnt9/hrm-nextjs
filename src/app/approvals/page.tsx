"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { leaveApi } from "@/lib/api";
import dayjs from "dayjs";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ApprovalsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isManagerOrHr =
    roles.includes("manager") ||
    roles.includes("hr_staff") ||
    roles.includes("system_admin");

  const [tabValue, setTabValue] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [processedRequests, setProcessedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view">(
    "view"
  );
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isManagerOrHr) {
      fetchRequests();
    }
  }, [isManagerOrHr]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const [pending, processed] = await Promise.all([
        leaveApi.getPendingApprovals(),
        leaveApi.getProcessedApprovals(),
      ]);
      setPendingRequests(pending.data || []);
      setProcessedRequests(processed.data || []);
    } catch (error) {
      console.error("Failed to fetch approval requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (
    request: any,
    action: "approve" | "reject" | "view"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setComment("");
    setError(null);
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;

    if (actionType === "reject" && !comment.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      if (actionType === "approve") {
        await leaveApi.approveRequest(selectedRequest.id, comment);
      } else if (actionType === "reject") {
        await leaveApi.rejectRequest(selectedRequest.id, comment);
      }

      setDialogOpen(false);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setProcessing(false);
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

  if (!isManagerOrHr) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Leave Approvals
        </Typography>
        <Alert severity="warning">
          You don't have permission to access this page. Only Managers and HR
          Staff can view and process leave approvals.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Leave Approvals
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: "warning.light" }}>
            <CardContent>
              <Typography color="warning.contrastText">
                Pending Approvals
              </Typography>
              <Typography variant="h3" color="warning.contrastText">
                {pendingRequests.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Typography color="success.contrastText">
                Approved This Month
              </Typography>
              <Typography variant="h3" color="success.contrastText">
                {
                  processedRequests.filter((r) => r.status === "approved")
                    .length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: "error.light" }}>
            <CardContent>
              <Typography color="error.contrastText">
                Rejected This Month
              </Typography>
              <Typography variant="h3" color="error.contrastText">
                {
                  processedRequests.filter((r) => r.status === "rejected")
                    .length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Pending
                  {pendingRequests.length > 0 && (
                    <Chip
                      label={pendingRequests.length}
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
              }
            />
            <Tab label="Processed" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : pendingRequests.length > 0 ? (
                    pendingRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                              }}
                            >
                              {request.employeeName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {request.employeeName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {request.employeeCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeLabel(request.leaveType)}
                        </TableCell>
                        <TableCell>
                          {dayjs(request.startDate).format("MMM DD")} -{" "}
                          {dayjs(request.endDate).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell>{request.totalDays}</TableCell>
                        <TableCell>
                          <Tooltip
                            title={request.reason || "No reason provided"}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 150,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {request.reason || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {dayjs(request.createdAt).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              onClick={() =>
                                handleOpenDialog(request, "approve")
                              }
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleOpenDialog(request, "reject")
                              }
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => handleOpenDialog(request, "view")}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No pending approval requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Processed On</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : processedRequests.length > 0 ? (
                    processedRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                              }}
                            >
                              {request.employeeName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                              {request.employeeName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeLabel(request.leaveType)}
                        </TableCell>
                        <TableCell>
                          {dayjs(request.startDate).format("MMM DD")} -{" "}
                          {dayjs(request.endDate).format("MMM DD")}
                        </TableCell>
                        <TableCell>{request.totalDays}</TableCell>
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
                          {dayjs(request.processedAt).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => handleOpenDialog(request, "view")}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No processed requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === "approve" && "Approve Leave Request"}
          {actionType === "reject" && "Reject Leave Request"}
          {actionType === "view" && "Leave Request Details"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography>{selectedRequest.employeeName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Employee Code
                  </Typography>
                  <Typography>{selectedRequest.employeeCode}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Leave Type
                  </Typography>
                  <Typography>
                    {getLeaveTypeLabel(selectedRequest.leaveType)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Days
                  </Typography>
                  <Typography>{selectedRequest.totalDays} days</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography>
                    {dayjs(selectedRequest.startDate).format("MMMM DD, YYYY")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography>
                    {dayjs(selectedRequest.endDate).format("MMMM DD, YYYY")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography>
                    {selectedRequest.reason || "No reason provided"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  {getStatusChip(selectedRequest.status)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted On
                  </Typography>
                  <Typography>
                    {dayjs(selectedRequest.createdAt).format("MMMM DD, YYYY")}
                  </Typography>
                </Grid>

                {selectedRequest.rejectionReason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">
                      Rejection Reason
                    </Typography>
                    <Typography color="error.main">
                      {selectedRequest.rejectionReason}
                    </Typography>
                  </Grid>
                )}

                {actionType !== "view" && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={
                        actionType === "reject"
                          ? "Rejection Reason *"
                          : "Comment (optional)"
                      }
                      multiline
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        actionType === "reject"
                          ? "Please provide a reason for rejection..."
                          : "Add a comment (optional)..."
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {actionType === "view" ? "Close" : "Cancel"}
          </Button>
          {actionType !== "view" && (
            <Button
              variant="contained"
              color={actionType === "approve" ? "success" : "error"}
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? (
                <CircularProgress size={24} />
              ) : actionType === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
