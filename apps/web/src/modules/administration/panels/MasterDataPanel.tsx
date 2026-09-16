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
import { UUID_LIKE } from '../../../lib/ids';
import { useAuth } from '../../../auth/AuthProvider';
import { adminApi } from '../../../services/api/admin';
import { districtName } from './labels';
import { ErrorAlert, FormDialog } from './shared';

const categorySchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(2).max(120),
});

const itemSchema = z.object({
  categoryId: z.string().regex(UUID_LIKE, 'Must be a UUID'),
  districtId: z.string().optional(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0),
});

export function MasterDataPanel() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories });
  const items = useQuery({ queryKey: ['admin', 'items'], queryFn: () => adminApi.items() });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const defaultDistrictId = profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? '');

  const categoryForm = useForm<z.infer<typeof categorySchema>>({ resolver: zodResolver(categorySchema) });
  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { districtId: defaultDistrictId, sortOrder: 0 },
  });

  const createCategory = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setCategoryOpen(false);
      categoryForm.reset();
    },
  });

  const createItem = useMutation({
    mutationFn: (values: z.infer<typeof itemSchema>) =>
      adminApi.createItem({
        ...values,
        districtId: values.districtId || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'items'] });
      setItemOpen(false);
      itemForm.reset({ districtId: defaultDistrictId, sortOrder: 0 });
    },
  });

  return (
    <Stack spacing={2}>
      <ErrorAlert error={categories.error ?? items.error ?? createCategory.error ?? createItem.error} />
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => setCategoryOpen(true)}>
          Add category
        </Button>
        <Button variant="contained" onClick={() => setItemOpen(true)}>
          Add item
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Scope</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(items.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.category.name}</TableCell>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell>
              <TableCell>{row.isActive ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormDialog
        title="Add category"
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onSubmit={categoryForm.handleSubmit((values) => createCategory.mutate(values))}
      >
        <TextField label="Code" {...categoryForm.register('code')} required />
        <TextField label="Name" {...categoryForm.register('name')} required />
      </FormDialog>

      <FormDialog
        title="Add master-data item"
        open={itemOpen}
        onClose={() => setItemOpen(false)}
        onSubmit={itemForm.handleSubmit((values) => createItem.mutate(values))}
      >
        <FormControl fullWidth>
          <InputLabel id="item-category">Category</InputLabel>
          <Select
            labelId="item-category"
            label="Category"
            value={itemForm.watch('categoryId') ?? ''}
            onChange={(event) => itemForm.setValue('categoryId', event.target.value)}
          >
            {(categories.data ?? []).map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="item-district">District scope</InputLabel>
          <Select
            labelId="item-district"
            label="District scope"
            value={itemForm.watch('districtId') ?? ''}
            onChange={(event) => itemForm.setValue('districtId', event.target.value)}
          >
            {profile?.isSuperAdmin ? <MenuItem value="">All districts</MenuItem> : null}
            {(districts.data ?? []).map((district) => (
              <MenuItem key={district.id} value={district.id}>
                {district.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Code" {...itemForm.register('code')} required />
        <TextField label="Name" {...itemForm.register('name')} required />
        <TextField label="Sort order" type="number" {...itemForm.register('sortOrder')} />
      </FormDialog>
    </Stack>
  );
}
