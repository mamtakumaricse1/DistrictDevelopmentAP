import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider';
import { fetchLoginOptions } from '../../services/api/auth';

export function LoginPage() {
  const { login, error } = useAuth();
  const options = useQuery({ queryKey: ['auth', 'login-options'], queryFn: fetchLoginOptions });
  const districts = options.data?.filter((item) => item.kind === 'district') ?? [];
  const system = options.data?.find((item) => item.kind === 'system');
  const changlang = districts[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccountBalanceIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h1">DC Changlang Dashboard</Typography>
              <Typography color="text.secondary">
                Officers submit and review. Citizens can sign in for a public, read-only view.
              </Typography>
            </Box>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {options.isError ? (
            <Alert severity="error">Could not load login options. Confirm the API is running.</Alert>
          ) : null}

          {options.isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {districts.map((option) => (
                <Card key={option.code} variant="outlined">
                  <CardActionArea onClick={() => void login(option.issuer)}>
                    <CardContent>
                      <Typography variant="h3">{option.label} officers</Typography>
                      <Typography variant="body2" color="text.secondary">
                        DC, departments, and district staff. Realm {option.realm}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
              {changlang ? (
                <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
                  <CardActionArea onClick={() => void login(changlang.issuer)}>
                    <CardContent>
                      <Typography variant="h3">Citizen / public view</Typography>
                      <Typography variant="body2" color="text.secondary">
                        See which schemes are running and their financial progress. View only — no editing.
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Username <strong>citizen.changlang</strong> · password <strong>ChangeMe!2026</strong>
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ) : null}
              {system ? (
                <Button variant="text" onClick={() => void login(system.issuer)}>
                  System administration
                </Button>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
