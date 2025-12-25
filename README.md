# Frontend (Next.js)

This is the web frontend for the HRM system, built with Next.js 14, TypeScript, Material-UI, Redux Toolkit, Apollo Client, and SignalR for real-time communication.

## Features

### Dashboard & Navigation
- **Modern HRM Dashboard** - Welcome page with stats and quick actions
- **Responsive Navigation** - Sidebar with role-based menu items
- **Role-based Access Control** - Different pages/features per user role
- **User Profile Menu** - Settings, profile, logout options

### Employee Management
- **Employee Directory** - Full CRUD operations with search/filter
- **Department & Team Management** - Organize structure
- **Organization Chart** - Hierarchical view (GraphQL-powered)
- **Inline Editing** - Quick updates without page navigation
- **CSV Export** - Bulk data export functionality

### Attendance & Time Tracking
- **Check-in/Check-out** - Quick buttons with location capture
- **Attendance History** - View past records with date range filter
- **Shift Management** - View assigned shifts
- **Team Attendance** - Manager view of team presence (date-based)
- **Summary Stats** - Present/absent/late counts with percentages

### Leave Management
- **Leave Requests** - Create with reason and date range
- **Leave Balance** - View annual/sick/unpaid available days
- **Request Status** - Track approval progress
- **Leave History** - Past requests with outcomes
- **Approval Workflow** - Manager/HR approve/reject with comments

### Overtime Management
- **Overtime Requests** - Submit overtime work hours
- **Overtime Approvals** - Manager/HR review and approve
- **Request History** - Track all overtime submissions
- **Status Tracking** - Pending, Approved, Rejected states

### Approvals Hub
- **Pending Approvals** - Manager/HR view pending requests
- **Approval Statistics** - Count of pending/processed approvals
- **Batch Operations** - Approve/reject multiple requests
- **Approval History** - Audit trail of all decisions

### Real-time Notifications
- **Notification Center** - View all notifications
- **Real-time Updates** - SignalR WebSocket connection
- **Mark as Read** - Individual or bulk actions
- **Notification Filtering** - Unread/Read/All views
- **Notification Types** - Leave, Overtime, Attendance, System, etc.

### Analytics & Reports
- **Daily Attendance Trend** - Bar chart of attendance patterns
- **Leave Distribution** - Pie chart by leave type
- **Department Overview** - Employee count per department
- **Summary Statistics** - KPIs and metrics
- **CSV Report Export** - Download data for analysis

### User Profile & Settings
- **Profile Information** - View personal/department details
- **Notification Settings** - Control notification channels
- **Change Password** - Password management dialog
- **Edit Profile** - Update personal information

## Tech Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - UI library

### UI Components
- **Material-UI (MUI) v5** - Component library with theming
- **MUI Icons** - Icon set
- **MUI Data Grid** - Advanced table component
- **MUI Date Pickers** - Calendar date selection
- **Emotion** - CSS-in-JS styling

### State Management
- **Redux Toolkit** - Global state (auth, notifications, attendance)
- **Redux Thunk** - Async actions

### API & Data
- **Apollo Client 3** - GraphQL client (org chart queries)
- **Fetch API** - REST API calls with custom wrapper
- **TypeScript** - Type-safe API calls

### Real-time Communication
- **SignalR Client 8** - WebSocket for real-time notifications
- **Auto-reconnect** - Exponential backoff strategy
- **JWT Auth** - Secure WebSocket connections

### Authentication
- **Keycloak-js 23** - OAuth 2.0 / OpenID Connect integration
- **JWT Tokens** - Bearer token authentication
- **Custom Auth Service** - Token management and decode

### Utilities
- **dayjs** - Date/time formatting (lightweight alternative to moment)
- **Recharts** - React chart library (bar, pie, line charts)
- **React-organizational-chart** - Tree visualization for org chart

## Pages & Routes

### Public Pages
- `/` - **Login/Home** - JWT token-based login form

### Protected Pages (Require Authentication)

**Employee Pages**
- `/dashboard` - Dashboard with stats and check-in/out
- `/attendance` - Attendance history and team overview
- `/leave` - Leave requests and balance
- `/shifts` - View assigned work shifts
- `/organization` - Organization chart visualization
- `/notifications` - Notification center
- `/profile` - User profile and settings

**Manager/HR Pages**
- `/employees` - Employee management (CRUD, export)
- `/teams` - Team management and member assignment
- `/team-attendance` - Team attendance overview (daily)
- `/approvals` - Pending/processed leave & overtime approvals
- `/reports` - Analytics and reports (charts, exports)

## API Integration

### REST Endpoints (via API Gateway)
- `/api/employees/*` - Employee CRUD
- `/api/attendance/*` - Check-in/out, history, team attendance
- `/api/leaves/*` - Leave requests, approvals, balance
- `/api/overtime/*` - Overtime requests and approvals
- `/api/notifications/*` - Notification operations
- `/api/auth/*` - Authentication

### GraphQL Endpoints
- `/graphql` - Organization chart queries

### Real-time Endpoints
- `/hubs/notification` - SignalR WebSocket connection

## Environment Variables

### Public Variables (accessible in browser)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=hrm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=hrm-frontend
NEXT_PUBLIC_NOTIFICATION_HUB_URL=http://localhost:5000/hubs/notification
```

### Development Setup
Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=hrm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=hrm-frontend
```

## Running Locally

### Prerequisites
- Node.js 18+ and npm/yarn
- API Gateway running on port 5000
- Keycloak running on port 8080

### Development Server
```sh
# Install dependencies
yarn install

# Run development server
yarn dev

# Or with custom API URL
NEXT_PUBLIC_API_URL=http://localhost:5000 yarn dev

# Access at http://localhost:3000
```

### Production Build
```sh
# Build for production
yarn build

# Run production server
yarn start
```

### Linting & Testing
```sh
# Run ESLint
yarn lint

# Run TypeScript check
yarn type-check
```

## Docker

### Docker Build & Run
```sh
# Build image
docker build -t hrm-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000 \
  hrm-frontend
```

### Docker Compose
Built and run via Docker Compose. See root `docker-compose.yml`.

Port mapping:
- Container: 3000 (HTTP)
- Host: 3000 (HTTP)

## Architecture

### Component Structure
```
app/
├── page.tsx                 # Login page
├── layout.tsx              # Root layout with providers
├── globals.css             # Global styles
├── (auth)/                 # Auth-protected routes
│   ├── dashboard/
│   ├── employees/
│   ├── attendance/
│   ├── leave/
│   ├── approvals/
│   ├── teams/
│   ├── team-attendance/
│   ├── shifts/
│   ├── organization/
│   ├── profile/
│   ├── notifications/
│   └── reports/
├── components/
│   ├── layout/
│   │   └── Layout.tsx      # Main layout wrapper
│   └── providers/
│       ├── AuthProvider.tsx        # Auth initialization
│       └── NotificationProvider.tsx # SignalR setup
└── lib/
    ├── api.ts              # REST API client
    ├── apollo.ts           # GraphQL client
    ├── auth.ts             # JWT management
    ├── signalr.ts          # SignalR hub connection
    ├── export.ts           # CSV export utilities
    └── keycloak.ts         # Keycloak integration
store/
├── index.ts                # Redux store setup
└── slices/
    ├── authSlice.ts        # Auth state
    ├── attendanceSlice.ts  # Attendance state
    └── notificationSlice.ts # Notification state
types/
└── react-organizational-chart.d.ts # Type definitions
```

### Data Flow
```
User Action
    ↓
Component Hook (useState/useSelector)
    ↓
API Call (lib/api.ts or signalr.ts)
    ↓
Backend Service
    ↓
Response → Redux Store Update
    ↓
Component Re-render
```

## State Management (Redux)

### Auth Slice
- State: `isAuthenticated`, `isLoading`, `user`, `token`
- Actions: `setAuthenticated`, `setUnauthenticated`, `setLoading`

### Attendance Slice
- State: `status`, `isLoading`
- Status: `isCheckedIn`, `checkInTime`, `checkOutTime`, `currentHours`

### Notification Slice
- State: `notifications[]`, `unreadCount`
- Actions: `addNotification`, `markAsRead`, `markAllAsRead`

## Features in Detail

### 1. Authentication Flow
- Login via Keycloak username/password
- JWT token stored in localStorage
- Auto-refresh every 4 minutes
- Redirect to login on token expiry

### 2. Real-time Notifications
- WebSocket connection via SignalR
- Auto-reconnect with exponential backoff (1s → 3s → 5s)
- Group-based messages per user
- Redux store synchronization

### 3. Role-based UI
```
Employee: dashboard, attendance, leave, shifts, organization, profile, notifications
Manager: + employees, teams, team-attendance, approvals, reports
HR Staff: + employees, teams, team-attendance, approvals, reports
Admin: All pages + system settings
```

### 4. CSV Export
- Dynamic headers and rows
- Formatted dates and numbers
- UTF-8 BOM for Excel compatibility
- Specialized exporters per entity type

### 5. Error Handling
- Global error boundaries
- User-friendly error messages
- Automatic retry logic
- Loading states for all async operations

## Notes

- Requires API Gateway (port 5000) to be running
- Requires Keycloak (port 8080) to be running
- All timestamps displayed in user's local timezone
- CSV exports download with current date in filename
- SignalR auto-reconnects with backoff strategy
- Role-based menu items filtered on client-side
- All API calls include JWT Bearer token
- Dashboard stats auto-refresh on attendance change

## API Response Examples

### Employees List
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "departmentName": "Engineering",
      "teamName": "Backend",
      "position": "Senior Developer"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 10
}
```

### Attendance Status
```json
{
  "isCheckedIn": true,
  "isCheckedOut": false,
  "checkInTime": "2025-01-09T08:15:00Z",
  "checkOutTime": null,
  "currentHours": 2.5
}
```

### Leave Balance
```json
{
  "employeeId": "uuid",
  "year": 2025,
  "annual": {
    "total": 20,
    "used": 3,
    "remaining": 17
  },
  "sick": {
    "total": 10,
    "used": 0,
    "remaining": 10
  }
}
```

## Troubleshooting

### "API connection failed"
- Check API Gateway is running on port 5000
- Check network configuration in `.env.local`
- Verify CORS is enabled

### "WebSocket connection failed"
- Check SignalR hub is accessible
- Verify JWT token is valid
- Check browser WebSocket support

### "Login not working"
- Check Keycloak is running on port 8080
- Verify realm/client configuration
- Check token expiry in localStorage

---

© 2025 HRM System
