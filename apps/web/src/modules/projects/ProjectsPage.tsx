import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { projectCreateSchema, projectUpdateSchema } from '../../lib/validation';
import { choosesDistrict } from '../../auth/districtScope';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { adminApi, type AgencyRecord, type DepartmentRecord } from '../../services/api/admin';
import {
  projectsApi,
  type ProjectRecord,
  type ProjectStatus,
} from '../../services/api/projects';
import { districtName } from '../administration/panels/labels';
import { ErrorAlert, FormDialog, fieldState, selectError } from '../administration/panels/shared';

const STATUSES: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED'];
const PAGE_SIZE = 20;

const createSchema = projectCreateSchema;

function departmentName(departments: DepartmentRecord[], id: string): string {
  return departments.find((department) => department.id === id)?.name ?? id;
}

function agenciesFor(agencies: AgencyRecord[], districtId: string | undefined, kind: 'IMPLEMENTING' | 'EXECUTING') {
  return agencies.filter(
    (agency) =>
      agency.isActive &&
      (!districtId || agency.districtId === districtId) &&
      (agency.agencyType === kind || agency.agencyType === 'BOTH'),
  );
}

export function ProjectsPage() {
  const { hasPermission, profile, isDepartmentScoped } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission('project:create');
  const canUpdate = hasPermission('project:update');
  const canClose = hasPermission('project:delete');
  const showDistrict = choosesDistrict(profile);
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [districtId, setDistrictId] = useState(profile?.isSuperAdmin ? '' : (profile?.districtIds[0] ?? ''));
  const [departmentId, setDepartmentId] = useState(profile?.departmentIds[0] ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const districts = useQuery({ queryKey: ['admin', 'districts'], queryFn: adminApi.districts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const agencies = useQuery({ queryKey: ['admin', 'agencies'], queryFn: () => adminApi.agencies() });
  const projects = useQuery({
    queryKey: ['projects', { page, search, status, districtId, departmentId }],
    queryFn: () =>
      projectsApi.list({
        page: page + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        districtId: districtId || undefined,
        departmentId: departmentId || undefined,
      }),
  });

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      financialYear: new Date().getFullYear(),
      departmentId: profile?.departmentIds[0] ?? '',
      implementingAgencyId: '',
      executingAgencyId: '',
    },
  });
  const selectedDepartmentId = form.watch('departmentId');
  const selectedDistrictId = useMemo(
    () => departments.data?.find((department) => department.id === selectedDepartmentId)?.districtId,
    [departments.data, selectedDepartmentId],
  );

  const create = useMutation({
    mutationFn: (values: z.infer<typeof createSchema>) =>
      projectsApi.create({
        name: values.name,
        departmentId: values.departmentId,
        implementingAgencyId: values.implementingAgencyId || undefined,
        executingAgencyId: values.executingAgencyId || undefined,
        financialYear: values.financialYear,
        sanctionedAmount: values.sanctionedAmount ? Number(values.sanctionedAmount) : undefined,
        releasedAmount: values.releasedAmount ? Number(values.releasedAmount) : undefined,
        contractor: values.contractor || undefined,
        category: values.category || undefined,
        workType: values.workType || undefined,
        description: values.description || undefined,
        locationText: values.locationText || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        expectedCompletion: values.expectedCompletion || undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] });
      setCreateOpen(false);
      form.reset({
        financialYear: new Date().getFullYear(),
        implementingAgencyId: '',
        executingAgencyId: '',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => projectsApi.update(id, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] });
      setEditing(null);
    },
  });

  const visibleDepartments = (departments.data ?? []).filter(
    (department) => !districtId || department.districtId === districtId,
  );
  const editStatuses = STATUSES.filter((value) => value !== 'CLOSED' || canClose);

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          isDepartmentScoped
            ? 'Only your department’s works. Open a project to submit monthly progress. Other departments are not visible.'
            : 'Create and update works in your district. Codes are assigned as district-department-year-sequence.'
        }
      />
      <Stack spacing={2}>
        <ErrorAlert error={projects.error ?? create.error ?? update.error} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          {profile?.isSuperAdmin ? (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="project-district">District</InputLabel>
              <Select
                labelId="project-district"
                label="District"
                value={districtId}
                onChange={(event) => {
                  setDistrictId(event.target.value);
                  setDepartmentId('');
                  setPage(0);
                }}
              >
                <MenuItem value="">All districts</MenuItem>
                {(districts.data ?? []).map((district) => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          {isDepartmentScoped ? null : (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="project-department">Department</InputLabel>
              <Select
                labelId="project-department"
                label="Department"
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All departments</MenuItem>
                {visibleDepartments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="project-status">Status</InputLabel>
            <Select
              labelId="project-status"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ProjectStatus | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {STATUSES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          />
          {canCreate ? (
            <Button variant="contained" sx={{ alignSelf: { md: 'center' } }} onClick={() => setCreateOpen(true)}>
              Add project
            </Button>
          ) : null}
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              {showDistrict ? <TableCell>District</TableCell> : null}
              <TableCell>Department</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              {canUpdate ? <TableCell /> : <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {(projects.data?.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                {showDistrict ? <TableCell>{districtName(districts.data ?? [], row.districtId)}</TableCell> : null}
                <TableCell>{departmentName(departments.data ?? [], row.departmentId)}</TableCell>
                <TableCell>{row.financialYear}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell>{row.sanctionedAmount ?? '—'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/projects/${row.id}`)}>
                    Open
                  </Button>
                  {canUpdate ? (
                    <Button size="small" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={projects.data?.meta.total ?? 0}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </Stack>

      <FormDialog
        title="Add project"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
        error={create.error}
      >
        <FormControl fullWidth error={Boolean(selectError(form, 'departmentId'))}>
          <InputLabel id="create-department">Department</InputLabel>
          <Select
            labelId="create-department"
            label="Department"
            value={form.watch('departmentId') ?? ''}
            onChange={(event) => form.setValue('departmentId', event.target.value, { shouldValidate: true })}
          >
            {isDepartmentScoped ? null : <MenuItem value="">Select department</MenuItem>}
            {(departments.data ?? []).map((department) => (
              <MenuItem key={department.id} value={department.id} disabled={isDepartmentScoped && department.id !== profile?.departmentIds[0]}>
                {showDistrict ? `${districtName(districts.data ?? [], department.districtId)} — ` : ''}
                {department.name}
              </MenuItem>
            ))}
          </Select>
          {selectError(form, 'departmentId') ? <FormHelperText>{selectError(form, 'departmentId')}</FormHelperText> : null}
        </FormControl>
        <TextField label="Name" required {...fieldState(form, 'name')} />
        <TextField label="Financial year" type="number" {...fieldState(form, 'financialYear')} />
        <TextField label="Sanctioned amount" {...fieldState(form, 'sanctionedAmount')} />
        <TextField label="Released amount" {...fieldState(form, 'releasedAmount')} />
        <TextField label="Contractor" {...fieldState(form, 'contractor')} />
        <FormControl fullWidth>
          <InputLabel id="create-impl">Implementing agency</InputLabel>
          <Select
            labelId="create-impl"
            label="Implementing agency"
            value={form.watch('implementingAgencyId') ?? ''}
            onChange={(event) => form.setValue('implementingAgencyId', event.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {agenciesFor(agencies.data ?? [], selectedDistrictId, 'IMPLEMENTING').map((agency) => (
              <MenuItem key={agency.id} value={agency.id}>
                {agency.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="create-exec">Executing agency</InputLabel>
          <Select
            labelId="create-exec"
            label="Executing agency"
            value={form.watch('executingAgencyId') ?? ''}
            onChange={(event) => form.setValue('executingAgencyId', event.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {agenciesFor(agencies.data ?? [], selectedDistrictId, 'EXECUTING').map((agency) => (
              <MenuItem key={agency.id} value={agency.id}>
                {agency.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Location" {...fieldState(form, 'locationText')} />
        <TextField label="Description" multiline minRows={2} {...fieldState(form, 'description')} />
        <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} {...fieldState(form, 'startDate')} />
        <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} {...fieldState(form, 'endDate')} />
        <TextField label="Expected completion" type="date" InputLabelProps={{ shrink: true }} {...fieldState(form, 'expectedCompletion')} />
      </FormDialog>

      <FormDialog
        title="Edit project"
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
          const parsed = projectUpdateSchema.safeParse({
            name: editing.name,
            status: editing.status,
            sanctionedAmount: editing.sanctionedAmount ?? '',
            locationText: editing.locationText ?? '',
            description: editing.description ?? '',
          });
          if (!parsed.success) {
            setEditError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
            return;
          }
          setEditError(null);
          update.mutate({
            id: editing.id,
            body: {
              name: parsed.data.name,
              description: parsed.data.description || undefined,
              locationText: parsed.data.locationText || undefined,
              status: parsed.data.status,
              sanctionedAmount: parsed.data.sanctionedAmount ? Number(parsed.data.sanctionedAmount) : null,
            },
          });
        }}
      >
        {editing ? (
          <>
            <TextField label="Code" value={editing.code} disabled />
            <TextField
              label="Name"
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-status">Status</InputLabel>
              <Select
                labelId="edit-status"
                label="Status"
                value={editing.status}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as ProjectStatus })}
              >
                {editStatuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Sanctioned amount"
              value={editing.sanctionedAmount ?? ''}
              onChange={(event) =>
                setEditing({ ...editing, sanctionedAmount: event.target.value === '' ? null : event.target.value })
              }
            />
            <TextField
              label="Location"
              value={editing.locationText ?? ''}
              onChange={(event) => setEditing({ ...editing, locationText: event.target.value || null })}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={editing.description ?? ''}
              onChange={(event) => setEditing({ ...editing, description: event.target.value || null })}
            />
          </>
        ) : null}
      </FormDialog>
    </>
  );
}
