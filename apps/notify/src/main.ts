import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { NotifyModule } from './notify.module';

void bootstrapService(NotifyModule, { service: 'notify', defaultPort: 3005 });
