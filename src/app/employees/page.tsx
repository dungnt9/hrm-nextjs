"use client";

import { useEffect, useState, useMemo } from "react";
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
  IconButton,
  Avatar,
  Pagination,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { employeeApi, departmentApi } from "@/lib/api";
import { exportEmployeesToCSV } from "@/lib/export";
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

export default function EmployeesPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isHrOrAdmin =
    roles.includes("hr_staff") || roles.includes("system_admin");

  const [employees, setEmployees] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    status: "",
    page: 1,
    pageSize: 10,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    departmentId: "",
    teamId: "",
    position: "",
    employeeCode: "",
    joinDate: dayjs().format("YYYY-MM-DD"),
    status: "active",
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [filters.page, filters.departmentId, filters.status]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await employeeApi.getAll({
        page: filters.page,
        pageSize: filters.pageSize,
        departmentId: filters.departmentId || undefined,
        status: filters.status || undefined,
      });
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchTeamsByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setTeams([]);
      return;
    }
    try {
      const data = await departmentApi.getTeams(departmentId);
      setTeams(data);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setTeams([]);
    }
  };

  const handleOpenDialog = (employee?: any) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        departmentId: employee.departmentId || "",
        teamId: employee.teamId || "",
        position: employee.position || "",
        employeeCode: employee.employeeCode || "",
        joinDate: employee.joinDate || dayjs().format("YYYY-MM-DD"),
        status: employee.status || "active",
      });
      if (employee.departmentId) {
        fetchTeamsByDepartment(employee.departmentId);
      }
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        departmentId: "",
        teamId: "",
        position: "",
        employeeCode: "",
        joinDate: dayjs().format("YYYY-MM-DD"),
        status: "active",
      });
      setTeams([]);
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, formData);
      } else {
        await employeeApi.create(formData);
      }

      setDialogOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees?.data) return [];
    if (!filters.search) return employees.data;

    const searchLower = filters.search.toLowerCase();
    return employees.data.filter(
      (emp: any) =>
        emp.firstName?.toLowerCase().includes(searchLower) ||
        emp.lastName?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employeeCode?.toLowerCase().includes(searchLower)
    );
  }, [employees, filters.search]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case "active":
        return <Chip label="Active" color="success" size="small" />;
      case "inactive":
        return <Chip label="Inactive" color="default" size="small" />;
      case "onleave":
        return <Chip label="On Leave" color="warning" size="small" />;
      case "terminated":
        return <Chip label="Terminated" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
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
        <Typography variant="h4">Employees</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (filteredEmployees.length > 0) {
                exportEmployeesToCSV(filteredEmployees);
              } else {
                alert("No employees to export");
              }
            }}
            disabled={!filteredEmployees.length}
          >
            Export CSV
          </Button>
          {isHrOrAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Employee
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Employees</Typography>
              <Typography variant="h4">{employees?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Active</Typography>
              <Typography variant="h4" color="success.main">
                {employees?.data?.filter((e: any) => e.status === "active")
                  .length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Departments</Typography>
              <Typography variant="h4">{departments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">On Leave</Typography>
              <Typography variant="h4" color="warning.main">
                {employees?.data?.filter((e: any) => e.status === "onleave")
                  .length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.departmentId}
                  label="Department"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      departmentId: e.target.value,
                      page: 1,
                    })
                  }
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((d: any) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value, page: 1 })
                  }
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="onleave">On Leave</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Employee Code</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Status</TableCell>
              {isHrOrAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isHrOrAdmin ? 8 : 7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee: any) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {employee.firstName?.[0]}
                        {employee.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{employee.employeeCode}</TableCell>
                  <TableCell>{employee.departmentName || "-"}</TableCell>
                  <TableCell>{employee.teamName || "-"}</TableCell>
                  <TableCell>{employee.position || "-"}</TableCell>
                  <TableCell>
                    {employee.joinDate
                      ? dayjs(employee.joinDate).format("MMM DD, YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusChip(employee.status)}</TableCell>
                  {isHrOrAdmin && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(employee)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isHrOrAdmin ? 8 : 7} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {employees && employees.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={employees.totalPages}
            page={filters.page}
            onChange={(_, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? "Edit Employee" : "Add New Employee"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Basic Info" />
              <Tab label="Organization" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Employee Code"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Join Date"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.departmentId}
                    label="Department"
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        departmentId: e.target.value,
                        teamId: "",
                      });
                      fetchTeamsByDepartment(e.target.value);
                    }}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Team</InputLabel>
                  <Select
                    value={formData.teamId}
                    label="Team"
                    onChange={(e) =>
                      setFormData({ ...formData, teamId: e.target.value })
                    }
                    disabled={!formData.departmentId}
                  >
                    <MenuItem value="">Select Team</MenuItem>
                    {teams.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="onleave">On Leave</MenuItem>
                    <MenuItem value="terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : editingEmployee ? (
              "Save Changes"
            ) : (
              "Add Employee"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
