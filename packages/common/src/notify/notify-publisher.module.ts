import { Global, Module } from '@nestjs/common';
import { NotifyPublisher } from './notify.publisher';

@Global()
@Module({
  providers: [NotifyPublisher],
  exports: [NotifyPublisher],
})
export class NotifyPublisherModule {}
