import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { choosesDistrict } from '../../../auth/districtScope';
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog, fieldState } from './shared';

const schema = z.object({
  districtId: z.string().optional(),
  key: z.string().min(2).max(100),
  value: z.string().min(1),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
});

export function SettingsPanel() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => adminApi.settings() });
  const [open, setOpen] = useState(false);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');
  const showDistrict = choosesDistrict(profile);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { districtId: defaultDistrictId, valueType: 'STRING' },
  });

  const upsert = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      adminApi.upsertSetting({
        ...values,
        districtId: values.districtId || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setOpen(false);
      form.reset({ districtId: defaultDistrictId, valueType: 'STRING' });
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={settings.error ?? upsert.error} />
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
        Add or update setting
      </Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Type</TableCell>
            {showDistrict ? <TableCell>Scope</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {(settings.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.key}</TableCell>
              <TableCell>{row.value}</TableCell>
              <TableCell>{row.valueType}</TableCell>
              {showDistrict ? <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormDialog
        title="Setting"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={form.handleSubmit((values) => upsert.mutate(values))}
        error={upsert.error}
      >
        {showDistrict ? (
          <FormControl fullWidth>
            <InputLabel id="setting-district">Scope</InputLabel>
            <Select
              labelId="setting-district"
              label="Scope"
              value={form.watch('districtId') ?? ''}
              onChange={(event) => form.setValue('districtId', event.target.value)}
            >
              {profile?.isSuperAdmin ? <MenuItem value="">Global</MenuItem> : null}
              {(districts.data ?? []).map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
        <TextField label="Key" required {...fieldState(form, 'key')} />
        <TextField label="Value" required {...fieldState(form, 'value')} />
        <FormControl fullWidth>
          <InputLabel id="setting-type">Type</InputLabel>
          <Select
            labelId="setting-type"
            label="Type"
            value={form.watch('valueType')}
            onChange={(event) =>
              form.setValue('valueType', event.target.value as 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON')
            }
          >
            <MenuItem value="STRING">String</MenuItem>
            <MenuItem value="NUMBER">Number</MenuItem>
            <MenuItem value="BOOLEAN">Boolean</MenuItem>
            <MenuItem value="JSON">JSON</MenuItem>
          </Select>
        </FormControl>
      </FormDialog>
    </Stack>
  );
}
