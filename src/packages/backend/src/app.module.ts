import { Module } from '@nestjs/common';
import { IdentityAccessModule } from './identity-access/identity-access.module';

@Module({
  imports: [IdentityAccessModule],
})
export class AppModule {}
