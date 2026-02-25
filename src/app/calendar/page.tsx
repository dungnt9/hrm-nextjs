"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, dayjsLocalizer, View, Views } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  ButtonGroup,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Stack,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import { attendanceApi, leaveApi, overtimeApi } from "@/lib/api";

const localizer = dayjsLocalizer(dayjs);

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: "attendance" | "leave_approved" | "leave_pending" | "overtime";
  detail: Record<string, string | number | undefined>;
}

interface AttendanceRecord {
  id?: string;
  date?: string;
  checkIn?: string;
  checkInTime?: string;
  checkOut?: string;
  checkOutTime?: string;
  note?: string;
}

interface LeaveRecord {
  id?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  reason?: string;
}

interface OvertimeRecord {
  id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  reason?: string;
  totalMinutes?: number;
}

// ── Colors ───────────────────────────────────────────────────────────────────

const EVENT_COLORS = {
  attendance: "#4caf50",
  leave_approved: "#ff9800",
  leave_pending: "#ffc107",
  overtime: "#9c27b0",
} as const;

const LEGEND_ITEMS = [
  { label: "Attendance", color: EVENT_COLORS.attendance },
  { label: "Leave (Approved)", color: EVENT_COLORS.leave_approved },
  { label: "Leave (Pending)", color: EVENT_COLORS.leave_pending },
  { label: "Overtime", color: EVENT_COLORS.overtime },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Many backends store local time but attach a "Z" (UTC) suffix incorrectly,
 * causing dayjs to add an extra timezone offset. Fix: extract HH:MM directly
 * from the ISO string instead of letting dayjs perform timezone conversion.
 */
function extractHHMM(timeStr: string): string {
  // "2026-02-04T08:55:00Z" → "08:55"
  // "2026-02-04T08:55:00+07:00" → "08:55"
  const m = timeStr.match(/T(\d{2}:\d{2})/);
  if (m) return m[1];
  // "08:55" or "08:55:00"
  if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.substring(0, 5);
  return dayjs(timeStr).format("HH:mm");
}

function parseTime(dateStr: string | undefined, timeStr: string | undefined): Date {
  if (!dateStr) return new Date();
  if (!timeStr) return dayjs(dateStr).toDate();
  const hhmm = extractHHMM(timeStr);
  return dayjs(`${dateStr}T${hhmm}`).toDate();
}

function formatTime(dateStr: string | undefined, timeStr: string | undefined): string {
  if (!timeStr) return "--:--";
  return extractHHMM(timeStr);
}

// ── View label map ────────────────────────────────────────────────────────────

const VIEW_LABELS: Record<View, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
  work_week: "Work Week",
};

// ── Detail dialog ─────────────────────────────────────────────────────────────

function EventDetailDialog({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;

  const typeLabel: Record<CalendarEvent["type"], string> = {
    attendance: "Attendance",
    leave_approved: "Leave",
    leave_pending: "Leave (Pending)",
    overtime: "Overtime",
  };

  const rows = Object.entries(event.detail).filter(([, v]) => v !== undefined);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderLeft: `4px solid ${event.color}`, pl: 2 }}>
        {event.title}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>
              Type
            </Typography>
            <Chip
              label={typeLabel[event.type]}
              size="small"
              sx={{ bgcolor: event.color, color: "#fff" }}
            />
          </Box>
          {rows.map(([key, value]) => (
            <Box key={key} sx={{ display: "flex", gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>
                {key}
              </Typography>
              <Typography variant="body2">{String(value)}</Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(isMobile ? Views.AGENDA : Views.MONTH);

  useEffect(() => {
    setView(isMobile ? Views.AGENDA : Views.MONTH);
  }, [isMobile]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const startDate = dayjs(currentDate).startOf("month").subtract(7, "day").format("YYYY-MM-DD");
    const endDate = dayjs(currentDate).endOf("month").add(7, "day").format("YYYY-MM-DD");

    try {
      const [attendanceRes, leaveRes, overtimeRes] = await Promise.allSettled([
        attendanceApi.getHistory({ startDate, endDate, pageSize: 100 }),
        leaveApi.getRequests({ pageSize: 100 }),
        overtimeApi.getRequests({ pageSize: 100 }),
      ]);

      const mapped: CalendarEvent[] = [];

      // Attendance events
      if (attendanceRes.status === "fulfilled") {
        const records: AttendanceRecord[] = Array.isArray(attendanceRes.value)
          ? attendanceRes.value
          : attendanceRes.value?.data ?? attendanceRes.value?.items ?? [];

        records.forEach((rec) => {
          const date = rec.date;
          if (!date) return;
          const checkIn = rec.checkIn ?? rec.checkInTime;
          const checkOut = rec.checkOut ?? rec.checkOutTime;
          const inLabel = checkIn ? formatTime(date, checkIn) : "--:--";
          const outLabel = checkOut ? formatTime(date, checkOut) : "--:--";

          mapped.push({
            id: `att-${rec.id ?? date}`,
            title: `Check-in ${inLabel} → ${outLabel}`,
            start: parseTime(date, checkIn ?? "08:00"),
            end: parseTime(date, checkOut ?? "17:00"),
            color: EVENT_COLORS.attendance,
            type: "attendance",
            detail: {
              Date: dayjs(date).format("DD/MM/YYYY"),
              "Check-in": inLabel,
              "Check-out": outLabel,
              ...(rec.note ? { Note: rec.note } : {}),
            },
          });
        });
      }

      // Leave events
      if (leaveRes.status === "fulfilled") {
        const records: LeaveRecord[] = Array.isArray(leaveRes.value)
          ? leaveRes.value
          : leaveRes.value?.data ?? leaveRes.value?.items ?? [];

        records.forEach((rec) => {
          if (!rec.startDate) return;
          const isApproved = rec.status?.toLowerCase() === "approved";
          const isPending =
            rec.status?.toLowerCase() === "pending" ||
            rec.status?.toLowerCase() === "pendingapproval";
          if (!isApproved && !isPending) return;

          const type: CalendarEvent["type"] = isApproved ? "leave_approved" : "leave_pending";
          const prefix = isPending ? "Pending" : "Leave";

          mapped.push({
            id: `leave-${rec.id}`,
            title: `${prefix}: ${rec.leaveType ?? ""}`,
            start: dayjs(rec.startDate).toDate(),
            end: dayjs(rec.endDate ?? rec.startDate).add(1, "day").toDate(),
            color: EVENT_COLORS[type],
            type,
            detail: {
              "Leave Type": rec.leaveType ?? "",
              From: dayjs(rec.startDate).format("DD/MM/YYYY"),
              To: dayjs(rec.endDate ?? rec.startDate).format("DD/MM/YYYY"),
              Status: isApproved ? "Approved" : "Pending",
              ...(rec.reason ? { Reason: rec.reason } : {}),
            },
          });
        });
      }

      // Overtime events
      if (overtimeRes.status === "fulfilled") {
        const records: OvertimeRecord[] = Array.isArray(overtimeRes.value)
          ? overtimeRes.value
          : overtimeRes.value?.data ?? overtimeRes.value?.items ?? [];

        records.forEach((rec) => {
          if (!rec.date) return;
          const isApproved = rec.status?.toLowerCase() === "approved";
          if (!isApproved) return;

          const startLabel = rec.startTime ? formatTime(rec.date, rec.startTime) : "--:--";
          const endLabel = rec.endTime ? formatTime(rec.date, rec.endTime) : "--:--";

          mapped.push({
            id: `ot-${rec.id}`,
            title: `OT: ${startLabel}-${endLabel}`,
            start: parseTime(rec.date, rec.startTime ?? "18:00"),
            end: parseTime(rec.date, rec.endTime ?? "21:00"),
            color: EVENT_COLORS.overtime,
            type: "overtime",
            detail: {
              Date: dayjs(rec.date).format("DD/MM/YYYY"),
              "Start Time": startLabel,
              "End Time": endLabel,
              ...(rec.totalMinutes
                ? { "Total Hours": `${Math.floor(rec.totalMinutes / 60)}h ${rec.totalMinutes % 60}m` }
                : {}),
              ...(rec.reason ? { Reason: rec.reason } : {}),
            },
          });
        });
      }

      setEvents(mapped);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Custom toolbar ──────────────────────────────────────────────────────────

  const goToToday = () => setCurrentDate(new Date());
  const goToPrev = () => {
    setCurrentDate((d) =>
      dayjs(d)
        .subtract(1, view === "month" ? "month" : view === "week" || view === "work_week" ? "week" : "day")
        .toDate()
    );
  };
  const goToNext = () => {
    setCurrentDate((d) =>
      dayjs(d)
        .add(1, view === "month" ? "month" : view === "week" || view === "work_week" ? "week" : "day")
        .toDate()
    );
  };

  const titleLabel = () => {
    if (view === "month") return dayjs(currentDate).format("MMMM YYYY");
    if (view === "week" || view === "work_week") {
      const start = dayjs(currentDate).startOf("week");
      const end = dayjs(currentDate).endOf("week");
      return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
    }
    return dayjs(currentDate).format("dddd, MMM D, YYYY");
  };

  const availableViews: View[] = ["month", "week", "day", "agenda"];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Attendance & Leave Calendar
      </Typography>

      {/* Legend */}
      <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
        {LEGEND_ITEMS.map((item) => (
          <Chip
            key={item.label}
            label={item.label}
            size="small"
            sx={{ bgcolor: item.color, color: "#fff", fontWeight: 500 }}
          />
        ))}
      </Stack>

      {/* Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          p: 1.5,
          mb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Previous">
            <IconButton size="small" onClick={goToPrev}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Today">
            <IconButton size="small" onClick={goToToday}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next">
            <IconButton size="small" onClick={goToNext}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{ flexGrow: 1, textAlign: "center", textTransform: "capitalize" }}
        >
          {titleLabel()}
        </Typography>

        <ButtonGroup size="small" variant="outlined">
          {availableViews.map((v) => (
            <Button
              key={v}
              variant={view === v ? "contained" : "outlined"}
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v]}
            </Button>
          ))}
        </ButtonGroup>
      </Paper>

      {/* Calendar */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1, sm: 2 },
          "& .rbc-calendar": { fontFamily: theme.typography.fontFamily },
          "& .rbc-header": {
            bgcolor: "background.paper",
            borderColor: "divider",
            color: "text.primary",
            py: 1,
          },
          "& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view": {
            borderColor: "divider",
          },
          "& .rbc-off-range-bg": { bgcolor: "action.hover" },
          "& .rbc-today": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(25, 118, 210, 0.15)"
                : "rgba(25, 118, 210, 0.08)",
          },
          "& .rbc-event": { border: "none", borderRadius: "4px" },
          "& .rbc-toolbar": { display: "none" },
          "& .rbc-day-bg + .rbc-day-bg": { borderColor: "divider" },
          "& .rbc-month-row + .rbc-month-row": { borderColor: "divider" },
          "& .rbc-agenda-table": { color: "text.primary" },
          "& .rbc-agenda-date-cell, & .rbc-agenda-time-cell": {
            color: "text.secondary",
            whiteSpace: "nowrap",
          },
        }}
      >
        {loading ? (
          <Stack spacing={1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={48} />
            ))}
          </Stack>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={setCurrentDate}
            view={view}
            onView={setView}
            style={{ height: isMobile ? 500 : 680 }}
            eventPropGetter={(event: CalendarEvent) => ({
              style: { backgroundColor: event.color, border: "none" },
            })}
            onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
          />
        )}
      </Paper>

      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </Box>
  );
}
