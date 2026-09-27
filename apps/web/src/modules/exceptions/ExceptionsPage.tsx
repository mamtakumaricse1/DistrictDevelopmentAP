import { Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';
import { governanceApi } from '../../services/api/governance';
import { departmentName } from '../administration/panels/labels';

export function ExceptionsPage() {
  const { isDepartmentScoped, isCitizen } = useAuth();
  const navigate = useNavigate();
  const actions = useQuery({ queryKey: ['actions'], queryFn: governanceApi.actions });
  const delayed = useQuery({ queryKey: ['dashboard', 'delayed'], queryFn: dashboardApi.delayed });
  const overview = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardApi.overview });
  const governance = useQuery({ queryKey: ['dashboard', 'governance'], queryFn: dashboardApi.governance });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const immediate = (actions.data ?? []).filter((row) => row.severity === 'IMMEDIATE' && row.status !== 'DONE');
  const attention = (actions.data ?? []).filter((row) => row.severity === 'ATTENTION' && row.status !== 'DONE');
  const delayedRows = delayed.data ?? [];
  const onTrack = overview.data?.totals.onTrack ?? 0;

  return (
    <>
      <PageHeader
        title={
          isCitizen ? 'Progress & delays' : isDepartmentScoped ? 'My department priorities' : 'DC priority / exceptions'
        }
        description={
          isCitizen
            ? 'Published delayed and lagging works. This is a public view — you cannot assign or close items.'
            : isDepartmentScoped
              ? 'Delayed and assigned items for your department only.'
              : 'Do not search 100 charts. Immediate attention first, then items that need a watch, then on-track works.'
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2">Immediate attention</Typography>
              <Typography variant="h2" color="error.main">
                {immediate.length || delayedRows.length || governance.data?.immediate || 0}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2">Attention required</Typography>
              <Typography variant="h2" color="warning.main">
                {attention.length || governance.data?.attention || 0}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2">On track</Typography>
              <Typography variant="h2" color="success.main">
                {onTrack}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
        <Typography variant="h3">Immediate attention</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Issue</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Days pending</TableCell>
              <TableCell>Responsible officer</TableCell>
              <TableCell>DC direction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {immediate.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/actions')}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{departmentName(departments.data ?? [], row.departmentId)}</TableCell>
                <TableCell>{row.locationText ?? '—'}</TableCell>
                <TableCell>{row.daysPending ?? '—'}</TableCell>
                <TableCell>{row.officerName ?? '—'}</TableCell>
                <TableCell>{row.dcDirection ?? '—'}</TableCell>
              </TableRow>
            ))}
            {immediate.length === 0
              ? delayedRows.map((row) => (
                  <TableRow key={row.projectId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${row.projectId}`)}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{departmentName(departments.data ?? [], row.departmentId)}</TableCell>
                    <TableCell>{row.locationText ?? '—'}</TableCell>
                    <TableCell>{row.daysPending ?? '—'}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
        <Typography variant="h3">Attention required</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Issue</TableCell>
              <TableCell>Officer</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attention.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.officerName ?? '—'}</TableCell>
                <TableCell>
                  <StatusChip status={row.severity ?? row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="h3">On track</Typography>
        <Typography variant="body1">{onTrack} projects</Typography>
      </Stack>
    </>
  );
}
