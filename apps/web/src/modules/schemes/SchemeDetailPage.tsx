import { Button, FormControl, FormHelperText, InputLabel, LinearProgress, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatRupees } from '../../lib/rag';
import { periodYmSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { schemesApi } from '../../services/api/schemes';
import { locationName } from '../administration/panels/labels';
import { ErrorAlert, FormDialog, fieldState, selectError } from '../administration/panels/shared';

const kpiFormSchema = z.object({
  kpiId: z.string().min(1, 'Select a KPI.'),
  periodYm: periodYmSchema,
  target: z.coerce.number({ invalid_type_error: 'Enter a target.' }).min(0, 'Target must be 0 or more.'),
  achievement: z.coerce.number({ invalid_type_error: 'Enter the achievement.' }).min(0, 'Achievement must be 0 or more.'),
});

export function SchemeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const scheme = useQuery({ queryKey: ['schemes', id], queryFn: () => schemesApi.get(id), enabled: Boolean(id) });
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const row = scheme.data;
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof kpiFormSchema>>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: { kpiId: '', periodYm: '2026-09', target: 0, achievement: 0 },
  });
  const submit = useMutation({
    mutationFn: (values: z.infer<typeof kpiFormSchema>) => {
      const physical = values.target > 0 ? Math.round((values.achievement / values.target) * 1000) / 10 : 0;
      return schemesApi.submitKpiProgress(values.kpiId, {
        periodYm: values.periodYm,
        target: values.target,
        achievement: values.achievement,
        physicalPercent: Math.min(physical, 100),
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
      <FormDialog
        title="Submit KPI progress"
        open={open}
        onClose={() => setOpen(false)}
        error={submit.error}
        onSubmit={form.handleSubmit((values) => submit.mutate(values))}
      >
        <FormControl fullWidth error={Boolean(selectError(form, 'kpiId'))}>
          <InputLabel id="kpi-select">KPI</InputLabel>
          <Select
            labelId="kpi-select"
            label="KPI"
            value={form.watch('kpiId')}
            onChange={(event) => form.setValue('kpiId', event.target.value, { shouldValidate: true })}
          >
            {(row?.kpis ?? []).map((kpi) => (
              <MenuItem key={kpi.id} value={kpi.id}>
                {kpi.name}
              </MenuItem>
            ))}
          </Select>
          {selectError(form, 'kpiId') ? <FormHelperText>{selectError(form, 'kpiId')}</FormHelperText> : null}
        </FormControl>
        <TextField label="Period YYYY-MM" required {...fieldState(form, 'periodYm')} />
        <TextField label="Target" type="number" required {...fieldState(form, 'target')} />
        <TextField label="Achievement" type="number" required {...fieldState(form, 'achievement')} />
      </FormDialog>
    </>
  );
}
