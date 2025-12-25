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
  IconButton,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { teamApi, departmentApi, employeeApi } from "@/lib/api";

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

export default function TeamsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isHrOrAdmin =
    roles.includes("hr_staff") || roles.includes("system_admin");

  const [teams, setTeams] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterDepartment, setFilterDepartment] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    managerId: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, [filterDepartment]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teamsData, departmentsData] = await Promise.all([
        filterDepartment ? teamApi.getAll(filterDepartment) : teamApi.getAll(),
        departmentApi.getAll(),
      ]);
      setTeams(teamsData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (team?: any) => {
    if (team) {
      setSelectedTeam(team);
      setFormData({
        name: team.name || "",
        departmentId: team.departmentId || "",
        managerId: team.managerId || "",
        description: team.description || "",
      });
    } else {
      setSelectedTeam(null);
      setFormData({
        name: "",
        departmentId: filterDepartment,
        managerId: "",
        description: "",
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.departmentId) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (selectedTeam) {
        await teamApi.update(selectedTeam.id, formData);
      } else {
        await teamApi.create(formData);
      }

      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      setDeleteLoading(true);
      await teamApi.delete(teamId);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete team");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewMembers = async (team: any) => {
    try {
      setSelectedTeam(team);
      setMembersDialogOpen(true);
      const members = await teamApi.getMembers(team.id);
      setTeamMembers(members || []);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name || "-";
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
        <Typography variant="h4">Team Management</Typography>
        {isHrOrAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Team
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <GroupIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Total Teams</Typography>
              </Box>
              <Typography variant="h4">{teams.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Departments</Typography>
              <Typography variant="h4">{departments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Active Teams</Typography>
              <Typography variant="h4">{teams.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Department</InputLabel>
                <Select
                  value={filterDepartment}
                  label="Filter by Department"
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Team Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Department
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Manager
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Members
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                Description
              </TableCell>
              {isHrOrAdmin && (
                <TableCell
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                  align="center"
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isHrOrAdmin ? 6 : 5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : teams.length > 0 ? (
              teams.map((team) => (
                <TableRow key={team.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {team.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{getDepartmentName(team.departmentId)}</TableCell>
                  <TableCell>
                    {team.managerName ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: "secondary.main",
                            fontSize: "0.75rem",
                          }}
                        >
                          {team.managerName?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {team.managerName}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="No Manager" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${team.memberCount || 0} members`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {team.description || "-"}
                    </Typography>
                  </TableCell>
                  {isHrOrAdmin && (
                    <TableCell align="center">
                      <Tooltip title="View Members">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMembers(team)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(team)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(team.id)}
                          disabled={deleteLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isHrOrAdmin ? 6 : 5} align="center">
                  No teams found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTeam ? "Edit Team" : "Add New Team"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department *</InputLabel>
                <Select
                  value={formData.departmentId}
                  label="Department *"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentId: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
            {submitting ? (
              <CircularProgress size={24} />
            ) : selectedTeam ? (
              "Save Changes"
            ) : (
              "Add Team"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTeam?.name} - Team Members ({teamMembers.length})
        </DialogTitle>
        <DialogContent>
          {teamMembers.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.light" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {member.firstName} {member.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{member.position || "-"}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          size="small"
                          color={
                            member.status === "active"
                              ? "success"
                              : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ mt: 2 }} color="text.secondary">
              No team members assigned yet
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
