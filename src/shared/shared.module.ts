import { Module, Global } from '@nestjs/common';
import { VendorClientService } from './services/vendor-client.service';

@Global()
@Module({
  providers: [VendorClientService],
  exports: [VendorClientService],
})
export class SharedModule {}
