import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DistrictMap } from '../../components/DistrictMap';
import { PageHeader } from '../../components/PageHeader';
import { formatNumber } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';

export function BlocksPage() {
  const navigate = useNavigate();
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const mapPoints = useQuery({ queryKey: ['dashboard', 'map-points'], queryFn: dashboardApi.mapPoints });
  const blocks = (locations.data ?? []).filter((row) => row.type === 'BLOCK');
  const villagesByParent = new Map<string, number>();
  for (const village of locations.data ?? []) {
    if (village.type === 'VILLAGE' && village.parentId) {
      villagesByParent.set(village.parentId, (villagesByParent.get(village.parentId) ?? 0) + 1);
    }
  }

  return (
    <>
      <PageHeader
        title="Block dashboard"
        description="Blocks in this district. Open a block to see its villages, schemes, and projects."
      />
      <Stack spacing={2}>
        <DistrictMap locations={locations.data ?? []} mapPoints={mapPoints.data ?? []} height={280} />
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
          {blocks.map((block) => (
            <Card key={block.id} sx={{ minWidth: 200, flex: '1 1 200px' }}>
              <CardActionArea onClick={() => navigate(`/blocks/${block.id}`)}>
                <CardContent>
                  <Typography variant="h3">{block.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Population {formatNumber(block.population)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Villages {villagesByParent.get(block.id) ?? 0}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Stack>
    </>
  );
}
