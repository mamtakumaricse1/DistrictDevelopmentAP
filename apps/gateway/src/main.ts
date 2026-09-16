import 'reflect-metadata';
import { bootstrapService } from '@ddwmd/common';
import { GatewayModule } from './gateway.module';

void bootstrapService(GatewayModule, {
  service: 'gateway',
  defaultPort: 3000,
  swagger: false,
  bodyParser: false,
});
