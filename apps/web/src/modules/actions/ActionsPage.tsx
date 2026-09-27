import { Button, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { isUuidLike } from '../../lib/ids';
import { actionCreateSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { ErrorAlert, FormDialog } from '../administration/panels/shared';

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
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [districtId, setDistrictId] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [locationText, setLocationText] = useState('');
  const [dcDirection, setDcDirection] = useState('');
  const [severity, setSeverity] = useState<'IMMEDIATE' | 'ATTENTION' | 'ROUTINE'>('IMMEDIATE');

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
      setDistrictId(fallback);
    }
  }, [districtId, districtOptions, profile]);

  const create = useMutation({
    mutationFn: () => {
      const parsed = actionCreateSchema.safeParse({
        districtId,
        title,
        dueDate,
        officerName,
        locationText,
        dcDirection,
        severity,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Check the form.');
      }
      return governanceApi.createAction({
        ...parsed.data,
        departmentId: parsed.data.departmentId || undefined,
        dueDate: parsed.data.dueDate || undefined,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['actions'] });
      setOpen(false);
      setTitle('');
      setOfficerName('');
      setLocationText('');
      setDcDirection('');
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
      <FormDialog title="Add action" open={open} onClose={() => setOpen(false)} onSubmit={() => create.mutate()}>
        <TextField
          select
          label="District"
          value={districtId}
          onChange={(event) => setDistrictId(event.target.value)}
          required
        >
          {districtOptions.map((district) => (
            <MenuItem key={district.id} value={district.id}>
              {district.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <TextField label="Officer" value={officerName} onChange={(event) => setOfficerName(event.target.value)} />
        <TextField label="Location" value={locationText} onChange={(event) => setLocationText(event.target.value)} />
        <TextField label="DC direction" multiline minRows={2} value={dcDirection} onChange={(event) => setDcDirection(event.target.value)} />
        <TextField select label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}>
          <MenuItem value="IMMEDIATE">Immediate</MenuItem>
          <MenuItem value="ATTENTION">Attention</MenuItem>
          <MenuItem value="ROUTINE">Routine</MenuItem>
        </TextField>
        <TextField label="Due date" type="date" InputLabelProps={{ shrink: true }} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </FormDialog>
    </>
  );
}
