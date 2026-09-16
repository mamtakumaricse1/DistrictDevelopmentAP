import { Module } from '@nestjs/common';
import { ProjectAccessService } from '../projects/project-access.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ProjectAccessService],
})
export class DashboardModule {}
