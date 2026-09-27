import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import PublicIcon from '@mui/icons-material/Public';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { govColors } from '../../app/theme';
import { useAuth } from '../../auth/AuthProvider';
import { GovSeal } from '../../components/GovSeal';
import { TricolorStrip } from '../../components/TricolorStrip';
import { fetchLoginOptions } from '../../services/api/auth';

const FEATURES = [
  'Scheme, project, and beneficiary monitoring',
  'Block and village progress for the Deputy Commissioner',
  'A public view of published district figures',
];

export function LoginPage() {
  const { login, error } = useAuth();
  const options = useQuery({ queryKey: ['auth', 'login-options'], queryFn: fetchLoginOptions });
  const districts = options.data?.filter((item) => item.kind === 'district') ?? [];
  const system = options.data?.find((item) => item.kind === 'system');
  const changlang = districts[0];
  const districtName = changlang?.label ?? 'District';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: govColors.ivory, display: 'flex', flexDirection: 'column' }}>
      <TricolorStrip fixed />
      <Box
        sx={{
          flex: 1,
          pt: '5px',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: 'calc(100vh - 5px)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            flex: { md: '1 1 46%' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: { xs: 3, md: 7 },
            py: { xs: 4, md: 6 },
            background: `linear-gradient(165deg, ${govColors.navyDark} 0%, ${govColors.navy} 58%, #13406A 100%)`,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 12% 88%, rgba(196,163,90,0.22), transparent 26%), radial-gradient(circle at 92% 8%, rgba(255,153,51,0.16), transparent 22%)',
            }}
          />
          <Stack spacing={2.5} sx={{ position: 'relative', maxWidth: 460 }}>
            <GovSeal size={84} />
            <Box>
              <Typography sx={{ color: govColors.gold, letterSpacing: '0.18em', fontSize: 12, fontWeight: 700 }}>
                GOVERNMENT OF ARUNACHAL PRADESH
              </Typography>
              <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: '1.85rem', md: '2.35rem' }, mt: 1 }}>
                {districts.length === 1 ? `DC ${districtName} Dashboard` : 'District Development Dashboard'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', mt: 1.5, maxWidth: 420 }}>
                Office of the Deputy Commissioner. Officers submit and review district works. Citizens can sign in for a
                public, read-only view.
              </Typography>
            </Box>
            <Stack spacing={1.25} sx={{ display: { xs: 'none', md: 'flex' }, pt: 1 }}>
              {FEATURES.map((feature) => (
                <Stack key={feature} direction="row" spacing={1.25} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: govColors.gold, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)' }}>
                    {feature}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 4 },
            py: { xs: 4, md: 6 },
          }}
        >
          <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 460 }}>
            <Box>
              <Typography variant="overline" sx={{ color: govColors.saffron, fontWeight: 700, letterSpacing: '0.16em' }}>
                Secure access
              </Typography>
              <Typography variant="h1">Sign in</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Choose the account that matches your role.
              </Typography>
            </Box>

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
                  <Card key={option.code}>
                    <CardActionArea onClick={() => void login(option.issuer)}>
                      <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'center', py: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: govColors.navy,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          <GroupsIcon />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h3">{option.label} officers</Typography>
                          <Typography variant="body2" color="text.secondary">
                            DC, departments, and district staff. Realm {option.realm}
                          </Typography>
                        </Box>
                        <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
                {changlang ? (
                  <Card sx={{ borderColor: govColors.green }}>
                    <CardActionArea onClick={() => void login(changlang.issuer)}>
                      <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', py: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: '#E7F5EC',
                            color: govColors.green,
                            flexShrink: 0,
                          }}
                        >
                          <PublicIcon />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h3">Citizen / public view</Typography>
                          <Typography variant="body2" color="text.secondary">
                            See which schemes are running and their financial progress. View only — no editing.
                          </Typography>
                          <Box
                            sx={{
                              mt: 1.25,
                              px: 1.25,
                              py: 0.75,
                              borderRadius: 1,
                              bgcolor: '#F7F3EA',
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="body2">
                              Username <strong>citizen.changlang</strong> · password <strong>ChangeMe!2026</strong>
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ) : null}
                {system ? (
                  <Button variant="text" onClick={() => void login(system.issuer)} sx={{ alignSelf: 'flex-start' }}>
                    System administration
                  </Button>
                ) : null}
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary">
              Authorised district use. Officer accounts are issued by the district administration.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
