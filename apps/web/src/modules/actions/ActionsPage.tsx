import { Button, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { isUuidLike } from '../../lib/ids';
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
      if (!isUuidLike(districtId)) {
        throw new Error('Select a district before saving the action.');
      }
      if (title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters.');
      }
      return governanceApi.createAction({
        districtId,
        title: title.trim(),
        dueDate: dueDate || undefined,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['actions'] });
      setOpen(false);
      setTitle('');
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
      <PageHeader title="Action tracker" description="Review actions stay in Governance. Status updates do not delete history rows." />
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
              <TableCell>Title</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(actions.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.isOverdue ? `${row.dueDate ?? '—'} (overdue)` : (row.dueDate ?? '—')}</TableCell>
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
        <TextField label="Due date" type="date" InputLabelProps={{ shrink: true }} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </FormDialog>
    </>
  );
}
