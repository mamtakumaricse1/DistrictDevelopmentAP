import { Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { isUuidLike } from '../../lib/ids';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { ErrorAlert, FormDialog } from '../administration/panels/shared';

export function MeetingsPage() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const meetings = useQuery({ queryKey: ['meetings'], queryFn: governanceApi.meetings });
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('2026-09-20T10:00');
  const [venue, setVenue] = useState('');
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
        throw new Error('Select a district before scheduling the meeting.');
      }
      if (title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters.');
      }
      return governanceApi.createMeeting({
        districtId,
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        venue: venue || undefined,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['meetings'] });
      setOpen(false);
      setTitle('');
    },
  });

  return (
    <>
      <PageHeader title="Review meetings" description="District-scoped review meetings. Actions are tracked separately." />
      <Stack spacing={2}>
        <ErrorAlert error={meetings.error ?? create.error} />
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
          Schedule meeting
        </Button>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>When</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(meetings.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.scheduledAt.replace('T', ' ').slice(0, 16)}</TableCell>
                <TableCell>{row.venue ?? '—'}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell>{row._count?.actions ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      <FormDialog title="Schedule meeting" open={open} onClose={() => setOpen(false)} onSubmit={() => create.mutate()}>
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
        <TextField
          label="Scheduled at"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
        />
        <TextField label="Venue" value={venue} onChange={(event) => setVenue(event.target.value)} />
      </FormDialog>
    </>
  );
}
