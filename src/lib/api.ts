import { getAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getAccessToken();

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Employee API
export const employeeApi = {
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    teamId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.departmentId) query.append("departmentId", params.departmentId);
    if (params?.teamId) query.append("teamId", params.teamId);
    if (params?.status) query.append("status", params.status);
    return fetchApi<any>(`/api/employees?${query.toString()}`);
  },

  getById: (id: string) => fetchApi<any>(`/api/employees/${id}`),

  create: (data: any) =>
    fetchApi<any>("/api/employees", { method: "POST", body: data }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/api/employees/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    fetchApi<any>(`/api/employees/${id}`, { method: "DELETE" }),

  getTeamMembers: (teamId: string) =>
    fetchApi<any>(`/api/employees/team/${teamId}`),

  getDepartments: () => fetchApi<any>("/api/employees/departments"),

  getTeams: (departmentId?: string) => {
    const query = departmentId ? `?departmentId=${departmentId}` : "";
    return fetchApi<any>(`/api/employees/teams${query}`);
  },

  assignRole: (id: string, role: string) =>
    fetchApi<any>(`/api/employees/${id}/assign-role`, {
      method: "POST",
      body: { role },
    }),
};

// Attendance API
export const attendanceApi = {
  checkIn: (data?: { note?: string; latitude?: number; longitude?: number }) =>
    fetchApi<any>("/api/attendance/check-in", {
      method: "POST",
      body: data || {},
    }),

  checkOut: (data?: { note?: string; latitude?: number; longitude?: number }) =>
    fetchApi<any>("/api/attendance/check-out", {
      method: "POST",
      body: data || {},
    }),

  getStatus: (employeeId?: string, date?: string) => {
    const query = new URLSearchParams();
    if (employeeId) query.append("employeeId", employeeId);
    if (date) query.append("date", date);
    return fetchApi<any>(`/api/attendance/status?${query.toString()}`);
  },

  getHistory: (params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append("employeeId", params.employeeId);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/attendance/history?${query.toString()}`);
  },

  getShifts: (departmentId?: string) => {
    const query = departmentId ? `?departmentId=${departmentId}` : "";
    return fetchApi<any>(`/api/attendance/shifts${query}`);
  },
};

// Leave API
export const leaveApi = {
  createRequest: (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
    approverId: string;
    approverType: string;
  }) => fetchApi<any>("/api/leave/request", { method: "POST", body: data }),

  getRequests: (params?: {
    employeeId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append("employeeId", params.employeeId);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/leave/requests?${query.toString()}`);
  },

  getPendingRequests: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/leave/requests/pending?${query.toString()}`);
  },

  getRequestById: (id: string) => fetchApi<any>(`/api/leave/request/${id}`),

  approve: (id: string, note?: string) =>
    fetchApi<any>(`/api/leave/request/${id}/approve`, {
      method: "POST",
      body: { note },
    }),

  reject: (id: string, reason: string) =>
    fetchApi<any>(`/api/leave/request/${id}/reject`, {
      method: "POST",
      body: { reason },
    }),

  approveRequest: (id: string, comment?: string) =>
    fetchApi<any>(`/api/leave/request/${id}/approve`, {
      method: "POST",
      body: { comment },
    }),

  rejectRequest: (id: string, reason: string) =>
    fetchApi<any>(`/api/leave/request/${id}/reject`, {
      method: "POST",
      body: { reason },
    }),

  getPendingApprovals: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/leave/approvals/pending?${query.toString()}`);
  },

  getProcessedApprovals: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/leave/approvals/processed?${query.toString()}`);
  },

  getBalance: (employeeId?: string, year?: number) => {
    const query = new URLSearchParams();
    if (employeeId) query.append("employeeId", employeeId);
    if (year) query.append("year", year.toString());
    return fetchApi<any>(`/api/leave/balance?${query.toString()}`);
  },
};

// Notification API
export const notificationApi = {
  getAll: (params?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.unreadOnly) query.append("unreadOnly", "true");
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/notifications?${query.toString()}`);
  },

  markAsRead: (id: string) =>
    fetchApi<any>(`/api/notifications/${id}/read`, { method: "POST" }),

  markAllAsRead: () =>
    fetchApi<any>("/api/notifications/read-all", { method: "POST" }),
};

// Department API
export const departmentApi = {
  getAll: () => fetchApi<any[]>("/api/employees/departments"),

  getById: (id: string) => fetchApi<any>(`/api/employees/departments/${id}`),

  getTeams: (departmentId: string) =>
    fetchApi<any[]>(`/api/employees/departments/${departmentId}/teams`),

  getAllTeams: () => fetchApi<any[]>("/api/employees/teams"),
};

// Team API
export const teamApi = {
  getAll: (departmentId?: string) => {
    const query = departmentId ? `?departmentId=${departmentId}` : "";
    return fetchApi<any[]>(`/api/employees/teams${query}`);
  },

  getById: (id: string) => fetchApi<any>(`/api/employees/teams/${id}`),

  getMembers: (id: string) => fetchApi<any[]>(`/api/employees/team/${id}`),

  create: (data: any) =>
    fetchApi<any>("/api/employees/teams", { method: "POST", body: data }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/api/employees/teams/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    fetchApi<any>(`/api/employees/teams/${id}`, { method: "DELETE" }),
};

// Overtime API
export const overtimeApi = {
  createRequest: (data: {
    date: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
    reason?: string;
  }) =>
    fetchApi<any>("/api/overtime/request", { method: "POST", body: data }),

  getRequests: (params?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append("employeeId", params.employeeId);
    if (params?.status) query.append("status", params.status);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/overtime/requests?${query.toString()}`);
  },

  getPendingRequests: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    return fetchApi<any>(`/api/overtime/requests/pending?${query.toString()}`);
  },

  getRequestById: (id: string) => fetchApi<any>(`/api/overtime/request/${id}`),

  approve: (id: string, comment?: string) =>
    fetchApi<any>(`/api/overtime/request/${id}/approve`, {
      method: "POST",
      body: { comment },
    }),

  reject: (id: string, reason: string) =>
    fetchApi<any>(`/api/overtime/request/${id}/reject`, {
      method: "POST",
      body: { reason },
    }),
};

// Team Attendance API
export const teamAttendanceApi = {
  getTeamAttendance: (teamId: string, date?: string) => {
    const query = new URLSearchParams();
    if (date) query.append("date", date);
    return fetchApi<any>(`/api/attendance/team/${teamId}?${query.toString()}`);
  },
};
