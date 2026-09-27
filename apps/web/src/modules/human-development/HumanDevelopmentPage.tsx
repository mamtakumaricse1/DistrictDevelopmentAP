import { Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent } from '../../lib/rag';
import { dashboardApi } from '../../services/api/dashboard';

const TABS = [
  { id: 'HEALTH', label: 'Health' },
  { id: 'EDUCATION', label: 'Education' },
  { id: 'SOCIAL_WELFARE', label: 'Social welfare' },
] as const;

export function HumanDevelopmentPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('HEALTH');
  const data = useQuery({ queryKey: ['dashboard', 'hd'], queryFn: dashboardApi.humanDevelopment });
  const domain = data.data?.[tab];
  const indicators = domain?.indicators ?? [];

  return (
    <>
      <PageHeader
        title="Human development"
        description="Health, education, and social-welfare indicators. Same RAG rules as the rest of the DC dashboard."
      />
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_, value: (typeof TABS)[number]['id']) => setTab(value)}>
          {TABS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
          {indicators.map((row) => (
            <Card
              key={row.id}
              sx={{ minWidth: 180, flex: '1 1 180px', cursor: 'pointer' }}
              onClick={() => navigate(`/schemes/${row.schemeId}`)}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {row.name}
                </Typography>
                <Typography variant="h2">{formatNumber(row.achievement)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Target {formatNumber(row.target)} {row.unit ?? ''} · {formatPercent(row.progress)}
                </Typography>
                <Stack mt={1}>
                  <StatusChip status={row.status} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </>
  );
}
