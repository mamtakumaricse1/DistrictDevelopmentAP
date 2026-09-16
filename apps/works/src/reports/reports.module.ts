import { Module } from '@nestjs/common';
import { ProjectAccessService } from '../projects/project-access.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ProjectAccessService],
})
export class ReportsModule {}
