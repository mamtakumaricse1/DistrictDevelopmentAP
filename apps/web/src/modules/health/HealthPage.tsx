import { Alert, Chip, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { fetchLiveness, fetchReadiness } from '../../services/api/health';

export function HealthPage() {
  const live = useQuery({ queryKey: ['health', 'live'], queryFn: fetchLiveness });
  const ready = useQuery({ queryKey: ['health', 'ready'], queryFn: fetchReadiness });
  const checks = Object.entries(ready.data?.checks ?? {});

  return (
    <>
      <PageHeader
        title="System health"
        description="Liveness and readiness for the public API. The gateway reports identity, organization, works, governance, and notify."
      />
      <Stack spacing={2} maxWidth={720}>
        {live.isError ? (
          <Alert severity="error">
            API liveness failed. Confirm the NestJS process is running on port 3000.
          </Alert>
        ) : (
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h3" gutterBottom>
              API process
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                color={live.data?.status === 'ok' ? 'success' : 'default'}
                label={live.isLoading ? 'Checking' : (live.data?.status ?? 'unknown')}
              />
              <Typography variant="body2" color="text.secondary">
                {live.data?.service} · {live.data?.timestamp}
              </Typography>
            </Stack>
          </Paper>
        )}
        {ready.isError ? (
          <Alert severity="warning">
            Readiness check failed. The public API may be up while an upstream service or PostgreSQL is unreachable.
          </Alert>
        ) : (
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h3" gutterBottom>
              Dependencies
            </Typography>
            <Stack spacing={1}>
              {checks.length === 0 && ready.isLoading ? (
                <Chip size="small" label="Checking" />
              ) : (
                checks.map(([name, status]) => (
                  <Stack key={name} direction="row" spacing={1} alignItems="center">
                    <Chip size="small" color={status === 'up' ? 'success' : 'error'} label={status} />
                    <Typography variant="body2" color="text.secondary">
                      {name}
                    </Typography>
                  </Stack>
                ))
              )}
              <Typography variant="body2" color="text.secondary">
                Overall: {ready.data?.status ?? '…'}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </>
  );
}
