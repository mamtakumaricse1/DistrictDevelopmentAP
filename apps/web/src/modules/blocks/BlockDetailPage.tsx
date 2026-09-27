import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';
import { locationName } from '../administration/panels/labels';

const SECTOR_LABELS: Record<string, string> = {
  HEALTH: 'Health',
  EDUCATION: 'Education',
  ROADS: 'Roads',
  WATER: 'Water',
  HOUSING: 'Housing',
  AGRICULTURE: 'Agriculture',
  EMPLOYMENT: 'Employment',
  SOCIAL_WELFARE: 'Social security',
  INFRASTRUCTURE: 'Infrastructure',
};

export function BlockDetailPage() {
  const { locationId = '' } = useParams();
  const navigate = useNavigate();
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const data = useQuery({
    queryKey: ['dashboard', 'block', locationId],
    queryFn: () => dashboardApi.block(locationId),
    enabled: Boolean(locationId),
  });
  const place = (locations.data ?? []).find((row) => row.id === locationId);
  const villages = (locations.data ?? []).filter((row) => row.parentId === locationId);
  const gis = data.data?.gis;

  return (
    <>
      <PageHeader
        title={locationName(locations.data ?? [], locationId)}
        description={`${place?.type === 'VILLAGE' ? 'Village' : 'Block'} · Population ${formatNumber(place?.population)} · Schemes ${data.data?.totals.schemes ?? 0} · Projects ${data.data?.totals.projects ?? 0} · Beneficiaries ${formatNumber(data.data?.totals.beneficiaries)}`}
      />
      <Stack spacing={2}>
        {gis ? (
          <Typography variant="body2" color="text.secondary">
            {gis.schemes} schemes · {gis.roads} roads · {gis.water} water · {gis.schools} school · {gis.health} health ·{' '}
            {gis.pmay} PMAY
          </Typography>
        ) : null}
        <Typography variant="h3">Sector snapshot</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sector</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.data?.sectors ?? []).map((row) => (
              <TableRow key={row.domain}>
                <TableCell>{SECTOR_LABELS[row.domain] ?? row.domain.replaceAll('_', ' ')}</TableCell>
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
        {villages.length > 0 ? (
          <>
            <Typography variant="h3">Villages</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Village</TableCell>
                  <TableCell align="right">Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {villages.map((village) => (
                  <TableRow
                    key={village.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/blocks/${village.id}`)}
                  >
                    <TableCell>{village.name}</TableCell>
                    <TableCell align="right">{formatNumber(village.population)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : null}
        <Typography variant="h3">Schemes in this location</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell align="right">Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.data?.schemes ?? []).map((row) => (
              <TableRow key={row.schemeId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/schemes/${row.schemeId}`)}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{formatPercent(row.progress)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="h3">Projects</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.data?.projects ?? []).map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${row.id}`)}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
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
