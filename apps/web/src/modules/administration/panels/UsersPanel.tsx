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
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi, type UserRecord } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog } from './shared';

const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
  roleCode: z.string().min(1),
  districtId: z.string().optional(),
  departmentId: z.string().optional(),
  keycloakIssuer: z.string().min(8).max(300),
});

export function UsersPanel() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.users() });
  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: adminApi.roles });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');
  const defaultIssuer =
    districts.data?.find((district) => district.id === defaultDistrictId)?.keycloakIssuer ?? profile?.issuer ?? '';

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      roleCode: 'VIEWER',
      districtId: defaultDistrictId,
      keycloakIssuer: defaultIssuer,
    },
  });

  const selectedDistrictId = form.watch('districtId');
  const issuerHint = useMemo(
    () => districts.data?.find((district) => district.id === selectedDistrictId)?.keycloakIssuer,
    [districts.data, selectedDistrictId],
  );

  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      adminApi.createUser({
        ...values,
        districtId: values.roleCode === 'SUPER_ADMIN' ? undefined : values.districtId || undefined,
        departmentIds: values.departmentId ? [values.departmentId] : undefined,
        phone: values.phone || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'users'] });
      setCreateOpen(false);
      form.reset({
        roleCode: 'VIEWER',
        districtId: defaultDistrictId,
        keycloakIssuer: defaultIssuer,
        email: '',
        displayName: '',
        phone: '',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => adminApi.updateUser(id, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditing(null);
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={users.error ?? create.error ?? update.error} />
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setCreateOpen(true)}>
        Provision user
      </Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>District</TableCell>
            <TableCell>Active</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(users.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.roles.map((item) => item.role.code).join(', ')}</TableCell>
              <TableCell>
                {row.roles.map((item) => districtName(districts.data ?? [], item.districtId)).join(', ')}
              </TableCell>
              <TableCell>{row.isActive ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => setEditing(row)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormDialog
        title="Provision user"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
        submitLabel="Create mapping"
      >
        <TextField label="Email" type="email" {...form.register('email')} required />
        <TextField label="Display name" {...form.register('displayName')} required />
        <TextField label="Phone" {...form.register('phone')} />
        <FormControl fullWidth>
          <InputLabel id="user-role">Role</InputLabel>
          <Select
            labelId="user-role"
            label="Role"
            value={form.watch('roleCode')}
            onChange={(event) => form.setValue('roleCode', event.target.value)}
          >
            {(roles.data ?? [])
              .filter((role) => profile?.isSuperAdmin || role.code !== 'SUPER_ADMIN')
              .map((role) => (
                <MenuItem key={role.id} value={role.code}>
                  {role.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        {form.watch('roleCode') !== 'SUPER_ADMIN' ? (
          <FormControl fullWidth>
            <InputLabel id="user-district">District</InputLabel>
            <Select
              labelId="user-district"
              label="District"
              value={form.watch('districtId')}
              onChange={(event) => {
                form.setValue('districtId', event.target.value);
                const issuer = districts.data?.find((district) => district.id === event.target.value)?.keycloakIssuer;
                if (issuer) {
                  form.setValue('keycloakIssuer', issuer);
                }
              }}
            >
              {(districts.data ?? []).map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
        {['DEPARTMENT_USER', 'DATA_ENTRY', 'BDO'].includes(form.watch('roleCode')) ? (
          <FormControl fullWidth>
            <InputLabel id="user-department">Department</InputLabel>
            <Select
              labelId="user-department"
              label="Department"
              value={form.watch('departmentId') ?? ''}
              onChange={(event) => form.setValue('departmentId', event.target.value)}
            >
              {(departments.data ?? [])
                .filter((department) => !form.watch('districtId') || department.districtId === form.watch('districtId'))
                .map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        ) : null}
        <TextField
          label="Keycloak issuer"
          {...form.register('keycloakIssuer')}
          required
          helperText={issuerHint ? `Suggested: ${issuerHint}` : 'Must match the Keycloak realm. No password is stored here.'}
        />
      </FormDialog>

      <FormDialog
        title="Edit user"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={() => {
          if (!editing) {
            return;
          }
          update.mutate({
            id: editing.id,
            body: {
              displayName: editing.displayName,
              phone: editing.phone,
              isActive: editing.isActive,
            },
          });
        }}
      >
        {editing ? (
          <>
            <TextField
              label="Display name"
              value={editing.displayName}
              onChange={(event) => setEditing({ ...editing, displayName: event.target.value })}
            />
            <TextField
              label="Phone"
              value={editing.phone ?? ''}
              onChange={(event) => setEditing({ ...editing, phone: event.target.value })}
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
