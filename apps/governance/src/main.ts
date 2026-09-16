import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { GovernanceModule } from './governance.module';

void bootstrapService(GovernanceModule, { service: 'governance', defaultPort: 3004 });
