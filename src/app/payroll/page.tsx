"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Grid,
  LinearProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoIcon from "@mui/icons-material/Info";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { employeeApi, attendanceApi, leaveApi, overtimeApi } from "@/lib/api";

// Salary calculation constants
const STANDARD_DAYS = 22;
const BHXH_RATE = 0.08;
const BHYT_RATE = 0.015;
const BHTN_RATE = 0.01;
const PERSONAL_DEDUCTION = 11_000_000;
const INCOME_TAX_RATE = 0.1;

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

interface PayslipData {
  employee: any;
  month: number;
  year: number;
  baseSalary: number;
  workedDays: number;
  overtimeHours: number;
  unpaidLeaveDays: number;
  grossPay: number;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  totalInsurance: number;
  taxableIncome: number;
  incomeTax: number;
  netPay: number;
}

export default function PayrollPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const roles: string[] = (auth as any)?.roles ?? [];
  const isHROrAdmin = roles.some((r) =>
    ["system_admin", "hr_staff"].includes(r)
  );

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meEmployee, setMeEmployee] = useState<any | null>(null);

  useEffect(() => {
    employeeApi.getMe().then(setMeEmployee).catch(() => {});
    if (isHROrAdmin) {
      employeeApi.getAll({ pageSize: 200 }).then((res: any) => {
        setEmployees(res.data ?? []);
      }).catch(() => {});
    }
  }, [isHROrAdmin]);

  const calculatePayslip = async () => {
    const emp = isHROrAdmin ? selectedEmployee : meEmployee;
    if (!emp) {
      setError("Vui lòng chọn nhân viên");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseSalary = emp.baseSalary ?? 10_000_000;
      const dailyRate = baseSalary / STANDARD_DAYS;
      const hourlyRate = dailyRate / 8;

      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${endDay}`;

      // Fetch attendance for the month
      const attHistory = await attendanceApi.getHistory({
        employeeId: isHROrAdmin ? emp.id : undefined,
        startDate,
        endDate,
        pageSize: 100,
      }).catch(() => ({ data: [] }));

      const attRecords: any[] = (attHistory as any).data ?? [];

      // If no attendance records exist for the month, show error instead of calculating
      if (attRecords.length === 0) {
        setError(`Chưa có dữ liệu chấm công cho tháng ${MONTHS[selectedMonth - 1]} ${selectedYear}`);
        setPayslip(null);
        setLoading(false);
        return;
      }

      const workedDays = attRecords.filter((r: any) =>
        r.status === "PRESENT" || r.checkInTime
      ).length;

      // Fetch overtime (approved) for the month
      const otRes = await overtimeApi.getRequests({
        employeeId: isHROrAdmin ? emp.id : undefined,
        status: "approved",
        startDate,
        endDate,
        pageSize: 100,
      }).catch(() => ({ data: [] }));

      const otRecords: any[] = (otRes as any).data ?? [];
      const totalOTMinutes = otRecords.reduce(
        (sum: number, r: any) => sum + (r.totalMinutes ?? 0),
        0
      );
      const overtimeHours = totalOTMinutes / 60;

      // Fetch leave (unpaid, approved) for the month
      const leaveRes = await leaveApi.getRequests({
        employeeId: isHROrAdmin ? emp.id : undefined,
        status: "approved",
        pageSize: 100,
      }).catch(() => ({ data: [] }));

      const leaveRecords: any[] = (leaveRes as any).data ?? [];
      const unpaidLeaveDays = leaveRecords
        .filter((r: any) => {
          if (r.leaveType?.toLowerCase() !== "unpaid") return false;
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          return start.getMonth() + 1 === selectedMonth && start.getFullYear() === selectedYear;
        })
        .reduce((sum: number, r: any) => {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + diff;
        }, 0);

      // Gross pay calculation
      // Base salary is paid regardless of attendance (assuming full month)
      // OT adds to salary, unpaid leave deducts from salary
      const otPay = overtimeHours * hourlyRate * 1.5;
      const leaveDed = unpaidLeaveDays * dailyRate;
      const grossPay = baseSalary + otPay - leaveDed;

      // Insurance (on baseSalary)
      const bhxh = baseSalary * BHXH_RATE;
      const bhyt = baseSalary * BHYT_RATE;
      const bhtn = baseSalary * BHTN_RATE;
      const totalInsurance = bhxh + bhyt + bhtn;

      // Income tax
      const taxableIncome = grossPay - totalInsurance - PERSONAL_DEDUCTION;
      const incomeTax = taxableIncome > 0 ? taxableIncome * INCOME_TAX_RATE : 0;

      const netPay = grossPay - totalInsurance - incomeTax;

      setPayslip({
        employee: emp,
        month: selectedMonth,
        year: selectedYear,
        baseSalary,
        workedDays,
        overtimeHours,
        unpaidLeaveDays,
        grossPay,
        bhxh,
        bhyt,
        bhtn,
        totalInsurance,
        taxableIncome: Math.max(taxableIncome, 0),
        incomeTax,
        netPay,
      });
    } catch (err: any) {
      setError("Có lỗi xảy ra khi tính lương. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const years = [now.getFullYear() - 1, now.getFullYear()];

  const totalDeductions = payslip ? payslip.totalInsurance + payslip.incomeTax : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptLongIcon fontSize="large" color="primary" />
          Phiếu Lương
        </Typography>
      </Box>

      {/* Filter controls */}
      <Card sx={{ mb: 3, "@media print": { display: "none" } }} elevation={2}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Tháng</InputLabel>
              <Select
                value={selectedMonth}
                label="Tháng"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Năm</InputLabel>
              <Select
                value={selectedYear}
                label="Năm"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {isHROrAdmin && (
              <Autocomplete
                size="small"
                options={employees}
                getOptionLabel={(o: any) => `${o.firstName} ${o.lastName} (${o.email})`}
                value={selectedEmployee}
                onChange={(_, v) => setSelectedEmployee(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Nhân viên" sx={{ minWidth: 280 }} />
                )}
              />
            )}

            <Button
              variant="contained"
              onClick={calculatePayslip}
              disabled={loading || (isHROrAdmin && !selectedEmployee)}
            >
              {loading ? <CircularProgress size={20} /> : "Xem phiếu lương"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="warning" sx={{ mb: 2 }} icon={<InfoIcon />}>{error}</Alert>}

      {payslip && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3, "@media print": { display: "none" } }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Lương Thực Nhận
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatVND(payslip.netPay)}
                      </Typography>
                    </Box>
                    <AccountBalanceWalletIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Thu Nhập Gộp
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatVND(payslip.grossPay)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Tổng Khấu Trừ
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatVND(totalDeductions)}
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Ngày Công
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {payslip.workedDays}/{STANDARD_DAYS}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(payslip.workedDays / STANDARD_DAYS) * 100} 
                        sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.3)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }}
                      />
                    </Box>
                    <CalendarTodayIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Employee Info Card */}
          <Card sx={{ mb: 3 }} elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    PHIẾU LƯƠNG - {MONTHS[payslip.month - 1]} {payslip.year}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Được tạo ngày {new Date().toLocaleDateString("vi-VN")}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  size="small"
                  sx={{ "@media print": { display: "none" } }}
                >
                  In phiếu
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Họ tên</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {payslip.employee.firstName} {payslip.employee.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight="medium">{payslip.employee.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Chức vụ</Typography>
                  <Typography variant="body1" fontWeight="medium">{payslip.employee.position ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Phòng ban</Typography>
                  <Typography variant="body1" fontWeight="medium">{payslip.employee.departmentName ?? "—"}</Typography>
                </Grid>
                {payslip.employee.employeeCode && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="text.secondary">Mã nhân viên</Typography>
                    <Typography variant="body1" fontWeight="medium">{payslip.employee.employeeCode}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Số ngày làm việc</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {payslip.workedDays}/{STANDARD_DAYS} ngày ({((payslip.workedDays / STANDARD_DAYS) * 100).toFixed(0)}%)
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Income and Deduction Breakdown */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Income Section */}
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      Chi Tiết Thu Nhập
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {/* Base Salary */}
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <MonetizationOnIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">Lương cơ bản</Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {formatVND(payslip.baseSalary)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
                        {STANDARD_DAYS} ngày chuẩn
                      </Typography>
                    </Box>

                    {/* Overtime */}
                    {payslip.overtimeHours > 0 && (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <AccessTimeIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">Phụ cấp tăng ca</Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            +{formatVND((payslip.baseSalary / STANDARD_DAYS / 8) * payslip.overtimeHours * 1.5)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
                          {payslip.overtimeHours.toFixed(1)} giờ × hệ số 1.5
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((payslip.overtimeHours / 40) * 100, 100)} 
                          sx={{ mt: 0.5, ml: 4, bgcolor: "success.light", "& .MuiLinearProgress-bar": { bgcolor: "success.main" } }}
                        />
                      </Box>
                    )}

                    {/* Unpaid Leave Deduction */}
                    {payslip.unpaidLeaveDays > 0 && (
                      <Box sx={{ p: 1.5, bgcolor: "error.50", borderRadius: 1, border: "1px solid", borderColor: "error.light" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EventBusyIcon fontSize="small" color="error" />
                            <Typography variant="body2" fontWeight="medium" color="error.main">Khấu trừ nghỉ không lương</Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="bold" color="error.main">
                            -{formatVND((payslip.baseSalary / STANDARD_DAYS) * payslip.unpaidLeaveDays)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
                          {payslip.unpaidLeaveDays} ngày
                        </Typography>
                      </Box>
                    )}

                    <Divider />

                    {/* Total Gross Pay */}
                    <Box sx={{ p: 1.5, bgcolor: "success.50", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body1" fontWeight="bold">Tổng thu nhập gộp</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.dark">
                          {formatVND(payslip.grossPay)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Deduction Section */}
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TrendingDownIcon color="error" />
                    <Typography variant="h6" fontWeight="bold" color="error.main">
                      Chi Tiết Khấu Trừ
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {/* BHXH */}
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <HealthAndSafetyIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">BHXH (8%)</Typography>
                          <Tooltip title="Bảo hiểm xã hội: 8% lương cơ bản">
                            <InfoIcon fontSize="small" sx={{ color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          -{formatVND(payslip.bhxh)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={8} 
                        sx={{ ml: 4, bgcolor: "error.light", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }}
                      />
                    </Box>

                    {/* BHYT */}
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <HealthAndSafetyIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">BHYT (1.5%)</Typography>
                          <Tooltip title="Bảo hiểm y tế: 1.5% lương cơ bản">
                            <InfoIcon fontSize="small" sx={{ color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          -{formatVND(payslip.bhyt)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={1.5} 
                        sx={{ ml: 4, bgcolor: "error.light", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }}
                      />
                    </Box>

                    {/* BHTN */}
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <HealthAndSafetyIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">BHTN (1%)</Typography>
                          <Tooltip title="Bảo hiểm thất nghiệp: 1% lương cơ bản">
                            <InfoIcon fontSize="small" sx={{ color: "text.secondary", cursor: "help" }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          -{formatVND(payslip.bhtn)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={1} 
                        sx={{ ml: 4, bgcolor: "error.light", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }}
                      />
                    </Box>

                    {/* Income Tax */}
                    {payslip.incomeTax > 0 && (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <AccountBalanceIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">Thuế TNCN (10%)</Typography>
                            <Tooltip title={`Thu nhập chịu thuế: ${formatVND(payslip.taxableIncome)}`}>
                              <InfoIcon fontSize="small" sx={{ color: "text.secondary", cursor: "help" }} />
                            </Tooltip>
                          </Box>
                          <Typography variant="body1" fontWeight="bold" color="error.main">
                            -{formatVND(payslip.incomeTax)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
                          10% × (Thu nhập gộp - Bảo hiểm - Giảm trừ {formatVND(PERSONAL_DEDUCTION)})
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={10} 
                          sx={{ mt: 0.5, ml: 4, bgcolor: "error.light", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }}
                        />
                      </Box>
                    )}

                    <Divider />

                    {/* Total Deductions */}
                    <Box sx={{ p: 1.5, bgcolor: "error.50", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body1" fontWeight="bold">Tổng khấu trừ</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.dark">
                          -{formatVND(totalDeductions)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Final Net Pay Card */}
          <Card 
            elevation={4} 
            sx={{ 
              mb: 3, 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
              color: "white" 
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    LƯƠNG THỰC NHẬN
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Số tiền nhận được sau khấu trừ bảo hiểm và thuế
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
                  <Typography variant="h3" fontWeight="bold">
                    {formatVND(payslip.netPay)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Detailed Table (Accordion) */}
          <Accordion elevation={2} sx={{ "@media print": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight="medium">Bảng Chi Tiết Đầy Đủ</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.100" }}>
                      <TableCell><strong>Khoản mục</strong></TableCell>
                      <TableCell align="right"><strong>Chi tiết</strong></TableCell>
                      <TableCell align="right"><strong>Số tiền (VNĐ)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Income */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: "success.50", fontWeight: "bold" }}>
                        <strong>THU NHẬP</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Lương cơ bản tháng</TableCell>
                      <TableCell align="right">{STANDARD_DAYS} ngày chuẩn</TableCell>
                      <TableCell align="right">{formatVND(payslip.baseSalary)}</TableCell>
                    </TableRow>
                    {payslip.overtimeHours > 0 && (
                      <TableRow>
                        <TableCell>Phụ cấp tăng ca (x1.5)</TableCell>
                        <TableCell align="right">{payslip.overtimeHours.toFixed(1)} giờ</TableCell>
                        <TableCell align="right">{formatVND((payslip.baseSalary / STANDARD_DAYS / 8) * payslip.overtimeHours * 1.5)}</TableCell>
                      </TableRow>
                    )}
                    {payslip.unpaidLeaveDays > 0 && (
                      <TableRow sx={{ color: "error.main" }}>
                        <TableCell>Khấu trừ nghỉ không lương</TableCell>
                        <TableCell align="right">{payslip.unpaidLeaveDays} ngày</TableCell>
                        <TableCell align="right" sx={{ color: "error.main" }}>
                          -{formatVND((payslip.baseSalary / STANDARD_DAYS) * payslip.unpaidLeaveDays)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell colSpan={2}><strong>Tổng thu nhập gộp</strong></TableCell>
                      <TableCell align="right"><strong>{formatVND(payslip.grossPay)}</strong></TableCell>
                    </TableRow>

                    {/* Deductions */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: "error.50", fontWeight: "bold" }}>
                        <strong>KHẤU TRỪ</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BHXH (8%)</TableCell>
                      <TableCell align="right">8% × lương cơ bản</TableCell>
                      <TableCell align="right">-{formatVND(payslip.bhxh)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BHYT (1.5%)</TableCell>
                      <TableCell align="right">1.5% × lương cơ bản</TableCell>
                      <TableCell align="right">-{formatVND(payslip.bhyt)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BHTN (1%)</TableCell>
                      <TableCell align="right">1% × lương cơ bản</TableCell>
                      <TableCell align="right">-{formatVND(payslip.bhtn)}</TableCell>
                    </TableRow>
                    {payslip.incomeTax > 0 && (
                      <TableRow>
                        <TableCell>Thuế TNCN (10%)</TableCell>
                        <TableCell align="right">10% × ({formatVND(payslip.taxableIncome)})</TableCell>
                        <TableCell align="right">-{formatVND(payslip.incomeTax)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell colSpan={2}><strong>Tổng khấu trừ</strong></TableCell>
                      <TableCell align="right"><strong>-{formatVND(totalDeductions)}</strong></TableCell>
                    </TableRow>

                    {/* Net pay */}
                    <TableRow sx={{ bgcolor: "success.light" }}>
                      <TableCell colSpan={2}>
                        <Typography variant="body1" fontWeight="bold" color="success.dark">
                          LƯƠNG THỰC NHẬN
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="success.dark">
                          {formatVND(payslip.netPay)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          {/* Signature Section (for Print) */}
          <Card sx={{ mt: 3, display: "none", "@media print": { display: "block" } }} elevation={0}>
            <CardContent>
              <Grid container spacing={4} sx={{ mt: 3 }}>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Người nhận lương</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 8 }}>
                    (Ký, ghi rõ họ tên)
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Phòng Nhân sự</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 8 }}>
                    (Ký, ghi rõ họ tên)
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .MuiCard-root, .MuiCard-root * { visibility: visible; }
          .MuiCard-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </Box>
  );
}
