import { Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DistrictMap } from '../../components/DistrictMap';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatPercent, formatRupees, formatUpdated } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi, type InfrastructureProject } from '../../services/api/dashboard';

const TABS = [
  { id: 'ALL', label: 'Roads' },
  { id: 'NH', label: 'NH' },
  { id: 'PWD', label: 'PWD' },
  { id: 'RWD', label: 'RWD' },
  { id: 'PMGSY', label: 'PMGSY' },
  { id: 'BRIDGE', label: 'Bridges' },
  { id: 'CULVERT', label: 'Culverts' },
] as const;

function matchesTab(row: InfrastructureProject, tab: (typeof TABS)[number]['id']): boolean {
  if (tab === 'ALL') {
    return row.category === 'ROAD';
  }
  if (tab === 'BRIDGE' || tab === 'CULVERT') {
    return row.category === tab;
  }
  return row.workType === tab;
}

export function InfrastructurePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ALL');
  const rows = useQuery({ queryKey: ['dashboard', 'infrastructure'], queryFn: dashboardApi.infrastructure });
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const mapPoints = useQuery({ queryKey: ['dashboard', 'map-points'], queryFn: dashboardApi.mapPoints });
  const filtered = useMemo(() => (rows.data ?? []).filter((row) => matchesTab(row, tab)), [rows.data, tab]);

  return (
    <>
      <PageHeader
        title="Infrastructure dashboard"
        description="Roads, NH, PWD, RWD, PMGSY, bridges, and culverts: sanction → expenditure → physical progress → contractor → delay."
      />
      <Stack spacing={2}>
        <DistrictMap locations={locations.data ?? []} mapPoints={mapPoints.data ?? []} height={260} />
        <Tabs value={tab} onChange={(_, value: (typeof TABS)[number]['id']) => setTab(value)} variant="scrollable">
          {TABS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Sanctioned</TableCell>
              <TableCell align="right">Expenditure</TableCell>
              <TableCell align="right">Physical</TableCell>
              <TableCell>Contractor</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Expected completion</TableCell>
              <TableCell>Delay</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${row.id}`)}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.locationText ?? '—'}</TableCell>
                <TableCell align="right">{formatRupees(row.sanctionedAmount)}</TableCell>
                <TableCell align="right">{formatRupees(row.expenditure)}</TableCell>
                <TableCell align="right">{formatPercent(row.physicalPercent)}</TableCell>
                <TableCell>{row.contractor ?? '—'}</TableCell>
                <TableCell>{formatUpdated(row.startDate)}</TableCell>
                <TableCell>{formatUpdated(row.expectedCompletion)}</TableCell>
                <TableCell>{row.delayDays ? `${row.delayDays} days` : '—'}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </>
  );
}
