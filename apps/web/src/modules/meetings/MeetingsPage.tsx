import { Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatUpdated } from '../../lib/rag';
import { isUuidLike } from '../../lib/ids';
import { meetingCreateSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { ErrorAlert, FormDialog } from '../administration/panels/shared';

export function MeetingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const meetings = useQuery({ queryKey: ['meetings'], queryFn: governanceApi.meetings });
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('2026-09-20T10:00');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [nextReviewAt, setNextReviewAt] = useState('2026-10-05');
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
      const parsed = meetingCreateSchema.safeParse({
        districtId,
        title,
        scheduledAt,
        venue,
        notes,
        nextReviewAt,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Check the form.');
      }
      return governanceApi.createMeeting({
        districtId: parsed.data.districtId,
        title: parsed.data.title.trim(),
        scheduledAt: new Date(parsed.data.scheduledAt).toISOString(),
        venue: parsed.data.venue || undefined,
        notes: parsed.data.notes || undefined,
        nextReviewAt: parsed.data.nextReviewAt ? new Date(parsed.data.nextReviewAt).toISOString() : undefined,
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
      <PageHeader title="DC review" description="Issue → DC direction → officer → deadline → status. Next review stays on the meeting." />
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
              <TableCell>Next review</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(meetings.data ?? []).map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/meetings/${row.id}`)}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.scheduledAt.replace('T', ' ').slice(0, 16)}</TableCell>
                <TableCell>{row.venue ?? '—'}</TableCell>
                <TableCell>{formatUpdated(row.nextReviewAt ?? null)}</TableCell>
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
        <TextField label="Notes" multiline minRows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        <TextField
          label="Next review"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={nextReviewAt}
          onChange={(event) => setNextReviewAt(event.target.value)}
        />
      </FormDialog>
    </>
  );
}
