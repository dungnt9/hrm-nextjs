"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccountCircle as ProfileIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Description as DocumentIcon,
  ContactPhone as ContactIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { RootState } from "@/store";
import {
  authApi,
  employeeApi,
  notificationApi,
  documentApi,
  contactApi,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { setAuthenticated } from "@/store/slices/authSlice";
import dayjs from "dayjs";

const emptyDocForm = {
  documentType: "",
  documentName: "",
  filePath: "",
  description: "",
};
const emptyContactForm = {
  contactName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
  isPrimary: false,
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [savingDoc, setSavingDoc] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [savingContact, setSavingContact] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    team: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchNotificationSettings();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeApi.getMe();
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        position: data.position || "",
        department: data.departmentName || "",
        team: data.teamName || "",
      });
      // Load documents and contacts
      if (data.id) {
        documentApi
          .getAll(data.id)
          .then(setDocuments)
          .catch(() => {});
        contactApi
          .getAll(data.id)
          .then(setContacts)
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin cá nhân");
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: (user as any).phone || "",
          position: (user as any).position || "",
          department: "",
          team: "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const settings = await notificationApi.getSettings();
      if (settings) {
        setNotificationSettings({
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          pushNotifications: settings.pushNotifications ?? true,
        });
      }
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await employeeApi.updateMe(formData);
      dispatch(
        setAuthenticated({
          user: { ...user, ...formData } as any,
          token: getAccessToken() || "",
        }),
      );
      setIsEditing(false);
      setProfile({ ...profile, ...formData });
    } catch (err: any) {
      setError(err.message || "Không thể lưu thông tin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("Vui lòng điền đầy đủ thông tin mật khẩu");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "Không thể đổi mật khẩu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationSettingsChange = async (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings],
    };
    setNotificationSettings(newSettings);
    try {
      setSavingNotifications(true);
      await notificationApi.updateSettings(newSettings);
      setNotificationSuccess(true);
      setTimeout(() => setNotificationSuccess(false), 2000);
    } catch {
      setNotificationSettings(notificationSettings);
    } finally {
      setSavingNotifications(false);
    }
  };

  // Documents
  const handleAddDoc = async () => {
    if (!profile?.id) return;
    setSavingDoc(true);
    try {
      const newDoc = await documentApi.add(profile.id, docForm);
      setDocuments([...documents, newDoc]);
      setDocDialogOpen(false);
      setDocForm(emptyDocForm);
    } catch {
      setError("Không thể thêm tài liệu");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!profile?.id) return;
    try {
      await documentApi.delete(profile.id, docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch {
      setError("Không thể xóa tài liệu");
    }
  };

  // Contacts
  const openAddContact = () => {
    setEditingContact(null);
    setContactForm(emptyContactForm);
    setContactDialogOpen(true);
  };

  const openEditContact = (c: any) => {
    setEditingContact(c);
    setContactForm({
      contactName: c.contactName,
      relationship: c.relationship,
      phone: c.phone,
      email: c.email ?? "",
      address: c.address ?? "",
      isPrimary: c.isPrimary,
    });
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!profile?.id) return;
    setSavingContact(true);
    try {
      if (editingContact) {
        const updated = await contactApi.update(
          profile.id,
          editingContact.id,
          contactForm,
        );
        setContacts(
          contacts.map((c) => (c.id === editingContact.id ? updated : c)),
        );
      } else {
        const newContact = await contactApi.add(profile.id, contactForm);
        setContacts([...contacts, newContact]);
      }
      setContactDialogOpen(false);
    } catch {
      setError("Không thể lưu liên hệ");
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!profile?.id) return;
    try {
      await contactApi.delete(profile.id, contactId);
      setContacts(contacts.filter((c) => c.id !== contactId));
    } catch {
      setError("Không thể xóa liên hệ");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Hồ sơ cá nhân
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: "primary.main",
                fontSize: "2rem",
              }}
            >
              {formData.firstName?.[0]}
              {formData.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <Box>
                  <Typography variant="h5">
                    {formData.firstName} {formData.lastName}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    {formData.position || "Nhân viên"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mã NV: {profile?.employeeCode || user?.id}
                  </Typography>
                  {profile?.hireDate && (
                    <Typography variant="body2" color="text.secondary">
                      Ngày vào làm:{" "}
                      {dayjs(profile.hireDate).format("DD/MM/YYYY")}
                    </Typography>
                  )}
                </Box>
                {!isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<ProfileIcon />} iconPosition="start" label="Thông tin" />
          <Tab icon={<DocumentIcon />} iconPosition="start" label="Tài liệu" />
          <Tab
            icon={<ContactIcon />}
            iconPosition="start"
            label="Liên hệ khẩn cấp"
          />
        </Tabs>
      </Box>

      {/* Tab 0: Profile Info */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ProfileIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Thông tin cá nhân</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Họ *"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tên *"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Số điện thoại"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Chức vụ"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phòng ban"
                        value={formData.department}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nhóm"
                        value={formData.team}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={submitting}
                        >
                          {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setIsEditing(false);
                            fetchProfile();
                          }}
                        >
                          Hủy
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={2}>
                    {[
                      { label: "Họ", value: formData.firstName },
                      { label: "Tên", value: formData.lastName },
                      { label: "Email", value: formData.email },
                      { label: "Số điện thoại", value: formData.phone || "—" },
                      { label: "Chức vụ", value: formData.position || "—" },
                      { label: "Phòng ban", value: formData.department || "—" },
                      { label: "Nhóm", value: formData.team || "—" },
                    ].map((f) => (
                      <Grid item xs={12} sm={6} key={f.label}>
                        <Typography variant="body2" color="text.secondary">
                          {f.label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {f.value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <SecurityIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Bảo mật</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <NotificationsIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Thông báo</Typography>
                  </Box>
                  {savingNotifications && <CircularProgress size={20} />}
                  {notificationSuccess && (
                    <Typography variant="caption" color="success.main">
                      Đã lưu!
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {[
                    { key: "emailNotifications", label: "Email" },
                    { key: "smsNotifications", label: "SMS" },
                    { key: "pushNotifications", label: "Push" },
                  ].map((n) => (
                    <FormControlLabel
                      key={n.key}
                      control={
                        <Switch
                          checked={
                            notificationSettings[
                              n.key as keyof typeof notificationSettings
                            ]
                          }
                          onChange={() =>
                            handleNotificationSettingsChange(n.key)
                          }
                          disabled={savingNotifications}
                        />
                      }
                      label={n.label}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Documents */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Tài liệu</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setDocDialogOpen(true)}
              >
                Thêm tài liệu
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell>Loại tài liệu</TableCell>
                    <TableCell>Tên tài liệu</TableCell>
                    <TableCell>Đường dẫn</TableCell>
                    <TableCell>Ngày tải</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ color: "text.secondary" }}
                      >
                        Chưa có tài liệu nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.documentType}</TableCell>
                        <TableCell>{d.documentName}</TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.filePath}
                        </TableCell>
                        <TableCell>
                          {d.uploadedAt
                            ? dayjs(d.uploadedAt).format("DD/MM/YYYY")
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDoc(d.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Emergency Contacts */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Liên hệ khẩn cấp</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={openAddContact}
              >
                Thêm liên hệ
              </Button>
            </Box>
            <Grid container spacing={2}>
              {contacts.length === 0 ? (
                <Grid item xs={12}>
                  <Typography color="text.secondary" textAlign="center">
                    Chưa có liên hệ khẩn cấp nào
                  </Typography>
                </Grid>
              ) : (
                contacts.map((c) => (
                  <Grid item xs={12} sm={6} md={4} key={c.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {c.contactName}
                            </Typography>
                            {c.isPrimary && (
                              <Chip
                                label="Chính"
                                size="small"
                                color="primary"
                                sx={{ mb: 0.5 }}
                              />
                            )}
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => openEditContact(c)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteContact(c.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Quan hệ: {c.relationship}
                        </Typography>
                        <Typography variant="body2">SĐT: {c.phone}</Typography>
                        {c.email && (
                          <Typography variant="body2">
                            Email: {c.email}
                          </Typography>
                        )}
                        {c.address && (
                          <Typography variant="body2">
                            Địa chỉ: {c.address}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              { label: "Mật khẩu hiện tại *", key: "currentPassword" },
              { label: "Mật khẩu mới *", key: "newPassword" },
              { label: "Xác nhận mật khẩu mới *", key: "confirmPassword" },
            ].map((f) => (
              <Grid item xs={12} key={f.key}>
                <TextField
                  fullWidth
                  label={f.label}
                  type="password"
                  value={passwordData[f.key as keyof typeof passwordData]}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      [f.key]: e.target.value,
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={submitting}
          >
            {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thêm tài liệu</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          <TextField
            label="Loại tài liệu *"
            fullWidth
            value={docForm.documentType}
            onChange={(e) =>
              setDocForm({ ...docForm, documentType: e.target.value })
            }
          />
          <TextField
            label="Tên tài liệu *"
            fullWidth
            value={docForm.documentName}
            onChange={(e) =>
              setDocForm({ ...docForm, documentName: e.target.value })
            }
          />
          <TextField
            label="Đường dẫn file *"
            fullWidth
            value={docForm.filePath}
            onChange={(e) =>
              setDocForm({ ...docForm, filePath: e.target.value })
            }
          />
          <TextField
            label="Mô tả"
            fullWidth
            multiline
            rows={2}
            value={docForm.description}
            onChange={(e) =>
              setDocForm({ ...docForm, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleAddDoc}
            disabled={
              savingDoc ||
              !docForm.documentType ||
              !docForm.documentName ||
              !docForm.filePath
            }
          >
            {savingDoc ? <CircularProgress size={20} /> : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Contact Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingContact ? "Chỉnh sửa liên hệ" : "Thêm liên hệ khẩn cấp"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          <TextField
            label="Họ tên liên hệ *"
            fullWidth
            value={contactForm.contactName}
            onChange={(e) =>
              setContactForm({ ...contactForm, contactName: e.target.value })
            }
          />
          <TextField
            label="Quan hệ *"
            fullWidth
            value={contactForm.relationship}
            onChange={(e) =>
              setContactForm({ ...contactForm, relationship: e.target.value })
            }
          />
          <TextField
            label="Số điện thoại *"
            fullWidth
            value={contactForm.phone}
            onChange={(e) =>
              setContactForm({ ...contactForm, phone: e.target.value })
            }
          />
          <TextField
            label="Email"
            fullWidth
            value={contactForm.email}
            onChange={(e) =>
              setContactForm({ ...contactForm, email: e.target.value })
            }
          />
          <TextField
            label="Địa chỉ"
            fullWidth
            value={contactForm.address}
            onChange={(e) =>
              setContactForm({ ...contactForm, address: e.target.value })
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={contactForm.isPrimary}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    isPrimary: e.target.checked,
                  })
                }
              />
            }
            label="Đặt làm liên hệ chính"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSaveContact}
            disabled={
              savingContact ||
              !contactForm.contactName ||
              !contactForm.relationship ||
              !contactForm.phone
            }
          >
            {savingContact ? <CircularProgress size={20} /> : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
