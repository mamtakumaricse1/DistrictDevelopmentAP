import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api/admin';
import { ErrorAlert } from './shared';

export function RolesPanel() {
  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: adminApi.roles });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={roles.error} />
      <Typography variant="body2" color="text.secondary">
        Roles are system-defined in this phase. Permissions are assigned in seed data and enforced on the API.
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Permissions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(roles.data ?? []).map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.code}</TableCell>
              <TableCell>{role.name}</TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {role.permissions.map((item) => (
                    <Chip key={item.permission.code} size="small" label={item.permission.code} />
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
