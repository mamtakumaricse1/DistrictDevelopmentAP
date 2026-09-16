import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InternalIssuersController } from './internal-issuers.controller';

@Module({
  controllers: [AuthController, InternalIssuersController],
  providers: [AuthService],
})
export class AuthHttpModule {}
