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
  const circles = (locations.data ?? []).filter((row) => row.type === 'CIRCLE');
  const villagesByParent = new Map<string, number>();
  for (const place of locations.data ?? []) {
    if (place.type === 'VILLAGE' && place.parentId) {
      villagesByParent.set(place.parentId, (villagesByParent.get(place.parentId) ?? 0) + 1);
    }
    if (place.type === 'CIRCLE' && place.parentId && place.villageCount) {
      villagesByParent.set(place.parentId, (villagesByParent.get(place.parentId) ?? 0) + place.villageCount);
    }
  }

  return (
    <>
      <PageHeader
        title="Block dashboard"
        description="Nine blocks and seventeen circles from the Changlang district list. Circle markers use the official coordinates."
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
        <Typography variant="h3">Circles</Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
          {circles.map((circle) => (
            <Card key={circle.id} sx={{ minWidth: 200, flex: '1 1 200px' }}>
              <CardActionArea onClick={() => navigate(`/blocks/${circle.id}`)}>
                <CardContent>
                  <Typography variant="h3">{circle.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Villages {formatNumber(circle.villageCount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {circle.latitude && circle.longitude ? `${circle.latitude}, ${circle.longitude}` : 'Coordinates not set'}
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
