import { Box, Stack, Typography } from '@mui/material';
import { ragFromPercent } from '../lib/rag';

type ProgressBarProps = {
  value: number;
  label?: string;
};

const COLORS: Record<string, string> = {
  ON_TRACK: '#1B7A4E',
  ATTENTION: '#B45309',
  CRITICAL: '#B42318',
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const status = ragFromPercent(value);
  const width = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 160 }}>
      <Box
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 99,
          bgcolor: '#E7E0D2',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: `${width}%`, height: '100%', bgcolor: COLORS[status], borderRadius: 99 }} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 40 }}>
        {label ?? `${width}%`}
      </Typography>
    </Stack>
  );
}
