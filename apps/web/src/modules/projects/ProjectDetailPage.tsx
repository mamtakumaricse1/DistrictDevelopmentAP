import { Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { projectsApi } from '../../services/api/projects';
import { ErrorAlert, FormDialog } from '../administration/panels/shared';

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
  const [periodYm, setPeriodYm] = useState('2026-09');
  const [percent, setPercent] = useState('0');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [remarks, setRemarks] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      projectsApi.submitProgress(id!, {
        periodYm,
        physicalPercent: Number(percent),
        status,
        remarks: remarks || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      setProgressOpen(false);
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => projectsApi.uploadDocument(id!, file),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id, 'documents'] });
    },
  });

  return (
    <>
      <PageHeader
        title={project.data?.code ?? 'Project'}
        description={project.data?.name}
      />
      <Stack spacing={2}>
        <ErrorAlert error={project.error ?? progress.error ?? documents.error ?? submit.error ?? upload.error} />
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
                if (file) {
                  upload.mutate(file);
                }
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
      <FormDialog title="New progress version" open={progressOpen} onClose={() => setProgressOpen(false)} onSubmit={() => submit.mutate()}>
        <TextField label="Period YYYY-MM" value={periodYm} onChange={(event) => setPeriodYm(event.target.value)} />
        <TextField label="Physical %" type="number" value={percent} onChange={(event) => setPercent(event.target.value)} />
        <TextField label="Status" value={status} onChange={(event) => setStatus(event.target.value)} helperText="NOT_STARTED, IN_PROGRESS, DELAYED, STALLED, COMPLETED" />
        <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      </FormDialog>
    </>
  );
}
