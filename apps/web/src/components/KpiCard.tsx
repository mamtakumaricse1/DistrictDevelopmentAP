import { Box, Card, CardContent, Typography } from '@mui/material';
import { govColors } from '../app/theme';

type KpiCardProps = {
  label: string;
  value: string;
  accent?: string;
  valueColor?: string;
  large?: boolean;
};

export function KpiCard({ label, value, accent = govColors.navy, valueColor, large = false }: KpiCardProps) {
  return (
    <Card sx={{ flex: '1 1 160px', minWidth: large ? 140 : 150, overflow: 'hidden' }}>
      <Box sx={{ height: 4, bgcolor: accent }} />
      <CardContent sx={{ py: large ? 2.25 : 1.75, '&:last-child': { pb: large ? 2.25 : 1.75 } }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        <Typography
          variant={large ? 'h1' : 'h2'}
          sx={{ mt: 0.5, color: valueColor ?? 'text.primary', fontSize: large ? '2.15rem' : '1.7rem', lineHeight: 1.15 }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
