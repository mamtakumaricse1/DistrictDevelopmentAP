import { Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UUID_LIKE } from '../../../lib/ids';
import { choosesDistrict } from '../../../auth/districtScope';
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog, fieldState, selectError } from './shared';

const schema = z.object({
  districtId: z.string().regex(UUID_LIKE, 'Select a district.'),
  parentId: z.string().optional(),
  type: z.enum(['SUB_DIVISION', 'BLOCK', 'CIRCLE', 'GRAM_PANCHAYAT', 'VILLAGE']),
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(200),
  population: z.coerce.number().int().min(0).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export function LocationsPanel() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const locations = useQuery({ queryKey: ['admin', 'locations'], queryFn: () => adminApi.locations() });
  const [open, setOpen] = useState(false);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');
  const showDistrict = choosesDistrict(profile);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { districtId: defaultDistrictId, type: 'VILLAGE' },
  });

  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      adminApi.createLocation({
        ...values,
        parentId: values.parentId || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'locations'] });
      setOpen(false);
      form.reset({ districtId: defaultDistrictId, type: 'VILLAGE' });
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={locations.error ?? create.error} />
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
        Add location
      </Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            {showDistrict ? <TableCell>District</TableCell> : null}
            <TableCell>Type</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Villages</TableCell>
            <TableCell align="right">Latitude</TableCell>
            <TableCell align="right">Longitude</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(locations.data ?? []).map((row) => (
            <TableRow key={row.id}>
              {showDistrict ? <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell> : null}
              <TableCell>{row.type.replaceAll('_', ' ')}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{row.villageCount ?? '—'}</TableCell>
              <TableCell align="right">{row.latitude ?? '—'}</TableCell>
              <TableCell align="right">{row.longitude ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FormDialog title="Add location" open={open} onClose={() => setOpen(false)} error={create.error} onSubmit={form.handleSubmit((values) => create.mutate(values))}>
        {showDistrict ? (
          <FormControl fullWidth error={Boolean(selectError(form, 'districtId'))}>
            <InputLabel id="loc-district">District</InputLabel>
            <Select labelId="loc-district" label="District" value={form.watch('districtId')} onChange={(event) => form.setValue('districtId', event.target.value, { shouldValidate: true })}>
              {(districts.data ?? []).map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
            {selectError(form, 'districtId') ? <FormHelperText>{selectError(form, 'districtId')}</FormHelperText> : null}
          </FormControl>
        ) : null}
        <TextField select label="Type" value={form.watch('type')} onChange={(event) => form.setValue('type', event.target.value as z.infer<typeof schema>['type'])}>
          <MenuItem value="SUB_DIVISION">Sub-division</MenuItem>
          <MenuItem value="BLOCK">Block</MenuItem>
          <MenuItem value="CIRCLE">Circle</MenuItem>
          <MenuItem value="GRAM_PANCHAYAT">Gram panchayat</MenuItem>
          <MenuItem value="VILLAGE">Village</MenuItem>
        </TextField>
        <TextField label="Code" required {...fieldState(form, 'code')} />
        <TextField label="Name" required {...fieldState(form, 'name')} />
        <TextField label="Population" type="number" {...fieldState(form, 'population')} />
        <TextField label="Latitude" type="number" {...fieldState(form, 'latitude')} />
        <TextField label="Longitude" type="number" {...fieldState(form, 'longitude')} />
      </FormDialog>
    </Stack>
  );
}
