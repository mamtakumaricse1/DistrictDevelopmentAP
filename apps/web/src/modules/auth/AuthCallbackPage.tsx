import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

let callbackInFlight: Promise<void> | null = null;
let callbackCode: string | null = null;

function completeOnce(code: string, run: () => Promise<void>): Promise<void> {
  if (callbackCode === code && callbackInFlight) {
    return callbackInFlight;
  }
  callbackCode = code;
  callbackInFlight = run();
  return callbackInFlight;
}

export function AuthCallbackPage() {
  const { completeCallback } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setMessage('Missing authorization code. Start again from the login page.');
      return;
    }
    void completeOnce(code, completeCallback)
      .then(() => {
        if (!cancelled) {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Sign-in could not be completed.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [completeCallback, navigate]);

  if (message) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Alert severity="error">{message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }} color="text.secondary">
        Completing sign-in…
      </Typography>
    </Box>
  );
}
