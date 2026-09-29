import { Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { choosesDistrict } from '../../auth/districtScope';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatUpdated } from '../../lib/rag';
import { isUuidLike } from '../../lib/ids';
import { meetingCreateSchema } from '../../lib/validation';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { ErrorAlert, FormDialog, fieldState, selectError } from '../administration/panels/shared';

export function MeetingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const meetings = useQuery({ queryKey: ['meetings'], queryFn: governanceApi.meetings });
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof meetingCreateSchema>>({
    resolver: zodResolver(meetingCreateSchema),
    defaultValues: {
      districtId: '',
      title: '',
      scheduledAt: '2026-09-20T10:00',
      venue: '',
      notes: '',
      nextReviewAt: '2026-10-05',
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
  const showDistrict = choosesDistrict(profile);

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
    mutationFn: (values: z.infer<typeof meetingCreateSchema>) =>
      governanceApi.createMeeting({
        districtId: values.districtId,
        title: values.title.trim(),
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        venue: values.venue || undefined,
        notes: values.notes || undefined,
        nextReviewAt: values.nextReviewAt ? new Date(values.nextReviewAt).toISOString() : undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['meetings'] });
      setOpen(false);
      form.reset({
        districtId: form.getValues('districtId'),
        title: '',
        scheduledAt: '2026-09-20T10:00',
        venue: '',
        notes: '',
        nextReviewAt: '2026-10-05',
      });
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
      <FormDialog
        title="Schedule meeting"
        open={open}
        onClose={() => setOpen(false)}
        error={create.error}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        {showDistrict ? (
          <FormControl fullWidth error={Boolean(selectError(form, 'districtId'))}>
            <InputLabel id="meeting-district">District</InputLabel>
            <Select
              labelId="meeting-district"
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
        ) : null}
        <TextField label="Title" required {...fieldState(form, 'title')} />
        <TextField label="Scheduled at" type="datetime-local" InputLabelProps={{ shrink: true }} required {...fieldState(form, 'scheduledAt')} />
        <TextField label="Venue" {...fieldState(form, 'venue')} />
        <TextField label="Notes" multiline minRows={2} {...fieldState(form, 'notes')} />
        <TextField label="Next review" type="date" InputLabelProps={{ shrink: true }} {...fieldState(form, 'nextReviewAt')} />
      </FormDialog>
    </>
  );
}
