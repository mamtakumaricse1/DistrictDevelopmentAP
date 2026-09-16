import { Alert, Paper, Typography } from '@mui/material';

type PlaceholderPanelProps = {
  phase: string;
  feature: string;
};

export function PlaceholderPanel({ phase, feature }: PlaceholderPanelProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        {feature} will be implemented in {phase}. The navigation is in place so the shell can be
        deployed and reviewed now.
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Authorization, district isolation, and business rules will be enforced on the API before
        this screen becomes operational.
      </Typography>
    </Paper>
  );
}
