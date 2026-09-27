import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthzService, NotifyPublisher, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly notify: NotifyPublisher,
  ) {}

  async list(auth: AuthContext, districtId?: string) {
    this.authz.assertPermission(auth, 'meeting:manage');
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    return this.prisma.reviewMeeting.findMany({
      where: {
        isActive: true,
        ...(districtId ? { districtId } : districtIds ? { districtId: { in: districtIds } } : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      include: { _count: { select: { actions: true } } },
    });
  }

  async getById(auth: AuthContext, id: string) {
    this.authz.assertPermission(auth, 'meeting:manage');
    const meeting = await this.prisma.reviewMeeting.findUnique({
      where: { id },
      include: { actions: { where: { isActive: true }, orderBy: { dueDate: 'asc' } } },
    });
    if (!meeting || !meeting.isActive) {
      throw new NotFoundException('Meeting not found.');
    }
    this.authz.assertDistrictAccess(auth, meeting.districtId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actions = meeting.actions.map((row) => ({
      ...row,
      dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
      nextReviewAt: row.nextReviewAt ? row.nextReviewAt.toISOString().slice(0, 10) : null,
      daysPending: Math.max(0, Math.floor((today.getTime() - row.createdAt.getTime()) / 86_400_000)),
    }));
    const byDepartment = new Map<string, typeof actions>();
    for (const action of actions) {
      const key = action.departmentId ?? 'unassigned';
      const list = byDepartment.get(key) ?? [];
      list.push(action);
      byDepartment.set(key, list);
    }
    return {
      ...meeting,
      actions,
      departments: [...byDepartment.entries()].map(([departmentId, items]) => ({ departmentId, actions: items })),
    };
  }

  async create(auth: AuthContext, dto: CreateMeetingDto) {
    this.authz.assertPermission(auth, 'meeting:manage');
    this.authz.assertDistrictAccess(auth, dto.districtId);
    const meeting = await this.prisma.reviewMeeting.create({
      data: {
        districtId: dto.districtId,
        title: dto.title.trim(),
        scheduledAt: new Date(dto.scheduledAt),
        venue: dto.venue?.trim(),
        notes: dto.notes?.trim(),
        nextReviewAt: dto.nextReviewAt ? new Date(dto.nextReviewAt) : undefined,
        createdById: auth.userId,
      },
    });
    await this.notify.publish({
      districtId: meeting.districtId,
      title: `Review meeting: ${meeting.title}`,
      body: `Scheduled for ${meeting.scheduledAt.toISOString().slice(0, 16).replace('T', ' ')}.`,
      type: 'MEETING',
      entityType: 'meeting',
      entityId: meeting.id,
    });
    return meeting;
  }

  async update(auth: AuthContext, id: string, dto: UpdateMeetingDto) {
    this.authz.assertPermission(auth, 'meeting:manage');
    const current = await this.prisma.reviewMeeting.findUnique({ where: { id } });
    if (!current || !current.isActive) {
      throw new NotFoundException('Meeting not found.');
    }
    this.authz.assertDistrictAccess(auth, current.districtId);
    return this.prisma.reviewMeeting.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        venue: dto.venue === undefined ? undefined : dto.venue?.trim() ?? null,
        notes: dto.notes === undefined ? undefined : dto.notes?.trim() ?? null,
        status: dto.status,
        nextReviewAt:
          dto.nextReviewAt === undefined ? undefined : dto.nextReviewAt ? new Date(dto.nextReviewAt) : null,
      },
    });
  }
}
