import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { govColors } from '../app/theme';

type SectionHeadingProps = {
  title: string;
  aside?: ReactNode;
};

export function SectionHeading({ title, aside }: SectionHeadingProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box sx={{ width: 4, height: 18, borderRadius: 0.5, bgcolor: govColors.saffron }} />
        <Typography variant="h3">{title}</Typography>
      </Stack>
      {aside}
    </Stack>
  );
}
