import { Button, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatRupees } from '../../lib/rag';
import { kpiProgressSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { schemesApi } from '../../services/api/schemes';
import { locationName } from '../administration/panels/labels';
import { ErrorAlert, FormDialog } from '../administration/panels/shared';

export function SchemeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const scheme = useQuery({ queryKey: ['schemes', id], queryFn: () => schemesApi.get(id), enabled: Boolean(id) });
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const row = scheme.data;
  const [open, setOpen] = useState(false);
  const [kpiId, setKpiId] = useState('');
  const [periodYm, setPeriodYm] = useState('2026-09');
  const [target, setTarget] = useState('');
  const [achievement, setAchievement] = useState('');
  const submit = useMutation({
    mutationFn: () => {
      const physical = Number(target) > 0 ? Math.round((Number(achievement) / Number(target)) * 1000) / 10 : 0;
      const parsed = kpiProgressSchema.safeParse({
        kpiId,
        periodYm,
        target,
        achievement,
        physicalPercent: physical,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Check the KPI form.');
      }
      return schemesApi.submitKpiProgress(parsed.data.kpiId, {
        periodYm: parsed.data.periodYm,
        target: parsed.data.target,
        achievement: parsed.data.achievement,
        physicalPercent: parsed.data.physicalPercent,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['schemes', id] });
      setOpen(false);
    },
  });

  return (
    <>
      <PageHeader
        title={row?.name ?? 'Scheme'}
        description={`Target ${formatNumber(row?.target)} ${row?.targetUnit ?? ''} · Achievement ${formatNumber(row?.achievement)} · ${formatPercent(row?.progress)}`}
      />
      <Stack spacing={2}>
        {row ? <StatusChip status={row.status} /> : null}
        <Typography variant="body2">
          Officer {row?.officerName ?? '—'} · Allocated {formatRupees(row?.fundAllocated)} · Released{' '}
          {formatRupees(row?.fundReleased)} · Expenditure {formatRupees(row?.expenditure)}
        </Typography>
        {row?.remarks ? <Typography variant="body2">{row.remarks}</Typography> : null}
        <ErrorAlert error={submit.error} />
        {hasPermission('progress:submit') && (row?.kpis?.length ?? 0) > 0 ? (
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
            Submit KPI progress
          </Button>
        ) : null}
        <Typography variant="h3">Block-wise</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Block / village</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Beneficiaries</TableCell>
              <TableCell>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(row?.blockWise ?? []).map((item) => (
              <TableRow
                key={item.locationId ?? 'district'}
                hover
                sx={{ cursor: item.locationId ? 'pointer' : 'default' }}
                onClick={() => item.locationId && navigate(`/blocks/${item.locationId}`)}
              >
                <TableCell>{locationName(locations.data ?? [], item.locationId)}</TableCell>
                <TableCell align="right">{formatNumber(item.target)}</TableCell>
                <TableCell align="right">{formatNumber(item.beneficiaries)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LinearProgress variant="determinate" value={Math.min(item.progress, 100)} sx={{ flex: 1, height: 8 }} />
                    <Typography variant="caption">{formatPercent(item.progress)}</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="h3">Linked projects</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(row?.projects ?? []).map((project) => (
              <TableRow key={project.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                <TableCell>{project.code}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>
                  <StatusChip status={project.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      <FormDialog title="Submit KPI progress" open={open} onClose={() => setOpen(false)} onSubmit={() => submit.mutate()}>
        <TextField
          select
          label="KPI"
          value={kpiId}
          onChange={(event) => setKpiId(event.target.value)}
          required
        >
          {(row?.kpis ?? []).map((kpi) => (
            <MenuItem key={kpi.id} value={kpi.id}>
              {kpi.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Period YYYY-MM" value={periodYm} onChange={(event) => setPeriodYm(event.target.value)} required />
        <TextField label="Target" type="number" value={target} onChange={(event) => setTarget(event.target.value)} required />
        <TextField label="Achievement" type="number" value={achievement} onChange={(event) => setAchievement(event.target.value)} required />
      </FormDialog>
    </>
  );
}
