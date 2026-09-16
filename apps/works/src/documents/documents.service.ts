import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { LocalStorageService } from '../storage/local-storage.service';
import type { AuthContext } from '@ddwmd/common';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly storage: LocalStorageService,
  ) {}

  async list(auth: AuthContext, projectId: string) {
    await this.access.requireProject(auth, projectId, 'project:read');
    return this.prisma.projectDocument.findMany({
      where: { projectId, isActive: true },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        projectId: true,
        progressId: true,
        originalName: true,
        mimeType: true,
        byteSize: true,
        uploadedAt: true,
      },
    });
  }

  async upload(
    auth: AuthContext,
    projectId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    progressId?: string,
  ) {
    const project = await this.access.requireProject(auth, projectId, 'document:upload');
    this.storage.assertFile(file);
    if (progressId) {
      const progress = await this.prisma.projectProgress.findFirst({ where: { id: progressId, projectId } });
      if (!progress) {
        throw new NotFoundException('Progress version not found for this project.');
      }
    }
    const saved = await this.storage.save({
      districtId: project.districtId,
      projectId: project.id,
      originalName: file.originalname,
      buffer: file.buffer,
    });
    return this.prisma.projectDocument.create({
      data: {
        projectId,
        progressId,
        originalName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        byteSize: file.size,
        storageKey: saved.storageKey,
        uploadedById: auth.userId,
      },
      select: {
        id: true,
        projectId: true,
        progressId: true,
        originalName: true,
        mimeType: true,
        byteSize: true,
        uploadedAt: true,
      },
    });
  }

  async download(auth: AuthContext, documentId: string) {
    const document = await this.prisma.projectDocument.findUnique({ where: { id: documentId } });
    if (!document || !document.isActive) {
      throw new NotFoundException('Document not found.');
    }
    await this.access.requireProject(auth, document.projectId, 'project:read');
    return new StreamableFile(this.storage.open(document.storageKey), {
      type: document.mimeType,
      disposition: `attachment; filename="${document.originalName.replace(/"/g, '')}"`,
    });
  }
}
