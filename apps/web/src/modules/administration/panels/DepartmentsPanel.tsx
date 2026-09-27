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
import { adminApi, type DepartmentRecord } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog } from './shared';

const schema = z.object({
  districtId: z.string().regex(UUID_LIKE, 'Must be a UUID'),
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(200),
  shortName: z.string().max(50).optional(),
  hodName: z.string().max(200).optional(),
  hodContact: z.string().max(80).optional(),
});

export function DepartmentsPanel() {
  const { hasPermission, profile } = useAuth();
  const canManage = hasPermission('department:manage');
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { districtId: defaultDistrictId },
  });

  const create = useMutation({
    mutationFn: adminApi.createDepartment,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'departments'] });
      setCreateOpen(false);
      form.reset({ districtId: defaultDistrictId });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => adminApi.updateDepartment(id, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'departments'] });
      setEditing(null);
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={departments.error ?? create.error ?? update.error} />
      {canManage ? (
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setCreateOpen(true)}>
          Add department
        </Button>
      ) : null}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>District</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Active</TableCell>
            {canManage ? <TableCell /> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {(departments.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.shortName ? `${row.name} (${row.shortName})` : row.name}</TableCell>
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
        title="Add department"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <FormControl fullWidth>
          <InputLabel id="dept-district">District</InputLabel>
          <Select
            labelId="dept-district"
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
        <TextField label="Code" {...form.register('code')} required />
        <TextField label="Name" {...form.register('name')} required />
        <TextField label="Short name" {...form.register('shortName')} />
        <TextField label="HoD / officer" {...form.register('hodName')} />
        <TextField label="HoD contact" {...form.register('hodContact')} />
      </FormDialog>

      <FormDialog
        title="Edit department"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={() => {
          if (!editing) {
            return;
          }
          update.mutate({
            id: editing.id,
            body: {
              name: editing.name,
              shortName: editing.shortName,
              hodName: editing.hodName,
              hodContact: editing.hodContact,
              isActive: editing.isActive,
            },
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
            <TextField
              label="Short name"
              value={editing.shortName ?? ''}
              onChange={(event) => setEditing({ ...editing, shortName: event.target.value })}
            />
            <TextField
              label="HoD / officer"
              value={editing.hodName ?? ''}
              onChange={(event) => setEditing({ ...editing, hodName: event.target.value })}
            />
            <TextField
              label="HoD contact"
              value={editing.hodContact ?? ''}
              onChange={(event) => setEditing({ ...editing, hodContact: event.target.value })}
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
