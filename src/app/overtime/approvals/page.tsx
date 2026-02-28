"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OvertimeApprovalsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [comments, setComments] = useState("");

  // Mock data
  const pendingRequests = [
    {
      id: 1,
      employeeName: "John Doe",
      date: "2026-03-01",
      hours: 3,
      reason: "Project deadline",
      status: "Pending",
    },
    {
      id: 2,
      employeeName: "Jane Smith",
      date: "2026-03-02",
      hours: 2,
      reason: "Server maintenance",
      status: "Pending",
    },
  ];

  const handleOpenDialog = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setComments("");
  };

  const handleSubmit = () => {
    // TODO: Implement approval/rejection logic
    alert(
      `${actionType === "approve" ? "Approved" : "Rejected"} overtime request for ${selectedRequest?.employeeName}`,
    );
    handleCloseDialog();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Overtime Approvals
      </Typography>

      <Paper sx={{ width: "100%" }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.employeeName}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.hours} hrs</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleOpenDialog(request, "approve")}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDialog(request, "reject")}
                      >
                        <RejectIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography color="text.secondary">
            No approved overtime requests.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography color="text.secondary">
            No rejected overtime requests.
          </Typography>
        </TabPanel>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === "approve" ? "Approve" : "Reject"} Overtime Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Employee:</strong> {selectedRequest?.employeeName}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Date:</strong> {selectedRequest?.date}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Hours:</strong> {selectedRequest?.hours} hrs
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Reason:</strong> {selectedRequest?.reason}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comments (Optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={actionType === "approve" ? "success" : "error"}
          >
            {actionType === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
