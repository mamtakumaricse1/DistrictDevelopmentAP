import { Alert, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { dashboardApi } from '../../services/api/dashboard';
import { adminApi } from '../../services/api/admin';
import { districtName } from '../administration/panels/labels';

export function DashboardPage() {
  const navigate = useNavigate();
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary });
  const delayed = useQuery({ queryKey: ['dashboard', 'delayed'], queryFn: dashboardApi.delayed });
  const governance = useQuery({ queryKey: ['dashboard', 'governance'], queryFn: dashboardApi.governance });
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const kpis = [
    { label: 'Projects', value: summary.data?.totals.projects ?? 0 },
    { label: 'Delayed', value: summary.data?.latestProgress.delayed ?? 0 },
    { label: 'Stalled', value: summary.data?.latestProgress.stalled ?? 0 },
    { label: 'Open actions', value: governance.data?.openActions ?? 0 },
    { label: 'Meetings', value: governance.data?.meetings ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="District dashboard"
        description="KPIs are computed by Works and Governance. The browser only displays the scoped result."
      />
      <Stack spacing={2}>
        {summary.isError || delayed.isError ? (
          <Alert severity="warning">Dashboard APIs are unavailable. Confirm Works is running.</Alert>
        ) : null}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {kpi.label}
                </Typography>
                <Typography variant="h2">{kpi.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Typography variant="h3">Delayed and stalled works</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>District</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(delayed.data ?? []).map((row) => (
              <TableRow
                key={row.projectId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${row.projectId}`)}
              >
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell>
                <TableCell>{row.periodYm}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary">
          Department progress rows: {(summary.data?.byDepartment ?? []).length}.{' '}
          {(departments.data ?? []).length} departments in scope.
        </Typography>
      </Stack>
    </>
  );
}
