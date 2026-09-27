import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function OfficerOnly({ children }: { children: ReactNode }) {
  const { isCitizen } = useAuth();
  if (isCitizen) {
    return <Navigate to="/schemes" replace />;
  }
  return children;
}

type RequirePermissionProps = {
  children: ReactNode;
  permission?: string;
  anyOf?: readonly string[];
  officerOnly?: boolean;
};

export function RequirePermission({ children, permission, anyOf, officerOnly }: RequirePermissionProps) {
  const { status, isCitizen, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (officerOnly && isCitizen) {
    return <Navigate to="/schemes" replace />;
  }

  const allowed = permission ? hasPermission(permission) : anyOf ? anyOf.some((item) => hasPermission(item)) : true;
  if (!allowed) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 520, py: 6 }}>
        <Typography variant="h1">You cannot open this page</Typography>
        <Typography color="text.secondary">
          Your account does not include permission for this section. Ask the district administrator if you need access.
        </Typography>
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => navigate(isCitizen ? '/schemes' : '/dashboard')}>
          Back to home
        </Button>
      </Stack>
    );
  }

  return children;
}

export function HomeRedirect() {
  const { isCitizen } = useAuth();
  return <Navigate to={isCitizen ? '/schemes' : '/dashboard'} replace />;
}
