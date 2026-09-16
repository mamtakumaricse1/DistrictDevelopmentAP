import { Module } from '@nestjs/common';
import { ProjectAccessService } from '../projects/project-access.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, ProjectAccessService, LocalStorageService],
})
export class DocumentsModule {}
