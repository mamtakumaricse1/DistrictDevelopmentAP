import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { OrganizationModule } from './organization.module';

void bootstrapService(OrganizationModule, { service: 'organization', defaultPort: 3002 });
