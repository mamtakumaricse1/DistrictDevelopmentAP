import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { govColors } from '../../app/theme';
import { useAuth } from '../../auth/AuthProvider';
import { GovSeal } from '../../components/GovSeal';
import { TricolorStrip } from '../../components/TricolorStrip';

export function LoginPage() {
  const { loginWithPassword, error, status } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await loginWithPassword(username, password);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(165deg, ${govColors.navyDark} 0%, ${govColors.navy} 58%, #13406A 100%)`,
      }}
    >
      <TricolorStrip fixed />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
          pt: '21px',
        }}
      >
        <Stack
          component="form"
          spacing={2.5}
          onSubmit={(event) => void submit(event)}
          sx={{
            width: '100%',
            maxWidth: 440,
            bgcolor: govColors.ivory,
            borderRadius: 2,
            px: { xs: 3, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
            boxShadow: '0 24px 48px rgba(7, 30, 51, 0.28)',
          }}
        >
          <Stack spacing={1.5} alignItems="center" textAlign="center">
            <GovSeal size={72} />
            <Box>
              <Typography sx={{ color: govColors.saffron, letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>
                GOVERNMENT OF ARUNACHAL PRADESH
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: '1.65rem', sm: '1.9rem' }, mt: 0.75 }}>
                District Development Dashboard
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Sign in with the username and password issued to you.
              </Typography>
            </Box>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            fullWidth
            disabled={submitting || status === 'loading'}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            disabled={submitting || status === 'loading'}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting || status === 'loading'}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Authorised use. Accounts are issued by the district administration.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
