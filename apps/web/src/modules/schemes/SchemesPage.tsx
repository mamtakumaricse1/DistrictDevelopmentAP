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
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusChip } from '../../components/StatusChip';
import { REPORTING_FREQUENCIES, frequencyLabel, type ReportingFrequency } from '../../lib/frequency';
import { formatNumber, formatPercent, formatRupees, formatUpdated } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { schemesApi } from '../../services/api/schemes';
import { departmentName } from '../administration/panels/labels';
import { ErrorAlert, FormDialog, fieldState, selectError } from '../administration/panels/shared';

const SCHEME_DOMAINS = [
  'INFRASTRUCTURE',
  'WATER',
  'HOUSING',
  'HEALTH',
  'EDUCATION',
  'SOCIAL_WELFARE',
  'EMPLOYMENT',
  'AGRICULTURE',
  'OTHER',
] as const;

const createSchemeSchema = z.object({
  departmentId: z.string().min(1, 'Select a department.'),
  code: z.string().min(2, 'Enter a short code.').max(64),
  name: z.string().min(3, 'Enter the scheme name.').max(300),
  domain: z.enum(SCHEME_DOMAINS),
  officerName: z.string().max(200).optional(),
  targetValue: z.coerce.number({ invalid_type_error: 'Enter a target.' }).min(0),
  targetUnit: z.string().min(1, 'Enter a unit.').max(40),
  reportingFrequency: z.enum(REPORTING_FREQUENCIES).optional(),
});

export function SchemesPage() {
  const navigate = useNavigate();
  const { hasPermission, isCitizen, isDepartmentScoped, profile } = useAuth();
  const canCreate = hasPermission('project:create');
  const canSetFrequency = hasPermission('frequency:manage');
  const client = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const schemes = useQuery({ queryKey: ['schemes'], queryFn: () => schemesApi.list() });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const form = useForm<z.infer<typeof createSchemeSchema>>({
    resolver: zodResolver(createSchemeSchema),
    defaultValues: {
      departmentId: profile?.departmentIds[0] ?? '',
      domain: 'OTHER',
      targetValue: 0,
      reportingFrequency: 'MONTHLY',
    },
  });
  const create = useMutation({
    mutationFn: (values: z.infer<typeof createSchemeSchema>) =>
      schemesApi.create({
        departmentId: values.departmentId,
        code: values.code,
        name: values.name,
        domain: values.domain,
        officerName: values.officerName || undefined,
        targetValue: values.targetValue,
        targetUnit: values.targetUnit,
        reportingFrequency: canSetFrequency ? values.reportingFrequency : undefined,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['schemes'] });
      setCreateOpen(false);
      form.reset({
        departmentId: profile?.departmentIds[0] ?? '',
        domain: 'OTHER',
        targetValue: 0,
        reportingFrequency: 'MONTHLY',
      });
    },
  });

  if (isCitizen) {
    return (
      <>
        <PageHeader
          title="Schemes in the district"
          description="Public transparency: running schemes and how much of the allotted funds have been spent. Figures are submitted by departments. You cannot edit them."
        />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Financial progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(schemes.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{departmentName(departments.data ?? [], row.departmentId)}</TableCell>
                <TableCell sx={{ minWidth: 220 }}>
                  <ProgressBar value={row.financialPercent} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Scheme dashboard"
        description={
          isDepartmentScoped
            ? 'Your department schemes only. Open a scheme to submit KPI progress for this month.'
            : 'Department → scheme → KPI → block → village → beneficiary.'
        }
      />
      <Stack spacing={2}>
        <ErrorAlert error={schemes.error ?? create.error} />
        {canCreate ? (
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setCreateOpen(true)}>
            Add scheme
          </Button>
        ) : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Achievement</TableCell>
              <TableCell align="right">Beneficiaries</TableCell>
              <TableCell align="right">Fund allocated</TableCell>
              <TableCell align="right">Fund released</TableCell>
              <TableCell align="right">Expenditure</TableCell>
              <TableCell>Physical</TableCell>
              <TableCell align="right">Financial</TableCell>
              <TableCell>Officer</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(schemes.data ?? []).map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/schemes/${row.id}`)}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{departmentName(departments.data ?? [], row.departmentId)}</TableCell>
                <TableCell>{frequencyLabel(row.reportingFrequency)}</TableCell>
                <TableCell align="right">{formatNumber(row.target)}</TableCell>
                <TableCell align="right">{formatNumber(row.achievement)}</TableCell>
                <TableCell align="right">{formatNumber(row.achievement)}</TableCell>
                <TableCell align="right">{formatRupees(row.fundAllocated)}</TableCell>
                <TableCell align="right">{formatRupees(row.fundReleased)}</TableCell>
                <TableCell align="right">{formatRupees(row.expenditure)}</TableCell>
                <TableCell>
                  <ProgressBar value={row.physicalPercent} />
                </TableCell>
                <TableCell align="right">{formatPercent(row.financialPercent)}</TableCell>
                <TableCell>{row.officerName ?? '—'}</TableCell>
                <TableCell>{formatUpdated(row.lastUpdated)}</TableCell>
                <TableCell>{row.remarks ?? '—'}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      <FormDialog
        title="Add scheme"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        error={create.error}
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <FormControl fullWidth error={Boolean(selectError(form, 'departmentId'))}>
          <InputLabel id="scheme-department">Department</InputLabel>
          <Select
            labelId="scheme-department"
            label="Department"
            value={form.watch('departmentId')}
            onChange={(event) => form.setValue('departmentId', event.target.value, { shouldValidate: true })}
          >
            {(departments.data ?? []).map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </Select>
          {selectError(form, 'departmentId') ? <FormHelperText>{selectError(form, 'departmentId')}</FormHelperText> : null}
        </FormControl>
        <TextField label="Code" required placeholder="JJM" {...fieldState(form, 'code')} />
        <TextField label="Name" required {...fieldState(form, 'name')} />
        <FormControl fullWidth>
          <InputLabel id="scheme-domain">Domain</InputLabel>
          <Select
            labelId="scheme-domain"
            label="Domain"
            value={form.watch('domain')}
            onChange={(event) => form.setValue('domain', event.target.value as z.infer<typeof createSchemeSchema>['domain'])}
          >
            {SCHEME_DOMAINS.map((domain) => (
              <MenuItem key={domain} value={domain}>
                {domain.replaceAll('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Officer" {...fieldState(form, 'officerName')} />
        <TextField label="Target" type="number" required {...fieldState(form, 'targetValue')} />
        <TextField label="Unit" required placeholder="households" {...fieldState(form, 'targetUnit')} />
        {canSetFrequency ? (
          <FormControl fullWidth>
            <InputLabel id="scheme-frequency">Reporting frequency</InputLabel>
            <Select
              labelId="scheme-frequency"
              label="Reporting frequency"
              value={form.watch('reportingFrequency') ?? 'MONTHLY'}
              onChange={(event) => form.setValue('reportingFrequency', event.target.value as ReportingFrequency)}
            >
              {REPORTING_FREQUENCIES.map((frequency) => (
                <MenuItem key={frequency} value={frequency}>
                  {frequencyLabel(frequency)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </FormDialog>
    </>
  );
}
