import { Chip } from '@mui/material';

const TONES: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  NOT_STARTED: 'default',
  DRAFT: 'default',
  ACTIVE: 'info',
  IN_PROGRESS: 'info',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  DELAYED: 'error',
  STALLED: 'error',
  CLOSED: 'default',
  OPEN: 'info',
  OVERDUE: 'error',
  ON_TRACK: 'success',
  ATTENTION: 'warning',
  CRITICAL: 'error',
  IMMEDIATE: 'error',
  ROUTINE: 'info',
  DONE: 'success',
};

const LABELS: Record<string, string> = {
  ON_TRACK: 'On Track',
  ATTENTION: 'Attention Required',
  CRITICAL: 'Delayed / Critical',
  IMMEDIATE: 'Immediate Attention',
};

type StatusChipProps = {
  status: string;
};

export function StatusChip({ status }: StatusChipProps) {
  return <Chip size="small" label={LABELS[status] ?? status.replaceAll('_', ' ')} color={TONES[status] ?? 'default'} />;
}
