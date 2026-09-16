import { Chip } from '@mui/material';

const TONES: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  NOT_STARTED: 'default',
  DRAFT: 'default',
  ACTIVE: 'info',
  IN_PROGRESS: 'info',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  DELAYED: 'warning',
  STALLED: 'error',
  CLOSED: 'default',
  OPEN: 'info',
  OVERDUE: 'error',
};

type StatusChipProps = {
  status: string;
};

export function StatusChip({ status }: StatusChipProps) {
  return <Chip size="small" label={status.replaceAll('_', ' ')} color={TONES[status] ?? 'default'} />;
}
