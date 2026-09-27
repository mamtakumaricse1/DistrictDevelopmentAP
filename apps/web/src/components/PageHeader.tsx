import { Box, Typography } from '@mui/material';
import { govColors } from '../app/theme';

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="overline" sx={{ color: govColors.saffron, fontWeight: 700, letterSpacing: '0.16em' }}>
        District administration
      </Typography>
      <Typography variant="h1">{title}</Typography>
      <Box sx={{ width: 56, height: 3, bgcolor: govColors.saffron, mt: 1.25, mb: description ? 1.25 : 0 }} />
      {description ? (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
