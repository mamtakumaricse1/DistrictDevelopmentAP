import { Module } from '@nestjs/common';
import { OrganizationCatalogClient } from '../auth/organization-catalog.client';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, OrganizationCatalogClient],
})
export class ProjectsModule {}
