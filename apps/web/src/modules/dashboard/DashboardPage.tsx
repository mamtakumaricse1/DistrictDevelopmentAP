import { Alert, Box, Button, Card, CardActionArea, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { govColors } from '../../app/theme';
import { useAuth } from '../../auth/AuthProvider';
import { DistrictMap } from '../../components/DistrictMap';
import { GovSeal } from '../../components/GovSeal';
import { KpiCard } from '../../components/KpiCard';
import { ProgressBar } from '../../components/ProgressBar';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatUpdated, ragColor } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';
import { departmentName, locationName } from '../administration/panels/labels';

const TONE_COLOR = {
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'text.primary',
} as const;

const TONE_ACCENT = {
  success: '#1B7A4E',
  warning: govColors.saffron,
  error: '#B42318',
  info: govColors.navy,
} as const;

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
  const financialTone = ragColor(totals?.financialStatus ?? 'ATTENTION');
  const physicalTone = ragColor(totals?.physicalStatus ?? 'ATTENTION');
  const headline = [
    { label: 'Total', value: formatNumber(totals?.projects), accent: govColors.navy },
    { label: 'Ongoing', value: formatNumber(totals?.ongoing), accent: govColors.saffron },
    { label: 'Completed', value: formatNumber(totals?.completed), accent: '#1B7A4E', valueColor: 'success.main' },
    { label: 'Delayed', value: formatNumber(totals?.delayed), accent: '#B42318', valueColor: 'error.main' },
  ];
  const kpis = [
    { label: 'Total schemes', value: formatNumber(totals?.schemes), accent: govColors.navy },
    { label: 'Total beneficiaries', value: formatNumber(totals?.beneficiaries), accent: '#1A4A73' },
    {
      label: 'Financial progress',
      value: formatPercent(totals?.financialProgress),
      accent: TONE_ACCENT[financialTone],
      valueColor: TONE_COLOR[financialTone],
    },
    {
      label: 'Physical progress',
      value: formatPercent(totals?.physicalProgress),
      accent: TONE_ACCENT[physicalTone],
      valueColor: TONE_COLOR[physicalTone],
    },
    {
      label: isDepartmentScoped ? 'Items needing attention' : 'Issues requiring DC intervention',
      value: formatNumber((totals?.dcIntervention ?? 0) + (governance.data?.immediate ?? 0)),
      accent: '#B42318',
      valueColor: 'error.main',
    },
  ];
  const ownDepartment = (departments.data ?? []).find((row) => row.id === overview.data?.departments[0]?.departmentId);
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
  const facts = [
    { label: 'Population', value: formatNumber(district?.population) },
    { label: 'Blocks', value: String(blocks.length) },
    { label: 'Villages', value: String(villages.length) },
    { label: 'Schemes', value: formatNumber(totals?.schemes) },
    { label: 'Projects', value: formatNumber(totals?.projects) },
  ];
  const departmentRows = overview.data?.departments ?? [];
  const delayedRows = delayed.data ?? [];

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: 2,
          color: '#fff',
          background: `linear-gradient(135deg, ${govColors.navyDark} 0%, ${govColors.navy} 62%, #13406A 100%)`,
          boxShadow: '0 16px 36px rgba(7, 30, 51, 0.16)',
        }}
      >
        <Box sx={{ display: 'flex', height: 4 }}>
          <Box sx={{ flex: 1, bgcolor: govColors.saffronBright }} />
          <Box sx={{ flex: 1, bgcolor: '#fff' }} />
          <Box sx={{ flex: 1, bgcolor: govColors.green }} />
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <GovSeal size={78} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: govColors.gold, letterSpacing: '0.16em', fontSize: 12, fontWeight: 700 }}>
              GOVERNMENT OF ARUNACHAL PRADESH
            </Typography>
            <Typography variant="h1" sx={{ color: '#fff', mt: 0.75, fontSize: { xs: '1.55rem', md: '2rem' } }}>
              {title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.82)', mt: 1, maxWidth: 680 }}>{description}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2.25 }}>
              {facts.map((fact) => (
                <Box
                  key={fact.label}
                  sx={{
                    minWidth: 96,
                    px: 1.5,
                    py: 0.85,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(196,163,90,0.45)',
                  }}
                >
                  <Typography sx={{ color: govColors.gold, fontSize: 11, letterSpacing: '0.08em', fontWeight: 700 }}>
                    {fact.label.toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{fact.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {overview.isError ? <Alert severity="warning">Dashboard APIs are unavailable. Confirm Works is running.</Alert> : null}
      {isCitizen ? (
        <Alert severity="info">You are viewing the published district dashboard. Login as a department officer to submit updates.</Alert>
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {headline.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} valueColor={kpi.valueColor} large />
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} valueColor={kpi.valueColor} />
        ))}
      </Stack>

      <SectionHeading title="DEPARTMENT PERFORMANCE" />
      {departmentRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Department progress will appear here after the first submissions.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {departmentRows.map((row) => (
            <Card key={row.departmentId}>
              <CardActionArea onClick={() => navigate(`/departments/${row.departmentId}`)}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" sx={{ width: { xs: 120, sm: 180 }, fontWeight: 700, textTransform: 'uppercase' }}>
                    {departmentName(departments.data ?? [], row.departmentId)}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <ProgressBar value={row.physicalPercent} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <SectionHeading title="SCHEME PERFORMANCE" />
      <Card sx={{ overflow: 'hidden' }}>
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
      </Card>

      {overview.data?.delayedSchemes?.length || overview.data?.laggingBlocks?.length ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                DELAYED SCHEMES
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {(overview.data?.delayedSchemes ?? []).map((row) => (
                  <Stack key={row.id} direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2">{row.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatPercent(row.progress)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                LAGGING BLOCKS / VILLAGES
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {(overview.data?.laggingBlocks ?? []).map((row) => (
                  <Stack key={row.locationId} direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2">{locationName(locations.data ?? [], row.locationId)}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatPercent(row.progress)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      <SectionHeading title={isDepartmentScoped ? 'DELAYED / ATTENTION' : 'DC INTERVENTION REQUIRED'} />
      <Card>
        {delayed.isSuccess && delayedRows.length === 0 ? (
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No items are waiting for review.
            </Typography>
          </CardContent>
        ) : (
          delayedRows.map((row, index) => (
            <Box
              key={row.projectId}
              onClick={() => navigate(`/projects/${row.projectId}`)}
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                cursor: 'pointer',
                borderTop: index ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: '#FBF8F2' },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: '#F8E6E4',
                  color: '#B42318',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="body1">
                {row.name} — {row.locationText ?? departmentName(departments.data ?? [], row.departmentId)} —{' '}
                {row.daysPending ?? 0} days pending
              </Typography>
            </Box>
          ))
        )}
      </Card>
      <Typography variant="body2" color="text.secondary">
        Immediate actions: {governance.data?.immediate ?? 0}. Attention: {governance.data?.attention ?? 0}. Next review:{' '}
        {formatUpdated(governance.data?.nextMeeting?.nextReviewAt ?? null)}
      </Typography>

      <SectionHeading title={`MAP OF ${district?.name?.toUpperCase() ?? 'THE DISTRICT'}`} />
      <Card sx={{ overflow: 'hidden' }}>
        <DistrictMap locations={locations.data ?? []} mapPoints={mapPoints.data ?? []} height={380} />
      </Card>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
        LAST UPDATED: {formatUpdated(overview.data?.lastUpdated)}
      </Typography>
    </Stack>
  );
}
