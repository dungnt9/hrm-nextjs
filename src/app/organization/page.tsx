"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Paper,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Groups as GroupsIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useQuery, gql } from "@apollo/client";

// Dynamic import to prevent SSR issues with react-organizational-chart
const Tree = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.Tree),
  { ssr: false, loading: () => <CircularProgress /> }
);
const TreeNode = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.TreeNode),
  { ssr: false }
);

// ─── GraphQL query matching the actual backend schema ────────────────────────
const ORG_CHART_QUERY = gql`
  query GetOrgChart {
    getOrgChart(depth: 3) {
      id
      name
      type
      parentId
      children {
        id
        name
        type
        parentId
        children {
          id
          name
          type
          parentId
          children {
            id
            name
            type
            parentId
            employeeData {
              id
              firstName
              lastName
              position
              departmentName
              teamName
            }
          }
          employeeData {
            id
            firstName
            lastName
            position
            departmentName
            teamName
          }
        }
        employeeData {
          id
          firstName
          lastName
          position
          departmentName
          teamName
        }
      }
      employeeData {
        id
        firstName
        lastName
        position
        departmentName
        teamName
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  departmentName?: string;
  teamName?: string;
}

interface OrgChartNode {
  id: string;
  name: string;
  type: string; // company | department | team | employee
  parentId: string;
  children: OrgChartNode[];
  employeeData?: EmployeeData;
}

// ─── Demo data (shown when GraphQL is unavailable) ────────────────────────────
const demoData: OrgChartNode = {
  id: "c1",
  name: "ABC Corporation",
  type: "company",
  parentId: "",
  children: [
    {
      id: "d1",
      name: "Engineering",
      type: "department",
      parentId: "c1",
      children: [
        {
          id: "t1",
          name: "Frontend Team",
          type: "team",
          parentId: "d1",
          children: [
            {
              id: "e1",
              name: "John Doe",
              type: "employee",
              parentId: "t1",
              children: [],
              employeeData: {
                id: "e1",
                firstName: "John",
                lastName: "Doe",
                position: "Team Lead",
              },
            },
            {
              id: "e2",
              name: "Jane Smith",
              type: "employee",
              parentId: "t1",
              children: [],
              employeeData: {
                id: "e2",
                firstName: "Jane",
                lastName: "Smith",
                position: "Senior Developer",
              },
            },
          ],
        },
        {
          id: "t2",
          name: "Backend Team",
          type: "team",
          parentId: "d1",
          children: [
            {
              id: "e3",
              name: "Alice Johnson",
              type: "employee",
              parentId: "t2",
              children: [],
              employeeData: {
                id: "e3",
                firstName: "Alice",
                lastName: "Johnson",
                position: "Team Lead",
              },
            },
          ],
        },
      ],
      employeeData: undefined,
    },
    {
      id: "d2",
      name: "Human Resources",
      type: "department",
      parentId: "c1",
      children: [
        {
          id: "t3",
          name: "Recruitment",
          type: "team",
          parentId: "d2",
          children: [
            {
              id: "e4",
              name: "Eva Green",
              type: "employee",
              parentId: "t3",
              children: [],
              employeeData: {
                id: "e4",
                firstName: "Eva",
                lastName: "Green",
                position: "Recruiter",
              },
            },
          ],
        },
      ],
      employeeData: undefined,
    },
    {
      id: "d3",
      name: "Finance",
      type: "department",
      parentId: "c1",
      children: [
        {
          id: "t4",
          name: "Accounting",
          type: "team",
          parentId: "d3",
          children: [
            {
              id: "e5",
              name: "Grace Lee",
              type: "employee",
              parentId: "t4",
              children: [],
              employeeData: {
                id: "e5",
                firstName: "Grace",
                lastName: "Lee",
                position: "Accountant",
              },
            },
          ],
        },
      ],
      employeeData: undefined,
    },
  ],
};

// ─── Node card component ──────────────────────────────────────────────────────
const nodeConfig = {
  company: {
    color: "primary" as const,
    bgColor: "#1976d2",
    minWidth: 200,
    py: 2,
    px: 3,
    avatarSize: 44,
    titleVariant: "subtitle1" as const,
  },
  department: {
    color: "secondary" as const,
    bgColor: "#dc004e",
    minWidth: 160,
    py: 1.5,
    px: 2,
    avatarSize: 36,
    titleVariant: "body1" as const,
  },
  team: {
    color: "info" as const,
    bgColor: "#0288d1",
    minWidth: 140,
    py: 1.5,
    px: 2,
    avatarSize: 32,
    titleVariant: "body2" as const,
  },
  employee: {
    color: "success" as const,
    bgColor: "#388e3c",
    minWidth: 130,
    py: 1,
    px: 1.5,
    avatarSize: 28,
    titleVariant: "body2" as const,
  },
};

function OrgNodeCard({ node }: { node: OrgChartNode }) {
  const cfg = nodeConfig[node.type as keyof typeof nodeConfig] ?? nodeConfig.employee;

  const avatarText = (() => {
    if (node.type === "employee" && node.employeeData) {
      return `${node.employeeData.firstName?.[0] ?? ""}${node.employeeData.lastName?.[0] ?? ""}`;
    }
    return node.name.substring(0, 2).toUpperCase();
  })();

  const subLabel = (() => {
    if (node.type === "employee" && node.employeeData) {
      return node.employeeData.position;
    }
    if (node.type === "team") {
      return `${node.children?.length ?? 0} members`;
    }
    if (node.type === "department") {
      const teams = node.children?.length ?? 0;
      const emps = node.children?.reduce(
        (s, t) => s + (t.children?.length ?? 0),
        0
      ) ?? 0;
      return `${teams} teams · ${emps} people`;
    }
    return undefined;
  })();

  const card = (
    <Paper
      elevation={2}
      sx={{
        display: "inline-block",
        borderRadius: 2,
        textAlign: "center",
        minWidth: cfg.minWidth,
        py: cfg.py,
        px: cfg.px,
        borderTop: 3,
        borderColor: `${cfg.color}.main`,
        cursor: node.type === "employee" ? "pointer" : "default",
        transition: "box-shadow 0.2s",
        "&:hover":
          node.type === "employee"
            ? { boxShadow: 6 }
            : {},
      }}
    >
      <Avatar
        sx={{
          width: cfg.avatarSize,
          height: cfg.avatarSize,
          bgcolor: cfg.bgColor,
          mx: "auto",
          mb: 0.75,
          fontSize: cfg.avatarSize * 0.4,
        }}
      >
        {avatarText}
      </Avatar>
      <Typography variant={cfg.titleVariant} fontWeight="bold" noWrap>
        {node.type === "employee" && node.employeeData
          ? `${node.employeeData.firstName} ${node.employeeData.lastName}`
          : node.name}
      </Typography>
      {subLabel && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          noWrap
        >
          {subLabel}
        </Typography>
      )}
    </Paper>
  );

  if (node.type === "employee" && node.employeeData?.id) {
    return (
      <Link
        href={`/employees/${node.employeeData.id}`}
        style={{ textDecoration: "none" }}
      >
        {card}
      </Link>
    );
  }
  return card;
}

// ─── Recursive tree renderer ──────────────────────────────────────────────────
function renderNodes(nodes: OrgChartNode[]): React.ReactNode {
  return nodes.map((node) => (
    <TreeNode key={node.id} label={<OrgNodeCard node={node} />}>
      {node.children?.length > 0 && renderNodes(node.children)}
    </TreeNode>
  ));
}

// ─── Count helpers ────────────────────────────────────────────────────────────
function countByType(node: OrgChartNode, type: string): number {
  let count = node.type === type ? 1 : 0;
  for (const child of node.children ?? []) {
    count += countByType(child, type);
  }
  return count;
}

function getDepartments(root: OrgChartNode): OrgChartNode[] {
  return root.children?.filter((n) => n.type === "department") ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrganizationPage() {
  const { data, loading, error } = useQuery(ORG_CHART_QUERY, {
    errorPolicy: "all",
  });

  const orgData: OrgChartNode | null = useMemo(() => {
    if (data?.getOrgChart) return data.getOrgChart;
    return null;
  }, [data]);

  const isUsingDemoData = !orgData;
  const displayData = orgData ?? demoData;

  const totalDepts = countByType(displayData, "department");
  const totalTeams = countByType(displayData, "team");
  const totalEmps = countByType(displayData, "employee");

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Organization Chart
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Company structure — departments, teams, and employees
      </Typography>

      {isUsingDemoData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Demo Mode:</strong> GraphQL endpoint is unavailable. Showing
          sample structure.
          {error && (
            <Typography variant="caption" display="block">
              Error: {error.message}
            </Typography>
          )}
        </Alert>
      )}

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        <Chip
          icon={<BusinessIcon />}
          label={`${totalDepts} Departments`}
          color="secondary"
          variant="outlined"
        />
        <Chip
          icon={<GroupsIcon />}
          label={`${totalTeams} Teams`}
          color="info"
          variant="outlined"
        />
        <Chip
          icon={<PeopleIcon />}
          label={`${totalEmps} Employees`}
          color="success"
          variant="outlined"
        />
      </Box>

      {/* Org chart tree */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ overflowX: "auto", py: 4 }}>
          <Tree
            lineWidth="2px"
            lineColor="#1976d2"
            lineBorderRadius="8px"
            label={<OrgNodeCard node={displayData} />}
          >
            {displayData.children?.length > 0 &&
              renderNodes(displayData.children)}
          </Tree>
        </CardContent>
      </Card>

      {/* Department cards */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Departments Overview
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {getDepartments(displayData).map((dept) => {
          const teams = dept.children?.filter((n) => n.type === "team") ?? [];
          const empCount = teams.reduce(
            (s, t) => s + (t.children?.filter((n) => n.type === "employee").length ?? 0),
            0
          );

          return (
            <Card key={dept.id} sx={{ minWidth: 260, flex: "1 1 260px" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {dept.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={`${teams.length} teams`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    label={`${empCount} people`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ mt: 1.5 }}>
                  {teams.map((team) => (
                    <Chip
                      key={team.id}
                      label={`${team.name} (${team.children?.filter((n) => n.type === "employee").length ?? 0})`}
                      size="small"
                      sx={{ mr: 0.5, mt: 0.5 }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
