import { Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { progressSchema, validateUpload } from '../../lib/validation';
import { projectsApi } from '../../services/api/projects';
import { ErrorAlert, FormDialog, fieldState } from '../administration/panels/shared';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const project = useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id!), enabled: Boolean(id) });
  const progress = useQuery({
    queryKey: ['project', id, 'progress'],
    queryFn: () => projectsApi.progress(id!),
    enabled: Boolean(id),
  });
  const documents = useQuery({
    queryKey: ['project', id, 'documents'],
    queryFn: () => projectsApi.documents(id!),
    enabled: Boolean(id),
  });
  const [progressOpen, setProgressOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof progressSchema>>({
    resolver: zodResolver(progressSchema),
    defaultValues: { periodYm: '2026-09', physicalPercent: 0, status: 'IN_PROGRESS', remarks: '', financialAmount: '' },
  });

  const submit = useMutation({
    mutationFn: (values: z.infer<typeof progressSchema>) =>
      projectsApi.submitProgress(id!, {
        periodYm: values.periodYm,
        physicalPercent: values.physicalPercent,
        financialAmount: values.financialAmount ? Number(values.financialAmount) : undefined,
        status: values.status,
        remarks: values.remarks || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      setProgressOpen(false);
      form.reset({ periodYm: '2026-09', physicalPercent: 0, status: 'IN_PROGRESS', remarks: '', financialAmount: '' });
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => projectsApi.uploadDocument(id!, file),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id, 'documents'] });
      setUploadError(null);
    },
  });

  return (
    <>
      <PageHeader title={project.data?.code ?? 'Project'} description={project.data?.name} />
      <Stack spacing={2}>
        <ErrorAlert error={project.error ?? progress.error ?? documents.error ?? submit.error ?? upload.error} />
        {uploadError ? <ErrorAlert error={new Error(uploadError)} /> : null}
        <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/projects')}>
          Back to projects
        </Button>
        {hasPermission('progress:submit') ? (
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setProgressOpen(true)}>
            Submit progress version
          </Button>
        ) : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Version</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Physical %</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(progress.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.version}</TableCell>
                <TableCell>{row.periodYm}</TableCell>
                <TableCell>{row.physicalPercent}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell>{row.remarks ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasPermission('document:upload') ? (
          <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
            Upload PDF or photo
            <input
              hidden
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                const problem = validateUpload(file);
                if (problem) {
                  setUploadError(problem);
                  return;
                }
                upload.mutate(file);
              }}
            />
          </Button>
        ) : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(documents.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.originalName}</TableCell>
                <TableCell>{row.mimeType}</TableCell>
                <TableCell>{row.byteSize}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={async () => {
                      const blob = await projectsApi.downloadDocument(row.id);
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      <FormDialog
        title="New progress version"
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        onSubmit={form.handleSubmit((values) => submit.mutate(values))}
        error={submit.error}
      >
        <TextField label="Period YYYY-MM" required {...fieldState(form, 'periodYm')} />
        <TextField label="Physical %" type="number" required {...fieldState(form, 'physicalPercent')} />
        <TextField label="Financial amount" {...fieldState(form, 'financialAmount')} />
        <TextField
          select
          label="Status"
          value={form.watch('status')}
          onChange={(event) => form.setValue('status', event.target.value as z.infer<typeof progressSchema>['status'])}
        >
          {['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'STALLED', 'COMPLETED'].map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll('_', ' ')}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Remarks" multiline minRows={2} {...fieldState(form, 'remarks')} />
      </FormDialog>
    </>
  );
}
