import {
  Button,
  FormControlLabel,
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
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi, type DistrictRecord } from '../../../services/api/admin';
import { ErrorAlert, FormDialog, fieldState } from './shared';

const schema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(200),
  stateCode: z.string().min(2).max(16),
  stateName: z.string().min(2).max(120),
  headquarters: z.string().max(200).optional(),
  keycloakRealm: z.string().max(64).optional(),
  keycloakIssuer: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

export function DistrictsPanel() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('district:manage');
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DistrictRecord | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const createForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stateCode: 'AR', stateName: 'Arunachal Pradesh' },
  });

  const create = useMutation({
    mutationFn: adminApi.createDistrict,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'districts'] });
      setCreateOpen(false);
      createForm.reset({ stateCode: 'AR', stateName: 'Arunachal Pradesh' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => adminApi.updateDistrict(id, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'districts'] });
      setEditing(null);
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={districts.error ?? create.error ?? update.error} />
      {canManage ? (
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setCreateOpen(true)}>
          Add district
        </Button>
      ) : null}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Keycloak realm</TableCell>
            <TableCell>Active</TableCell>
            {canManage ? <TableCell /> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {(districts.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                {row.stateName} ({row.stateCode})
              </TableCell>
              <TableCell>{row.keycloakRealm ?? '—'}</TableCell>
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
        title="Add district"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createForm.handleSubmit((values) => create.mutate(values))}
        error={create.error}
      >
        <TextField label="Code" required helperText="Unique district code, not a hardcoded name in source." {...fieldState(createForm, 'code')} />
        <TextField label="Name" required {...fieldState(createForm, 'name')} />
        <TextField label="State code" required {...fieldState(createForm, 'stateCode')} />
        <TextField label="State name" required {...fieldState(createForm, 'stateName')} />
        <TextField label="Headquarters" {...fieldState(createForm, 'headquarters')} />
        <TextField label="Keycloak realm" {...fieldState(createForm, 'keycloakRealm')} />
        <TextField label="Keycloak issuer URL" {...fieldState(createForm, 'keycloakIssuer')} />
      </FormDialog>

      <FormDialog
        title="Edit district"
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setEditError(null);
        }}
        error={editError ?? update.error}
        onSubmit={() => {
          if (!editing) {
            return;
          }
          const parsed = schema.pick({ name: true, headquarters: true, keycloakRealm: true, keycloakIssuer: true }).safeParse({
            name: editing.name,
            headquarters: editing.headquarters ?? '',
            keycloakRealm: editing.keycloakRealm ?? '',
            keycloakIssuer: editing.keycloakIssuer ?? '',
          });
          if (!parsed.success) {
            setEditError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
            return;
          }
          setEditError(null);
          update.mutate({
            id: editing.id,
            body: {
              name: editing.name,
              stateCode: editing.stateCode,
              stateName: editing.stateName,
              headquarters: editing.headquarters ?? undefined,
              keycloakRealm: editing.keycloakRealm ?? undefined,
              keycloakIssuer: editing.keycloakIssuer ?? undefined,
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
              label="Headquarters"
              value={editing.headquarters ?? ''}
              onChange={(event) => setEditing({ ...editing, headquarters: event.target.value })}
            />
            <TextField
              label="Keycloak realm"
              value={editing.keycloakRealm ?? ''}
              onChange={(event) => setEditing({ ...editing, keycloakRealm: event.target.value })}
            />
            <TextField
              label="Keycloak issuer"
              value={editing.keycloakIssuer ?? ''}
              onChange={(event) => setEditing({ ...editing, keycloakIssuer: event.target.value })}
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
