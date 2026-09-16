import { Box, Typography } from '@mui/material';

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h1" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
