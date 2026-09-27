import { Module } from '@nestjs/common';
import { OrganizationCatalogClient } from '../auth/organization-catalog.client';
import { SchemesController } from './schemes.controller';
import { SchemesService } from './schemes.service';

@Module({
  controllers: [SchemesController],
  providers: [SchemesService, OrganizationCatalogClient],
  exports: [SchemesService],
})
export class SchemesModule {}
