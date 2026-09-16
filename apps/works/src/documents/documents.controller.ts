import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('projects/:projectId/documents')
  @RequirePermissions('project:read')
  @ApiOperation({ summary: 'List documents for a project' })
  list(@CurrentUser() auth: AuthContext, @Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.documents.list(auth, projectId);
  }

  @Post('projects/:projectId/documents')
  @RequirePermissions('document:upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload a photo or PDF (stored on disk, not in PostgreSQL)' })
  upload(
    @CurrentUser() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
    @Query('progressId') progressId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }
    return this.documents.upload(auth, projectId, file, progressId);
  }

  @Get('documents/:id/file')
  @RequirePermissions('project:read')
  @ApiOperation({ summary: 'Download a document file' })
  download(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.download(auth, id);
  }
}
