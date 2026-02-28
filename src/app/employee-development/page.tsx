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
  Tabs,
  Tab,
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
  Rating,
  LinearProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Verified as VerifiedIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import { getAccessToken } from "@/lib/auth";
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Skill Categories
const SKILL_CATEGORIES = [
  "Technical",
  "Soft Skills",
  "Language",
  "Certification",
  "Management",
  "Other",
];

// Review Types
const REVIEW_TYPES = ["Annual", "Mid-Year", "Probation", "360-Degree"];

// Goal Categories
const GOAL_CATEGORIES = ["Performance", "Development", "Project", "Other"];

export default function EmployeeDevelopmentPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const roles = user?.roles || [];
  const isHrOrAdmin =
    roles.includes("hr_staff") || roles.includes("system_admin");
  const isManager = roles.includes("manager");

  const [tabValue, setTabValue] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "skill" | "review" | "goal" | "certification" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const [skillForm, setSkillForm] = useState({
    skillName: "",
    category: "Technical",
    proficiencyLevel: 3,
    notes: "",
  });

  const [reviewForm, setReviewForm] = useState({
    reviewType: "Annual",
    reviewPeriodStart: dayjs().format("YYYY-MM-DD"),
    reviewPeriodEnd: dayjs().format("YYYY-MM-DD"),
    performanceRating: 3,
    behaviorRating: 3,
    teamworkRating: 3,
    initiativeRating: 3,
    overallRating: 3,
    strengths: "",
    areasForImprovement: "",
    goals: "",
    reviewerComments: "",
  });

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    goalType: "Individual",
    category: "Performance",
    startDate: dayjs().format("YYYY-MM-DD"),
    targetDate: dayjs().add(3, "month").format("YYYY-MM-DD"),
    priority: "Medium",
    metrics: "",
  });

  const [certForm, setCertForm] = useState({
    certificationName: "",
    issuingOrganization: "",
    certificationNumber: "",
    issueDate: dayjs().format("YYYY-MM-DD"),
    expiryDate: "",
    requiresRenewal: false,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeData();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      // Fetch employees for HR/Manager view
      const response = await fetch("/api/employees", {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      const data = await response.json();
      setEmployees(data.data || []);

      // Auto-select current employee for non-HR/Manager users
      if (!isHrOrAdmin && !isManager && data.data?.length > 0) {
        const me = await fetch("/api/employees/me", {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }).then((r) => r.json());
        setSelectedEmployee(me);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeData = async () => {
    if (!selectedEmployee?.id) return;

    try {
      setIsLoading(true);
      const token = getAccessToken();
      const employeeId = selectedEmployee.id;

      // Fetch skills
      const skillsRes = await fetch(`/api/employees/${employeeId}/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData);
      }

      // Fetch performance reviews
      const reviewsRes = await fetch(
        `/api/employees/${employeeId}/performance-reviews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }

      // Fetch goals
      const goalsRes = await fetch(`/api/employees/${employeeId}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }

      // Fetch certifications
      const certsRes = await fetch(
        `/api/employees/${employeeId}/certifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (certsRes.ok) {
        const certsData = await certsRes.json();
        setCertifications(certsData);
      }
    } catch (error) {
      console.error("Failed to fetch employee development data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee?.id) return;

    try {
      const token = getAccessToken();
      const employeeId = selectedEmployee.id;
      let response;

      switch (dialogType) {
        case "skill":
          response = await fetch(`/api/employees/${employeeId}/skills`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(skillForm),
          });
          break;
        case "review":
          response = await fetch(
            `/api/employees/${employeeId}/performance-reviews`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(reviewForm),
            },
          );
          break;
        case "goal":
          response = await fetch(`/api/employees/${employeeId}/goals`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(goalForm),
          });
          break;
        case "certification":
          response = await fetch(
            `/api/employees/${employeeId}/certifications`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(certForm),
            },
          );
          break;
      }

      if (response && response.ok) {
        handleCloseDialog();
        fetchEmployeeData();
      } else {
        setError("Failed to save");
      }
    } catch (error) {
      setError("Failed to save");
    }
  };

  const getProficiencyLabel = (level: number) => {
    const labels = [
      "Beginner",
      "Elementary",
      "Intermediate",
      "Advanced",
      "Expert",
    ];
    return labels[level - 1] || "Unknown";
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 4) return "success";
    if (level >= 3) return "primary";
    return "warning";
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
        <Typography variant="h4">Employee Development</Typography>
      </Box>

      {/* Employee Selector for HR/Manager */}
      {(isHrOrAdmin || isManager) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={selectedEmployee?.id || ""}
                onChange={(e) => {
                  const emp = employees.find((emp) => emp.id === e.target.value);
                  setSelectedEmployee(emp);
                }}
                label="Select Employee"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {!selectedEmployee && (
        <Alert severity="info">
          Please select an employee to view development data
        </Alert>
      )}

      {selectedEmployee && (
        <>
          {/* Employee Info Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedEmployee.position} • {selectedEmployee.department}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={1}>
                    <Chip
                      icon={<StarIcon />}
                      label={`${skills.length} Skills`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`${goals.filter((g) => g.status !== "Completed").length} Active Goals`}
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<VerifiedIcon />}
                      label={`${certifications.filter((c) => c.status === "Active").length} Certifications`}
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Skills" />
              <Tab label="Performance Reviews" />
              <Tab label="Goals & OKRs" />
              <Tab label="Certifications" />
            </Tabs>
          </Box>

          {/* Skills Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              {(isHrOrAdmin || isManager) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog("skill")}
                >
                  Add Skill
                </Button>
              )}
            </Box>

            {isLoading ? (
              <CircularProgress />
            ) : skills.length === 0 ? (
              <Alert severity="info">No skills recorded yet</Alert>
            ) : (
              <Grid container spacing={2}>
                {SKILL_CATEGORIES.map((category) => {
                  const categorySkills = skills.filter(
                    (s) => s.category === category,
                  );
                  if (categorySkills.length === 0) return null;

                  return (
                    <Grid item xs={12} md={6} key={category}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {category}
                          </Typography>
                          <Stack spacing={2}>
                            {categorySkills.map((skill) => (
                              <Box key={skill.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="bold">
                                    {skill.skillName}
                                  </Typography>
                                  <Chip
                                    label={getProficiencyLabel(
                                      skill.proficiencyLevel,
                                    )}
                                    color={getProficiencyColor(
                                      skill.proficiencyLevel,
                                    )}
                                    size="small"
                                  />
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={(skill.proficiencyLevel / 5) * 100}
                                  sx={{ mt: 1 }}
                                />
                                {skill.notes && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {skill.notes}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>

          {/* Performance Reviews Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              {(isHrOrAdmin || isManager) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog("review")}
                >
                  Create Review
                </Button>
              )}
            </Box>

            {isLoading ? (
              <CircularProgress />
            ) : reviews.length === 0 ? (
              <Alert severity="info">No performance reviews yet</Alert>
            ) : (
              <Stack spacing={2}>
                {reviews.map((review) => (
                  <Accordion key={review.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          pr: 2,
                        }}
                      >
                        <Typography>
                          {review.reviewType} Review -{" "}
                          {dayjs(review.reviewDate).format("MMMM YYYY")}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Chip
                            label={`Overall: ${review.overallRating}/5`}
                            color="primary"
                            size="small"
                          />
                          <Chip label={review.status} size="small" />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Ratings
                          </Typography>
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                Performance:
                              </Typography>
                              <Rating
                                value={review.performanceRating}
                                readOnly
                                size="small"
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">Behavior:</Typography>
                              <Rating
                                value={review.behaviorRating}
                                readOnly
                                size="small"
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">Teamwork:</Typography>
                              <Rating
                                value={review.teamworkRating}
                                readOnly
                                size="small"
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                Initiative:
                              </Typography>
                              <Rating
                                value={review.initiativeRating}
                                readOnly
                                size="small"
                              />
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Review Period
                          </Typography>
                          <Typography variant="body2">
                            {dayjs(review.reviewPeriodStart).format(
                              "MMM DD, YYYY",
                            )}{" "}
                            -{" "}
                            {dayjs(review.reviewPeriodEnd).format(
                              "MMM DD, YYYY",
                            )}
                          </Typography>
                        </Grid>
                        {review.strengths && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Strengths
                            </Typography>
                            <Typography variant="body2">
                              {review.strengths}
                            </Typography>
                          </Grid>
                        )}
                        {review.areasForImprovement && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Areas for Improvement
                            </Typography>
                            <Typography variant="body2">
                              {review.areasForImprovement}
                            </Typography>
                          </Grid>
                        )}
                        {review.goals && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Goals
                            </Typography>
                            <Typography variant="body2">
                              {review.goals}
                            </Typography>
                          </Grid>
                        )}
                        {review.reviewerComments && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Reviewer Comments
                            </Typography>
                            <Typography variant="body2">
                              {review.reviewerComments}
                            </Typography>
                          </Grid>
                        )}
                        {review.employeeComments && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Employee Comments
                            </Typography>
                            <Typography variant="body2">
                              {review.employeeComments}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Goals Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog("goal")}
              >
                Add Goal
              </Button>
            </Box>

            {isLoading ? (
              <CircularProgress />
            ) : goals.length === 0 ? (
              <Alert severity="info">No goals set yet</Alert>
            ) : (
              <Grid container spacing={2}>
                {goals.map((goal) => (
                  <Grid item xs={12} md={6} key={goal.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6">{goal.title}</Typography>
                          <Chip
                            label={goal.priority}
                            color={
                              goal.priority === "High"
                                ? "error"
                                : goal.priority === "Medium"
                                  ? "warning"
                                  : "default"
                            }
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          paragraph
                        >
                          {goal.description}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: {goal.progress}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={goal.progress}
                          />
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={goal.category}
                            size="small"
                            variant="outlined"
                          />
                          <Chip label={goal.status} size="small" />
                          <Chip
                            label={`Due: ${dayjs(goal.targetDate).format("MMM DD, YYYY")}`}
                            size="small"
                            icon={<AssignmentIcon />}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Certifications Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              {(isHrOrAdmin || isManager) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog("certification")}
                >
                  Add Certification
                </Button>
              )}
            </Box>

            {isLoading ? (
              <CircularProgress />
            ) : certifications.length === 0 ? (
              <Alert severity="info">No certifications recorded yet</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Certification</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certifications.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {cert.certificationName}
                          </Typography>
                          {cert.certificationNumber && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              #{cert.certificationNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{cert.issuingOrganization}</TableCell>
                        <TableCell>
                          {dayjs(cert.issueDate).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell>
                          {cert.expiryDate
                            ? dayjs(cert.expiryDate).format("MMM DD, YYYY")
                            : "No expiry"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cert.status}
                            color={
                              cert.status === "Active" ? "success" : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </>
      )}

      {/* Add Skill Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "skill"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Skill</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Skill Name"
              value={skillForm.skillName}
              onChange={(e) =>
                setSkillForm({ ...skillForm, skillName: e.target.value })
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={skillForm.category}
                onChange={(e) =>
                  setSkillForm({ ...skillForm, category: e.target.value })
                }
                label="Category"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography gutterBottom>Proficiency Level</Typography>
              <Rating
                value={skillForm.proficiencyLevel}
                onChange={(e, value) =>
                  setSkillForm({ ...skillForm, proficiencyLevel: value || 1 })
                }
                max={5}
              />
              <Typography variant="caption">
                {getProficiencyLabel(skillForm.proficiencyLevel)}
              </Typography>
            </Box>
            <TextField
              label="Notes"
              value={skillForm.notes}
              onChange={(e) =>
                setSkillForm({ ...skillForm, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Review Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "review"}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Performance Review</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Review Type</InputLabel>
                <Select
                  value={reviewForm.reviewType}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, reviewType: e.target.value })
                  }
                  label="Review Type"
                >
                  {REVIEW_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Review Period Start"
                type="date"
                value={reviewForm.reviewPeriodStart}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    reviewPeriodStart: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Review Period End"
                type="date"
                value={reviewForm.reviewPeriodEnd}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    reviewPeriodEnd: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Ratings (1-5)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Performance
                </Typography>
                <Rating
                  value={reviewForm.performanceRating}
                  onChange={(e, value) =>
                    setReviewForm({
                      ...reviewForm,
                      performanceRating: value || 1,
                    })
                  }
                  max={5}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Behavior
                </Typography>
                <Rating
                  value={reviewForm.behaviorRating}
                  onChange={(e, value) =>
                    setReviewForm({ ...reviewForm, behaviorRating: value || 1 })
                  }
                  max={5}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Teamwork
                </Typography>
                <Rating
                  value={reviewForm.teamworkRating}
                  onChange={(e, value) =>
                    setReviewForm({ ...reviewForm, teamworkRating: value || 1 })
                  }
                  max={5}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Initiative
                </Typography>
                <Rating
                  value={reviewForm.initiativeRating}
                  onChange={(e, value) =>
                    setReviewForm({
                      ...reviewForm,
                      initiativeRating: value || 1,
                    })
                  }
                  max={5}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Overall Rating
                </Typography>
                <Rating
                  value={reviewForm.overallRating}
                  onChange={(e, value) =>
                    setReviewForm({ ...reviewForm, overallRating: value || 1 })
                  }
                  max={5}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Strengths"
                value={reviewForm.strengths}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, strengths: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Areas for Improvement"
                value={reviewForm.areasForImprovement}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    areasForImprovement: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Goals"
                value={reviewForm.goals}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, goals: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reviewer Comments"
                value={reviewForm.reviewerComments}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    reviewerComments: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "goal"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Goal</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Goal Title"
              value={goalForm.title}
              onChange={(e) =>
                setGoalForm({ ...goalForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={goalForm.description}
              onChange={(e) =>
                setGoalForm({ ...goalForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={goalForm.category}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, category: e.target.value })
                    }
                    label="Category"
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={goalForm.priority}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, priority: e.target.value })
                    }
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={goalForm.startDate}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, startDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Target Date"
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, targetDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Success Metrics"
              value={goalForm.metrics}
              onChange={(e) =>
                setGoalForm({ ...goalForm, metrics: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              placeholder="How will you measure success?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "certification"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Certification</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Certification Name"
              value={certForm.certificationName}
              onChange={(e) =>
                setCertForm({ ...certForm, certificationName: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Issuing Organization"
              value={certForm.issuingOrganization}
              onChange={(e) =>
                setCertForm({
                  ...certForm,
                  issuingOrganization: e.target.value,
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Certification Number"
              value={certForm.certificationNumber}
              onChange={(e) =>
                setCertForm({
                  ...certForm,
                  certificationNumber: e.target.value,
                })
              }
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Issue Date"
                  type="date"
                  value={certForm.issueDate}
                  onChange={(e) =>
                    setCertForm({ ...certForm, issueDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Expiry Date"
                  type="date"
                  value={certForm.expiryDate}
                  onChange={(e) =>
                    setCertForm({ ...certForm, expiryDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Certification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
