import { Module } from '@nestjs/common';
import { ProjectAccessService } from '../projects/project-access.service';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressService, ProjectAccessService],
})
export class ProgressModule {}
