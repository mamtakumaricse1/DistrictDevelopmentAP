import { Alert, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { DistrictMap } from '../../components/DistrictMap';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatUpdated, ragColor } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';
import { departmentName, locationName } from '../administration/panels/labels';

export function DashboardPage() {
  const navigate = useNavigate();
  const { hasPermission, isDepartmentScoped, isCitizen } = useAuth();
  const overview = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardApi.overview });
  const delayed = useQuery({ queryKey: ['dashboard', 'delayed'], queryFn: dashboardApi.delayed });
  const governance = useQuery({ queryKey: ['dashboard', 'governance'], queryFn: dashboardApi.governance });
  const mapPoints = useQuery({ queryKey: ['dashboard', 'map-points'], queryFn: dashboardApi.mapPoints });
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });

  const district = (districts.data ?? [])[0];
  const totals = overview.data?.totals;
  const blocks = (locations.data ?? []).filter((row) => row.type === 'BLOCK');
  const villages = (locations.data ?? []).filter((row) => row.type === 'VILLAGE');
  const headline = [
    { label: 'TOTAL', value: formatNumber(totals?.projects) },
    { label: 'ONGOING', value: formatNumber(totals?.ongoing) },
    { label: 'COMPLETED', value: formatNumber(totals?.completed), tone: 'success' as const },
    { label: 'DELAYED', value: formatNumber(totals?.delayed), tone: 'error' as const },
  ];
  const kpis = [
    { label: 'Total schemes', value: formatNumber(totals?.schemes) },
    { label: 'Total beneficiaries', value: formatNumber(totals?.beneficiaries) },
    {
      label: 'Financial progress',
      value: formatPercent(totals?.financialProgress),
      tone: ragColor(totals?.financialStatus ?? 'ATTENTION'),
    },
    {
      label: 'Physical progress',
      value: formatPercent(totals?.physicalProgress),
      tone: ragColor(totals?.physicalStatus ?? 'ATTENTION'),
    },
    {
      label: isDepartmentScoped ? 'Items needing attention' : 'Issues requiring DC intervention',
      value: formatNumber((totals?.dcIntervention ?? 0) + (governance.data?.immediate ?? 0)),
      tone: 'error' as const,
    },
  ];
  const ownDepartment = (departments.data ?? []).find((row) => row.id === (overview.data?.departments[0]?.departmentId));
  const title = isCitizen
    ? `${district?.name?.toUpperCase() ?? 'DISTRICT'} PUBLIC DASHBOARD`
    : isDepartmentScoped
      ? `${(ownDepartment?.name ?? departmentName(departments.data ?? [], overview.data?.departments[0]?.departmentId ?? '')).toUpperCase() || 'DEPARTMENT'} DASHBOARD`
      : `${district ? `DC ${district.name.toUpperCase()}` : 'DC'} DISTRICT DASHBOARD`;
  const description = isCitizen
    ? 'Public transparency view. These figures are submitted by departments. You can view them; you cannot change them.'
    : isDepartmentScoped
      ? 'Your department only. Submit scheme KPIs and project progress from here. Other departments are hidden.'
      : `${district?.name ?? 'District'} Administration | Government of Arunachal Pradesh`;

  return (
    <>
      <PageHeader title={title} description={description} />
      <Stack spacing={3}>
        {overview.isError ? <Alert severity="warning">Dashboard APIs are unavailable. Confirm Works is running.</Alert> : null}
        {isCitizen ? (
          <Alert severity="info">
            You are viewing the published district dashboard. Login as a department officer to submit updates.
          </Alert>
        ) : null}
        {isDepartmentScoped && hasPermission('progress:submit') ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" onClick={() => navigate('/schemes')}>
              Submit scheme / KPI data
            </Button>
            <Button variant="outlined" onClick={() => navigate('/projects')}>
              Submit project progress
            </Button>
            {hasPermission('report:export') ? (
              <Button variant="outlined" onClick={() => navigate('/reports')}>
                Import department CSV
              </Button>
            ) : null}
          </Stack>
        ) : null}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <Typography variant="body2">Population {formatNumber(district?.population)}</Typography>
          <Typography variant="body2">Blocks {blocks.length}</Typography>
          <Typography variant="body2">Villages {villages.length}</Typography>
          <Typography variant="body2">Schemes {formatNumber(totals?.schemes)}</Typography>
          <Typography variant="body2">Projects {formatNumber(totals?.projects)}</Typography>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {headline.map((kpi) => (
            <Card key={kpi.label} sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {kpi.label}
                </Typography>
                <Typography variant="h1" color={kpi.tone === 'error' ? 'error.main' : kpi.tone === 'success' ? 'success.main' : 'text.primary'}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          {kpis.map((kpi) => (
            <Card key={kpi.label} sx={{ minWidth: 160, flex: '1 1 160px' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {kpi.label}
                </Typography>
                <Typography variant="h2" color={kpi.tone === 'error' ? 'error.main' : kpi.tone === 'success' ? 'success.main' : kpi.tone === 'warning' ? 'warning.main' : 'text.primary'}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Typography variant="h3">DEPARTMENT PERFORMANCE</Typography>
        <Stack spacing={1.5}>
          {(overview.data?.departments ?? []).map((row) => (
            <Stack
              key={row.departmentId}
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/departments/${row.departmentId}`)}
            >
              <Typography variant="body2" sx={{ width: 140, textTransform: 'uppercase' }}>
                {departmentName(departments.data ?? [], row.departmentId)}
              </Typography>
              <ProgressBar value={row.physicalPercent} />
            </Stack>
          ))}
        </Stack>

        <Typography variant="h3">SCHEME PERFORMANCE</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Achieved</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(overview.data?.schemes ?? []).map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/schemes/${row.id}`)}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{formatNumber(row.target)}</TableCell>
                <TableCell align="right">{formatNumber(row.achievement)}</TableCell>
                <TableCell>
                  <ProgressBar value={row.progress} />
                </TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(overview.data?.delayedSchemes?.length || overview.data?.laggingBlocks?.length) ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Delayed schemes
                </Typography>
                {(overview.data?.delayedSchemes ?? []).map((row) => (
                  <Typography key={row.id} variant="body2">
                    {row.name} · {formatPercent(row.progress)}
                  </Typography>
                ))}
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Lagging blocks / villages
                </Typography>
                {(overview.data?.laggingBlocks ?? []).map((row) => (
                  <Typography key={row.locationId} variant="body2">
                    {locationName(locations.data ?? [], row.locationId)} · {formatPercent(row.progress)}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        <Typography variant="h3">{isDepartmentScoped ? 'DELAYED / ATTENTION' : 'DC INTERVENTION REQUIRED'}</Typography>
        <Stack spacing={0.5}>
          {(delayed.data ?? []).map((row, index) => (
            <Typography
              key={row.projectId}
              variant="body1"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${row.projectId}`)}
            >
              {index + 1}. {row.name} — {row.locationText ?? departmentName(departments.data ?? [], row.departmentId)} —{' '}
              {row.daysPending ?? 0} days pending
            </Typography>
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Immediate actions: {governance.data?.immediate ?? 0}. Attention: {governance.data?.attention ?? 0}. Next review:{' '}
          {formatUpdated(governance.data?.nextMeeting?.nextReviewAt ?? null)}
        </Typography>

        <Typography variant="h3">MAP OF {district?.name?.toUpperCase() ?? 'THE DISTRICT'}</Typography>
        <DistrictMap locations={locations.data ?? []} mapPoints={mapPoints.data ?? []} height={380} />
        <Typography variant="body2" color="text.secondary">
          LAST UPDATED: {formatUpdated(overview.data?.lastUpdated)}
        </Typography>
      </Stack>
    </>
  );
}
