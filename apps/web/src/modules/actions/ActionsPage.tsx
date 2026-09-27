import { Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { isUuidLike } from '../../lib/ids';
import { actionCreateSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { ErrorAlert, FormDialog, fieldState, selectError } from '../administration/panels/shared';

export function ActionsPage() {
  const { hasPermission, profile } = useAuth();
  const canManage = hasPermission('action:manage');
  const client = useQueryClient();
  const actions = useQuery({ queryKey: ['actions'], queryFn: governanceApi.actions });
  const districts = useQuery({
    queryKey: ['admin', 'districts'],
    queryFn: adminApi.districts,
    enabled: canManage,
  });
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof actionCreateSchema>>({
    resolver: zodResolver(actionCreateSchema),
    defaultValues: {
      districtId: '',
      title: '',
      dueDate: '2026-09-30',
      officerName: '',
      locationText: '',
      dcDirection: '',
      severity: 'IMMEDIATE',
    },
  });
  const districtId = form.watch('districtId');

  const districtOptions = useMemo(() => {
    const rows = districts.data ?? [];
    if (profile?.isSuperAdmin) {
      return rows;
    }
    const allowed = new Set(profile?.districtIds ?? []);
    return rows.filter((row) => allowed.has(row.id));
  }, [districts.data, profile]);

  useEffect(() => {
    if (isUuidLike(districtId)) {
      return;
    }
    const fallback = profile?.districtIds.find(isUuidLike) ?? districtOptions[0]?.id ?? '';
    if (fallback) {
      form.setValue('districtId', fallback);
    }
  }, [districtId, districtOptions, form, profile]);

  const create = useMutation({
    mutationFn: (values: z.infer<typeof actionCreateSchema>) =>
      governanceApi.createAction({
        ...values,
        departmentId: values.departmentId || undefined,
        dueDate: values.dueDate || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['actions'] });
      setOpen(false);
      form.reset({
        districtId: form.getValues('districtId'),
        title: '',
        dueDate: '2026-09-30',
        officerName: '',
        locationText: '',
        dcDirection: '',
        severity: 'IMMEDIATE',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => governanceApi.updateAction(id, { status }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['actions'] });
    },
  });

  return (
    <>
      <PageHeader title="Action tracker" description="DC directions, officers, and deadlines. Status updates do not delete history rows." />
      <Stack spacing={2}>
        <ErrorAlert error={actions.error ?? create.error ?? update.error} />
        {canManage ? (
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
            Add action
          </Button>
        ) : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Issue / direction</TableCell>
              <TableCell>Officer</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(actions.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.title}
                  {row.dcDirection ? (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {row.dcDirection}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{row.officerName ?? '—'}</TableCell>
                <TableCell>{row.locationText ?? '—'}</TableCell>
                <TableCell>{row.isOverdue ? `${row.dueDate ?? '—'} (overdue)` : (row.dueDate ?? '—')}</TableCell>
                <TableCell>
                  <StatusChip status={row.severity ?? 'ROUTINE'} />
                </TableCell>
                <TableCell>
                  <StatusChip status={row.isOverdue && row.status !== 'DONE' ? 'OVERDUE' : row.status} />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={row.status}
                    onChange={(event) => update.mutate({ id: row.id, status: event.target.value })}
                  >
                    <MenuItem value="OPEN">OPEN</MenuItem>
                    <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                    <MenuItem value="DONE">DONE</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      <FormDialog
        title="Add action"
        open={open}
        onClose={() => setOpen(false)}
        error={create.error}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <FormControl fullWidth error={Boolean(selectError(form, 'districtId'))}>
          <InputLabel id="action-district">District</InputLabel>
          <Select
            labelId="action-district"
            label="District"
            value={districtId}
            onChange={(event) => form.setValue('districtId', event.target.value, { shouldValidate: true })}
          >
            {districtOptions.map((district) => (
              <MenuItem key={district.id} value={district.id}>
                {district.name}
              </MenuItem>
            ))}
          </Select>
          {selectError(form, 'districtId') ? <FormHelperText>{selectError(form, 'districtId')}</FormHelperText> : null}
        </FormControl>
        <TextField label="Title" required {...fieldState(form, 'title')} />
        <TextField label="Officer" {...fieldState(form, 'officerName')} />
        <TextField label="Location" {...fieldState(form, 'locationText')} />
        <TextField label="DC direction" multiline minRows={2} {...fieldState(form, 'dcDirection')} />
        <TextField
          select
          label="Severity"
          value={form.watch('severity')}
          onChange={(event) => form.setValue('severity', event.target.value as 'IMMEDIATE' | 'ATTENTION' | 'ROUTINE')}
        >
          <MenuItem value="IMMEDIATE">Immediate</MenuItem>
          <MenuItem value="ATTENTION">Attention</MenuItem>
          <MenuItem value="ROUTINE">Routine</MenuItem>
        </TextField>
        <TextField label="Due date" type="date" InputLabelProps={{ shrink: true }} {...fieldState(form, 'dueDate')} />
      </FormDialog>
    </>
  );
}
