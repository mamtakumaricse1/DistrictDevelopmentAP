import { Module } from '@nestjs/common';
import { IdentityDirectoryClient } from '../auth/identity-directory.client';
import { DistrictsController } from './districts.controller';
import { DistrictsService } from './districts.service';

@Module({
  controllers: [DistrictsController],
  providers: [DistrictsService, IdentityDirectoryClient],
  exports: [DistrictsService],
})
export class DistrictsModule {}
