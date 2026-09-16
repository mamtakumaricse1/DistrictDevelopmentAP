import { Injectable } from '@nestjs/common';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

export type IngestNotification = {
  districtId: string;
  departmentId?: string;
  title: string;
  body: string;
  type: string;
  entityType?: string;
  entityId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  ingest(payload: IngestNotification) {
    return this.prisma.notification.create({
      data: {
        districtId: payload.districtId,
        departmentId: payload.departmentId,
        title: payload.title.slice(0, 300),
        body: payload.body,
        type: payload.type.slice(0, 32),
        entityType: payload.entityType,
        entityId: payload.entityId,
      },
    });
  }

  async list(auth: AuthContext) {
    this.authz.assertPermission(auth, 'notification:read');
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    const rows = await this.prisma.notification.findMany({
      where: {
        ...(districtIds ? { districtId: { in: districtIds } } : {}),
        ...(departmentIds
          ? { OR: [{ departmentId: { in: departmentIds } }, { departmentId: null }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { reads: { where: { userId: auth.userId }, select: { readAt: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      districtId: row.districtId,
      departmentId: row.departmentId,
      title: row.title,
      body: row.body,
      type: row.type,
      entityType: row.entityType,
      entityId: row.entityId,
      createdAt: row.createdAt,
      read: row.reads.length > 0,
    }));
  }

  async unreadCount(auth: AuthContext) {
    const items = await this.list(auth);
    return { unread: items.filter((item) => !item.read).length };
  }

  async markRead(auth: AuthContext, id: string) {
    this.authz.assertPermission(auth, 'notification:read');
    await this.prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId: id, userId: auth.userId } },
      update: { readAt: new Date() },
      create: { notificationId: id, userId: auth.userId },
    });
    return { id, read: true };
  }
}
