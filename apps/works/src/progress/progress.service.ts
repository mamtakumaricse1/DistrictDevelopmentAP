import { Injectable } from '@nestjs/common';
import { Prisma, ProgressStatus } from '../generated/prisma';
import { NotifyPublisher } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { CreateProgressDto } from './dto/progress.dto';
import type { AuthContext } from '@ddwmd/common';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly notify: NotifyPublisher,
  ) {}

  async list(auth: AuthContext, projectId: string) {
    await this.access.requireProject(auth, projectId, 'progress:read');
    const rows = await this.prisma.projectProgress.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
    return rows.map((row) => this.serialize(row));
  }

  async submit(auth: AuthContext, projectId: string, dto: CreateProgressDto) {
    const project = await this.access.requireProject(auth, projectId, 'progress:submit');
    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.projectProgress.aggregate({
        where: { projectId },
        _max: { version: true },
      });
      const version = (last._max.version ?? 0) + 1;
      return tx.projectProgress.create({
        data: {
          projectId,
          version,
          periodYm: dto.periodYm,
          physicalPercent: new Prisma.Decimal(dto.physicalPercent),
          financialAmount: dto.financialAmount === undefined ? undefined : new Prisma.Decimal(dto.financialAmount),
          status: dto.status,
          remarks: dto.remarks?.trim(),
          createdById: auth.userId,
        },
      });
    });
    if (dto.status === ProgressStatus.DELAYED || dto.status === ProgressStatus.STALLED) {
      await this.notify.publish({
        districtId: project.districtId,
        departmentId: project.departmentId,
        title: `${dto.status.replaceAll('_', ' ')}: ${project.code}`,
        body: `${project.name} was reported ${dto.status.replaceAll('_', ' ').toLowerCase()} for ${dto.periodYm}.`,
        type: 'PROGRESS',
        entityType: 'project',
        entityId: project.id,
      });
    }
    return this.serialize(created);
  }

  private serialize<T extends {
    physicalPercent: { toString(): string };
    financialAmount: { toString(): string } | null;
  }>(row: T) {
    return {
      ...row,
      physicalPercent: row.physicalPercent.toString(),
      financialAmount: row.financialAmount === null ? null : row.financialAmount.toString(),
    };
  }
}
