import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import { UUID_LIKE } from '../../../lib/ids';
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi, type AgencyRecord } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog } from './shared';

const schema = z.object({
  districtId: z.string().regex(UUID_LIKE, 'Must be a UUID'),
  departmentId: z.string().regex(UUID_LIKE).optional().or(z.literal('')),
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(200),
  agencyType: z.enum(['IMPLEMENTING', 'EXECUTING', 'BOTH']),
});

export function AgenciesPanel() {
  const { hasPermission, profile } = useAuth();
  const canManage = hasPermission('agency:manage');
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const agencies = useQuery({ queryKey: ['admin', 'agencies'], queryFn: () => adminApi.agencies() });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AgencyRecord | null>(null);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { districtId: defaultDistrictId, agencyType: 'IMPLEMENTING', departmentId: '' },
  });

  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      adminApi.createAgency({
        ...values,
        departmentId: values.departmentId || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      setCreateOpen(false);
      form.reset({ districtId: defaultDistrictId, agencyType: 'IMPLEMENTING', departmentId: '' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => adminApi.updateAgency(id, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      setEditing(null);
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={agencies.error ?? create.error ?? update.error} />
      {canManage ? (
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setCreateOpen(true)}>
          Add agency
        </Button>
      ) : null}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>District</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Active</TableCell>
            {canManage ? <TableCell /> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {(agencies.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.agencyType}</TableCell>
              <TableCell>{row.isActive ? 'Yes' : 'No'}</TableCell>
              {canManage ? (
                <TableCell>
                  <Button size="small" onClick={() => setEditing(row)}>
                    Edit
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormDialog
        title="Add agency"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <FormControl fullWidth>
          <InputLabel id="agency-district">District</InputLabel>
          <Select
            labelId="agency-district"
            label="District"
            value={form.watch('districtId')}
            onChange={(event) => form.setValue('districtId', event.target.value)}
          >
            {(districts.data ?? []).map((district) => (
              <MenuItem key={district.id} value={district.id}>
                {district.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="agency-dept">Department (optional)</InputLabel>
          <Select
            labelId="agency-dept"
            label="Department (optional)"
            value={form.watch('departmentId')}
            onChange={(event) => form.setValue('departmentId', event.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {(departments.data ?? [])
              .filter((department) => !form.watch('districtId') || department.districtId === form.watch('districtId'))
              .map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <TextField label="Code" {...form.register('code')} required />
        <TextField label="Name" {...form.register('name')} required />
        <FormControl fullWidth>
          <InputLabel id="agency-type">Type</InputLabel>
          <Select
            labelId="agency-type"
            label="Type"
            value={form.watch('agencyType')}
            onChange={(event) => form.setValue('agencyType', event.target.value as 'IMPLEMENTING' | 'EXECUTING' | 'BOTH')}
          >
            <MenuItem value="IMPLEMENTING">Implementing</MenuItem>
            <MenuItem value="EXECUTING">Executing</MenuItem>
            <MenuItem value="BOTH">Both</MenuItem>
          </Select>
        </FormControl>
      </FormDialog>

      <FormDialog
        title="Edit agency"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={() => {
          if (!editing) {
            return;
          }
          update.mutate({
            id: editing.id,
            body: { name: editing.name, agencyType: editing.agencyType, isActive: editing.isActive },
          });
        }}
      >
        {editing ? (
          <>
            <TextField
              label="Name"
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editing.isActive}
                  onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })}
                />
              }
              label="Active"
            />
          </>
        ) : null}
      </FormDialog>
    </Stack>
  );
}
