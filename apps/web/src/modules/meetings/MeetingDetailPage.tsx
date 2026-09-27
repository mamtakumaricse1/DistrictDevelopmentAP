import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusChip } from '../../components/StatusChip';
import { formatUpdated } from '../../lib/rag';
import { adminApi } from '../../services/api/admin';
import { governanceApi } from '../../services/api/governance';
import { departmentName } from '../administration/panels/labels';

export function MeetingDetailPage() {
  const { id = '' } = useParams();
  const meeting = useQuery({
    queryKey: ['meetings', id],
    queryFn: () => governanceApi.meeting(id),
    enabled: Boolean(id),
  });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const row = meeting.data;

  return (
    <>
      <PageHeader
        title={row?.title ?? 'DC review'}
        description={`Meeting date: ${row?.scheduledAt ? row.scheduledAt.slice(0, 10).split('-').reverse().join('-') : '—'} · Next review: ${formatUpdated(row?.nextReviewAt ?? null)}`}
      />
      <Stack spacing={3}>
        {(row?.departments ?? []).map((group) => (
          <Stack key={group.departmentId} spacing={1}>
            <Typography variant="h3">{departmentName(departments.data ?? [], group.departmentId === 'unassigned' ? null : group.departmentId)}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Issue</TableCell>
                  <TableCell>Direction of DC</TableCell>
                  <TableCell>Officer</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Current status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>{action.title}</TableCell>
                    <TableCell>{action.dcDirection ?? '—'}</TableCell>
                    <TableCell>{action.officerName ?? '—'}</TableCell>
                    <TableCell>{formatUpdated(action.dueDate)}</TableCell>
                    <TableCell>
                      <StatusChip status={action.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
