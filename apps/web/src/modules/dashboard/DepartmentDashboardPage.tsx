import { Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatRupees } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { dashboardApi } from '../../services/api/dashboard';
import { departmentName } from '../administration/panels/labels';

export function DepartmentDashboardPage() {
  const { departmentId = '' } = useParams();
  const navigate = useNavigate();
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const data = useQuery({
    queryKey: ['dashboard', 'department', departmentId],
    queryFn: () => dashboardApi.department(departmentId),
    enabled: Boolean(departmentId),
  });
  const department = (departments.data ?? []).find((row) => row.id === departmentId);

  return (
    <>
      <PageHeader
        title={department?.name ?? departmentName(departments.data ?? [], departmentId)}
        description={`${department?.hodName ?? 'HoD not set'}${department?.hodContact ? ` · ${department.hodContact}` : ''}. Scheme → KPI → block → village.`}
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Physical
              </Typography>
              <Typography variant="h2">{formatPercent(data.data?.totals.physicalProgress)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Financial
              </Typography>
              <Typography variant="h2">{formatPercent(data.data?.totals.financialProgress)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Delayed
              </Typography>
              <Typography variant="h2">{data.data?.totals.delayed ?? 0}</Typography>
            </CardContent>
          </Card>
        </Stack>
        <Typography variant="h3">Schemes</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Achievement</TableCell>
              <TableCell align="right">Beneficiaries</TableCell>
              <TableCell>Physical</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.data?.schemes ?? []).map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/schemes/${row.id}`)}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{formatNumber(row.target)}</TableCell>
                <TableCell align="right">{formatNumber(row.achievement)}</TableCell>
                <TableCell align="right">{formatNumber(row.achievement)}</TableCell>
                <TableCell>
                  <ProgressBar value={row.physicalPercent} />
                </TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="h3">Projects</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Sanctioned</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.data?.projects ?? []).map((row) => (
              <TableRow
                key={String(row.id)}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${String(row.id)}`)}
              >
                <TableCell>{String(row.name)}</TableCell>
                <TableCell>{String(row.locationText ?? '—')}</TableCell>
                <TableCell align="right">{formatRupees(row.sanctionedAmount as string | null)}</TableCell>
                <TableCell>
                  <StatusChip status={String(row.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </>
  );
}
