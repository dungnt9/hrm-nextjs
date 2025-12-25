/**
 * Export utilities for CSV and Excel formats
 */

export interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  format?: "csv" | "xlsx";
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (options: ExportOptions) => {
  const { filename, headers, rows } = options;

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? "");
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (
            cellStr.includes(",") ||
            cellStr.includes("\n") ||
            cellStr.includes('"')
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Export data to Excel-compatible format (using CSV with BOM for better Excel compatibility)
 */
export const exportToExcel = (options: ExportOptions) => {
  const { filename, headers, rows } = options;

  // Create CSV content with BOM for Excel
  const csvContent = [
    headers.join("\t"),
    ...rows.map((row) => row.map((cell) => String(cell ?? "")).join("\t")),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Convert array of objects to export format
 */
export const prepareDataForExport = <T extends Record<string, any>>(
  data: T[],
  columnMapping: Record<string, string>
): { headers: string[]; rows: (string | number)[][] } => {
  const headers = Object.values(columnMapping);
  const keys = Object.keys(columnMapping);

  const rows = data.map((item) =>
    keys.map((key) => {
      const value = item[key];
      // Format date values
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // Format boolean values
      if (typeof value === "boolean") {
        return value ? "Yes" : "No";
      }
      // Format null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      return String(value);
    })
  );

  return { headers, rows };
};

/**
 * Export employees table to CSV
 */
export const exportEmployeesToCSV = (employees: any[]) => {
  const columnMapping = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    employeeCode: "Employee Code",
    position: "Position",
    departmentName: "Department",
    teamName: "Team",
    joinDate: "Join Date",
    status: "Status",
  };

  const { headers, rows } = prepareDataForExport(employees, columnMapping);
  exportToCSV({
    filename: `employees-${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
};

/**
 * Export attendance history to CSV
 */
export const exportAttendanceToCSV = (
  attendance: any[],
  employeeName?: string
) => {
  const columnMapping = {
    date: "Date",
    checkInTime: "Check In Time",
    checkInStatus: "Check In Status",
    checkOutTime: "Check Out Time",
    checkOutStatus: "Check Out Status",
    totalHours: "Total Hours",
    note: "Notes",
  };

  const { headers, rows } = prepareDataForExport(attendance, columnMapping);
  const filename = employeeName
    ? `attendance-${employeeName}-${new Date().toISOString().split("T")[0]}`
    : `attendance-${new Date().toISOString().split("T")[0]}`;

  exportToCSV({ filename, headers, rows });
};

/**
 * Export leave requests to CSV
 */
export const exportLeaveRequestsToCSV = (leaveRequests: any[]) => {
  const columnMapping = {
    leaveType: "Leave Type",
    startDate: "Start Date",
    endDate: "End Date",
    totalDays: "Total Days",
    reason: "Reason",
    approverName: "Approver",
    status: "Status",
    createdAt: "Submitted On",
  };

  const { headers, rows } = prepareDataForExport(
    leaveRequests,
    columnMapping
  );
  exportToCSV({
    filename: `leave-requests-${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
};

/**
 * Export team data to CSV
 */
export const exportTeamsToCSV = (teams: any[]) => {
  const columnMapping = {
    name: "Team Name",
    departmentName: "Department",
    managerName: "Manager",
    memberCount: "Members",
    description: "Description",
  };

  const { headers, rows } = prepareDataForExport(teams, columnMapping);
  exportToCSV({
    filename: `teams-${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
};
