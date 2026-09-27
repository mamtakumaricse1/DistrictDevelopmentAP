import { Box, Typography } from '@mui/material';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { LocationRecord } from '../services/api/admin';
import type { MapPoint } from '../services/api/dashboard';
import 'leaflet/dist/leaflet.css';

type DistrictMapProps = {
  locations: LocationRecord[];
  mapPoints?: MapPoint[];
  height?: number;
};

export function DistrictMap({ locations, mapPoints = [], height = 320 }: DistrictMapProps) {
  const navigate = useNavigate();
  const placed = locations.filter((row) => row.latitude && row.longitude);
  const blocks = placed.filter((row) => row.type === 'BLOCK');
  const villages = placed.filter((row) => row.type === 'VILLAGE');
  const center: [number, number] = blocks[0]
    ? [Number(blocks[0].latitude), Number(blocks[0].longitude)]
    : [27.14, 95.73];
  const counts = new Map(mapPoints.map((point) => [point.locationId, point]));

  return (
    <Box sx={{ height, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {blocks.map((block) => {
          const point = counts.get(block.id);
          return (
            <CircleMarker
              key={block.id}
              center={[Number(block.latitude), Number(block.longitude)]}
              radius={11}
              pathOptions={{ color: '#0B3D4A', fillColor: '#1A5A6B', fillOpacity: 0.85 }}
              eventHandlers={{ click: () => navigate(`/blocks/${block.id}`) }}
            >
              <Popup>
                <Typography variant="subtitle2">{block.name}</Typography>
                <Typography variant="body2">Population {block.population ?? '—'}</Typography>
                {point ? (
                  <>
                    <Typography variant="body2">{point.schemes} schemes</Typography>
                    <Typography variant="body2">{point.roads} roads</Typography>
                    <Typography variant="body2">{point.water} water projects</Typography>
                    <Typography variant="body2">{point.schools} school</Typography>
                    <Typography variant="body2">{point.health} health facility</Typography>
                    <Typography variant="body2">{point.pmay} PMAY project</Typography>
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          );
        })}
        {villages.map((village) => {
          const point = counts.get(village.id);
          return (
            <CircleMarker
              key={village.id}
              center={[Number(village.latitude), Number(village.longitude)]}
              radius={6}
              pathOptions={{ color: '#8B4513', fillColor: '#C2410C', fillOpacity: 0.9 }}
              eventHandlers={{ click: () => navigate(`/blocks/${village.id}`) }}
            >
              <Popup>
                <Typography variant="subtitle2">Village {village.name}</Typography>
                {point ? (
                  <>
                    <Typography variant="body2">→ {point.schemes} schemes</Typography>
                    <Typography variant="body2">→ {point.roads} roads</Typography>
                    <Typography variant="body2">→ {point.water} water projects</Typography>
                    <Typography variant="body2">→ {point.schools} school</Typography>
                    <Typography variant="body2">→ {point.health} health facility</Typography>
                    <Typography variant="body2">→ {point.pmay} PMAY project</Typography>
                  </>
                ) : (
                  <Typography variant="caption">Click to open village dashboard.</Typography>
                )}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
}
