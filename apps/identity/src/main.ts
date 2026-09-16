import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { IdentityModule } from './identity.module';

void bootstrapService(IdentityModule, { service: 'identity', defaultPort: 3001 });
