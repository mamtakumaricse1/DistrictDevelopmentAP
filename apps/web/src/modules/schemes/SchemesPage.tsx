import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusChip } from '../../components/StatusChip';
import { formatNumber, formatPercent, formatRupees, formatUpdated } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { schemesApi } from '../../services/api/schemes';
import { departmentName } from '../administration/panels/labels';

export function SchemesPage() {
  const navigate = useNavigate();
  const { isCitizen, isDepartmentScoped } = useAuth();
  const schemes = useQuery({ queryKey: ['schemes'], queryFn: () => schemesApi.list() });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });

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
      <Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheme</TableCell>
              <TableCell>Department</TableCell>
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
    </>
  );
}
