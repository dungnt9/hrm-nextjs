"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { announcementApi, departmentApi } from "@/lib/api";

const CATEGORIES = ["General", "Policy", "Event", "Emergency"];
const CATEGORY_LABELS: Record<string, string> = {
  General: "Chung",
  Policy: "Chính sách",
  Event: "Sự kiện",
  Emergency: "Khẩn cấp",
};
const CATEGORY_COLORS: Record<string, "default" | "primary" | "success" | "error"> = {
  General: "default",
  Policy: "primary",
  Event: "success",
  Emergency: "error",
};

const emptyForm = {
  title: "",
  content: "",
  category: "General",
  isPinned: false,
  expiresAt: "",
  departmentId: "",
};

export default function AnnouncementsPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const roles: string[] = (auth as any)?.roles ?? [];
  const isHR = roles.some((r) => ["system_admin", "hr_staff"].includes(r));

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [includeExpired, setIncludeExpired] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementApi.getAll({
        category: filterCategory || undefined,
        includeExpired,
        pageSize: 100,
      });
      setAnnouncements((res as any).data ?? []);
    } catch {
      setError("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filterCategory, includeExpired]);

  useEffect(() => {
    departmentApi.getAll().then(setDepartments).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      isPinned: a.isPinned,
      expiresAt: a.expiresAt ? a.expiresAt.split("T")[0] : "",
      departmentId: a.departmentId ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || undefined,
        departmentId: form.departmentId || undefined,
      };
      if (editing) {
        await announcementApi.update(editing.id, payload);
      } else {
        await announcementApi.create(payload);
      }
      setDialogOpen(false);
      fetchAnnouncements();
    } catch {
      setError("Không thể lưu thông báo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await announcementApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch {
      setError("Không thể xóa thông báo");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Bảng Thông Báo</Typography>
        {isHR && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Tạo thông báo
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", py: "12px !important" }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Danh mục</InputLabel>
            <Select value={filterCategory} label="Danh mục" onChange={(e) => setFilterCategory(e.target.value)}>
              <MenuItem value="">Tất cả</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={includeExpired} onChange={(e) => setIncludeExpired(e.target.checked)} />}
            label="Bao gồm đã hết hạn"
          />
        </CardContent>
      </Card>

      {/* Announcement list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">Chưa có thông báo nào</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {announcements.map((a) => (
            <Card
              key={a.id}
              elevation={a.isPinned ? 3 : 1}
              sx={{ borderLeft: a.isPinned ? "4px solid" : "none", borderColor: "primary.main" }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                      {a.isPinned && (
                        <Tooltip title="Đã ghim">
                          <PushPinIcon fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                      <Typography variant="h6">{a.title}</Typography>
                      <Chip
                        label={CATEGORY_LABELS[a.category] ?? a.category}
                        color={CATEGORY_COLORS[a.category] ?? "default"}
                        size="small"
                      />
                      {a.departmentName && (
                        <Chip label={a.departmentName} size="small" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {a.createdByName && `Đăng bởi: ${a.createdByName} • `}
                      {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                      {a.expiresAt && ` • Hết hạn: ${new Date(a.expiresAt).toLocaleDateString("vi-VN")}`}
                    </Typography>
                  </Box>
                  {isHR && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(a)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{a.content}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Tiêu đề *"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Nội dung *"
            fullWidth
            multiline
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={form.category}
                label="Danh mục"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                value={form.departmentId}
                label="Phòng ban"
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <MenuItem value="">Tất cả phòng ban</MenuItem>
                {departments.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ngày hết hạn"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
            }
            label="Ghim thông báo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.content.trim()}
          >
            {saving ? <CircularProgress size={20} /> : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa thông báo "{deleteTarget?.title}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
