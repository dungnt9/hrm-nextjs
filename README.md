# Frontend (Next.js)

This is the web frontend for the HRM system, built with Next.js, TypeScript, MUI, Redux Toolkit, Apollo Client, and SignalR.

## Features

- Modern HRM dashboard
- Employee, attendance, leave, approval, and organization chart pages
- Real-time notifications (SignalR)
- Authentication via Keycloak
- GraphQL for org chart
- Responsive UI (MUI v5)

## Tech Stack

- Next.js 14
- TypeScript
- Material-UI (MUI v5)
- Redux Toolkit
- Apollo Client
- SignalR client
- keycloak-js
- Docker

## Pages

- `/` (Dashboard)
- `/attendance`
- `/leave`
- `/employees`
- `/organization`
- `/approvals`

## Environment Variables

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_KEYCLOAK_URL`
- `NEXT_PUBLIC_KEYCLOAK_REALM`
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`
- `NEXT_PUBLIC_NOTIFICATION_HUB_URL`

## Running Locally

```sh
yarn install
yarn dev
# or
NEXT_PUBLIC_API_URL=http://localhost:5000 yarn dev
```

## Docker

Build and run via Docker Compose. See root `docker-compose.yml`.

## Notes

- Requires API Gateway and Keycloak to be running
- All config via `.env.local` or Docker Compose

---

© 2025 HRM System
