"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
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
import { useQuery, gql } from "@apollo/client";

// Dynamic import to prevent SSR issues with react-organizational-chart
const Tree = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.Tree),
  { ssr: false }
);
const TreeNode = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.TreeNode),
  { ssr: false }
);

const ORG_CHART_QUERY = gql`
  query GetOrgChart {
    orgChart {
      id
      name
      code
      departments {
        id
        name
        code
        managerId
        teams {
          id
          name
          leaderId
          members {
            id
            firstName
            lastName
            position
            email
            avatarUrl
          }
        }
      }
    }
  }
`;

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  avatarUrl?: string;
}

interface Team {
  id: string;
  name: string;
  leaderId: string;
  members: Employee[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
  teams: Team[];
}

interface Company {
  id: string;
  name: string;
  code: string;
  departments: Department[];
}

interface OrgNodeProps {
  label: string;
  subLabel?: string;
  avatarText?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
  size?: "small" | "medium" | "large";
}

const OrgNode = ({
  label,
  subLabel,
  avatarText,
  color = "primary",
  size = "medium",
}: OrgNodeProps) => {
  const sizeStyles = {
    small: { minWidth: 120, py: 1, px: 1.5 },
    medium: { minWidth: 160, py: 1.5, px: 2 },
    large: { minWidth: 200, py: 2, px: 3 },
  };

  return (
    <Paper
      elevation={2}
      sx={{
        display: "inline-block",
        borderRadius: 2,
        textAlign: "center",
        ...sizeStyles[size],
        borderTop: 3,
        borderColor: `${color}.main`,
      }}
    >
      {avatarText && (
        <Avatar
          sx={{
            width: size === "small" ? 32 : 40,
            height: size === "small" ? 32 : 40,
            bgcolor: `${color}.main`,
            mx: "auto",
            mb: 1,
            fontSize: size === "small" ? 12 : 14,
          }}
        >
          {avatarText}
        </Avatar>
      )}
      <Typography
        variant={size === "small" ? "body2" : "subtitle1"}
        fontWeight="bold"
        noWrap
      >
        {label}
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
};

// Fallback demo data if GraphQL is not available
const demoOrgData: Company = {
  id: "1",
  name: "ABC Corporation",
  code: "ABC",
  departments: [
    {
      id: "d1",
      name: "Engineering",
      code: "ENG",
      managerId: "e1",
      teams: [
        {
          id: "t1",
          name: "Frontend Team",
          leaderId: "e2",
          members: [
            {
              id: "e2",
              firstName: "John",
              lastName: "Doe",
              position: "Team Lead",
              email: "john@abc.com",
            },
            {
              id: "e3",
              firstName: "Jane",
              lastName: "Smith",
              position: "Senior Developer",
              email: "jane@abc.com",
            },
            {
              id: "e4",
              firstName: "Bob",
              lastName: "Wilson",
              position: "Developer",
              email: "bob@abc.com",
            },
          ],
        },
        {
          id: "t2",
          name: "Backend Team",
          leaderId: "e5",
          members: [
            {
              id: "e5",
              firstName: "Alice",
              lastName: "Johnson",
              position: "Team Lead",
              email: "alice@abc.com",
            },
            {
              id: "e6",
              firstName: "Charlie",
              lastName: "Brown",
              position: "Developer",
              email: "charlie@abc.com",
            },
          ],
        },
      ],
    },
    {
      id: "d2",
      name: "Human Resources",
      code: "HR",
      managerId: "e7",
      teams: [
        {
          id: "t3",
          name: "Recruitment",
          leaderId: "e8",
          members: [
            {
              id: "e8",
              firstName: "Eva",
              lastName: "Green",
              position: "Team Lead",
              email: "eva@abc.com",
            },
            {
              id: "e9",
              firstName: "Frank",
              lastName: "Miller",
              position: "Recruiter",
              email: "frank@abc.com",
            },
          ],
        },
      ],
    },
    {
      id: "d3",
      name: "Finance",
      code: "FIN",
      managerId: "e10",
      teams: [
        {
          id: "t4",
          name: "Accounting",
          leaderId: "e11",
          members: [
            {
              id: "e11",
              firstName: "Grace",
              lastName: "Lee",
              position: "Team Lead",
              email: "grace@abc.com",
            },
          ],
        },
      ],
    },
  ],
};

export default function OrganizationPage() {
  const { data, loading, error } = useQuery(ORG_CHART_QUERY, {
    errorPolicy: "all",
  });

  const isUsingDemoData = !data?.orgChart;

  const orgData = useMemo(() => {
    if (data?.orgChart) {
      return data.orgChart;
    }
    // Return demo data if GraphQL fails or returns null
    return demoOrgData;
  }, [data]);

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
      <Typography variant="h4" sx={{ mb: 3 }}>
        Organization Chart
      </Typography>

      {isUsingDemoData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Demo Mode:</strong> GraphQL endpoint is not available. Displaying sample organization structure for demonstration purposes.
          {error && <Typography variant="caption" display="block">Error: {error.message}</Typography>}
        </Alert>
      )}

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Chip
          label={`${orgData.departments?.length || 0} Departments`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`${
            orgData.departments?.reduce(
              (acc: number, d: Department) => acc + (d.teams?.length || 0),
              0
            ) || 0
          } Teams`}
          color="secondary"
          variant="outlined"
        />
        <Chip
          label={`${
            orgData.departments?.reduce(
              (acc: number, d: Department) =>
                acc +
                (d.teams?.reduce(
                  (tacc: number, t: Team) => tacc + (t.members?.length || 0),
                  0
                ) || 0),
              0
            ) || 0
          } Employees`}
          color="success"
          variant="outlined"
        />
      </Box>

      {/* Org Chart */}
      <Card>
        <CardContent sx={{ overflow: "auto", py: 4 }}>
          <Tree
            lineWidth="2px"
            lineColor="#1976d2"
            lineBorderRadius="10px"
            label={
              <OrgNode
                label={orgData.name}
                subLabel={orgData.code}
                avatarText={orgData.name?.substring(0, 2)}
                color="primary"
                size="large"
              />
            }
          >
            {orgData.departments?.map((dept: Department) => (
              <TreeNode
                key={dept.id}
                label={
                  <OrgNode
                    label={dept.name}
                    subLabel={dept.code}
                    color="secondary"
                    size="medium"
                  />
                }
              >
                {dept.teams?.map((team: Team) => (
                  <TreeNode
                    key={team.id}
                    label={
                      <OrgNode
                        label={team.name}
                        subLabel={`${team.members?.length || 0} members`}
                        color="info"
                        size="medium"
                      />
                    }
                  >
                    {team.members?.map((member: Employee) => (
                      <TreeNode
                        key={member.id}
                        label={
                          <OrgNode
                            label={`${member.firstName} ${member.lastName}`}
                            subLabel={member.position}
                            avatarText={`${member.firstName?.[0]}${member.lastName?.[0]}`}
                            color={
                              member.id === team.leaderId
                                ? "success"
                                : "primary"
                            }
                            size="small"
                          />
                        }
                      />
                    ))}
                  </TreeNode>
                ))}
              </TreeNode>
            ))}
          </Tree>
        </CardContent>
      </Card>

      {/* Department Details */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Departments Overview
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {orgData.departments?.map((dept: Department) => (
          <Card key={dept.id} sx={{ minWidth: 280, flex: "1 1 280px" }}>
            <CardContent>
              <Typography variant="h6">{dept.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Code: {dept.code}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Teams ({dept.teams?.length || 0})
                </Typography>
                {dept.teams?.map((team: Team) => (
                  <Chip
                    key={team.id}
                    label={`${team.name} (${team.members?.length || 0})`}
                    size="small"
                    sx={{ mr: 0.5, mt: 0.5 }}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
