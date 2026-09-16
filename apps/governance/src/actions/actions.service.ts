import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthzService, NotifyPublisher, type AuthContext } from '@ddwmd/common';
import { ActionStatus, Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto, UpdateActionDto } from './dto/action.dto';

@Injectable()
export class ActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly notify: NotifyPublisher,
  ) {}

  async list(auth: AuthContext, query: { districtId?: string; departmentId?: string; status?: ActionStatus }) {
    this.assertRead(auth);
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    if (query.departmentId && departmentIds && !departmentIds.includes(query.departmentId)) {
      throw new ForbiddenException('You are not allowed to access this department.');
    }
    const rows = await this.prisma.actionItem.findMany({
      where: {
        isActive: true,
        ...(query.districtId ? { districtId: query.districtId } : districtIds ? { districtId: { in: districtIds } } : {}),
        ...(query.departmentId
          ? { departmentId: query.departmentId }
          : departmentIds
            ? { OR: [{ departmentId: { in: departmentIds } }, { departmentId: null }] }
            : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { dueDate: 'asc' },
    });
    return rows.map((row) => this.serialize(row));
  }

  async create(auth: AuthContext, dto: CreateActionDto) {
    this.authz.assertPermission(auth, 'action:manage');
    this.authz.assertDistrictAccess(auth, dto.districtId);
    if (dto.departmentId) {
      this.authz.assertDepartmentAccess(auth, { id: dto.departmentId, districtId: dto.districtId });
    }
    if (dto.meetingId) {
      const meeting = await this.prisma.reviewMeeting.findUnique({ where: { id: dto.meetingId } });
      if (!meeting || meeting.districtId !== dto.districtId) {
        throw new NotFoundException('Meeting not found in this district.');
      }
    }
    const created = await this.prisma.actionItem.create({
      data: {
        districtId: dto.districtId,
        meetingId: dto.meetingId,
        departmentId: dto.departmentId,
        projectId: dto.projectId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        assigneeUserId: dto.assigneeUserId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: auth.userId,
        updatedById: auth.userId,
      },
    });
    await this.notify.publish({
      districtId: created.districtId,
      departmentId: created.departmentId ?? undefined,
      title: `Action: ${created.title}`,
      body: created.dueDate ? `Due ${created.dueDate.toISOString().slice(0, 10)}.` : 'A new review action was assigned.',
      type: 'ACTION',
      entityType: 'action',
      entityId: created.id,
    });
    return this.serialize(created);
  }

  async update(auth: AuthContext, id: string, dto: UpdateActionDto) {
    this.assertRead(auth);
    const current = await this.prisma.actionItem.findUnique({ where: { id } });
    if (!current || !current.isActive) {
      throw new NotFoundException('Action not found.');
    }
    this.authz.assertDistrictAccess(auth, current.districtId);
    if (current.departmentId) {
      this.authz.assertDepartmentAccess(auth, { id: current.departmentId, districtId: current.districtId });
    }
    if (dto.title !== undefined || dto.description !== undefined || dto.dueDate !== undefined) {
      this.authz.assertPermission(auth, 'action:manage');
    } else {
      this.authz.assertPermission(auth, 'action:update');
    }
    const updated = await this.prisma.actionItem.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description === undefined ? undefined : dto.description?.trim() ?? null,
        status: dto.status,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        updatedById: auth.userId,
      },
    });
    return this.serialize(updated);
  }

  async summary(auth: AuthContext) {
    this.assertRead(auth);
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    const where: Prisma.ActionItemWhereInput = {
      isActive: true,
      ...(districtIds ? { districtId: { in: districtIds } } : {}),
      ...(departmentIds ? { OR: [{ departmentId: { in: departmentIds } }, { departmentId: null }] } : {}),
    };
    const [open, done, meetings] = await Promise.all([
      this.prisma.actionItem.count({ where: { ...where, status: { not: ActionStatus.DONE } } }),
      this.prisma.actionItem.count({ where: { ...where, status: ActionStatus.DONE } }),
      this.prisma.reviewMeeting.count({
        where: {
          isActive: true,
          ...(districtIds ? { districtId: { in: districtIds } } : {}),
        },
      }),
    ]);
    return { openActions: open, doneActions: done, meetings };
  }

  csv(auth: AuthContext) {
    this.authz.assertPermission(auth, 'report:export');
    return this.list(auth, {}).then((rows) => {
      const header = ['title', 'districtId', 'departmentId', 'status', 'dueDate', 'isOverdue'];
      const lines = [
        header.join(','),
        ...rows.map((row) =>
          [row.title, row.districtId, row.departmentId ?? '', row.status, row.dueDate ?? '', row.isOverdue].join(','),
        ),
      ];
      return lines.join('\n');
    });
  }

  private assertRead(auth: AuthContext) {
    if (this.authz.hasPermission(auth, 'action:manage') || this.authz.hasPermission(auth, 'action:update')) {
      return;
    }
    throw new ForbiddenException('You are not allowed to perform this action.');
  }

  private serialize<T extends { dueDate: Date | null; status: ActionStatus }>(row: T) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue =
      row.status !== ActionStatus.DONE && row.dueDate !== null && row.dueDate.getTime() < today.getTime();
    return {
      ...row,
      dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
      isOverdue,
    };
  }
}
