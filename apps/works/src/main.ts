import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { WorksModule } from './works.module';

void bootstrapService(WorksModule, { service: 'works', defaultPort: 3003 });
