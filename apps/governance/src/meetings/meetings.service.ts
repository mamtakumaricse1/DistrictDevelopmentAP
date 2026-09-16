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
      },
    });
  }
}
