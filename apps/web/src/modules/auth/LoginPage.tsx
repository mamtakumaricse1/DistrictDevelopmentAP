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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccountBalanceIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h1">Works Monitoring</Typography>
              <Typography color="text.secondary">
                Sign in with the Keycloak realm for your district. System administrators use a
                separate realm.
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
                      <Typography variant="h3">{option.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Realm {option.realm}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
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
