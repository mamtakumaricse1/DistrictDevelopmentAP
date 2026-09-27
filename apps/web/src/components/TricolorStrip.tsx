import { Box } from '@mui/material';
import { govColors } from '../app/theme';

type TricolorStripProps = {
  fixed?: boolean;
};

export function TricolorStrip({ fixed = false }: TricolorStripProps) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        height: 5,
        width: '100%',
        ...(fixed
          ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 2 }
          : {}),
      }}
    >
      <Box sx={{ flex: 1, bgcolor: govColors.saffronBright }} />
      <Box sx={{ flex: 1, bgcolor: '#FFFFFF' }} />
      <Box sx={{ flex: 1, bgcolor: govColors.green }} />
    </Box>
  );
}
