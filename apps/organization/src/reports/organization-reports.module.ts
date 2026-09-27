import { Module } from '@nestjs/common';
import { OrganizationReportsController } from './organization-reports.controller';

@Module({
  controllers: [OrganizationReportsController],
})
export class OrganizationReportsModule {}
