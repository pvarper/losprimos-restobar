import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../infrastructure/auth/decorators/public.decorator';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('identity-access')
export class IdentityAccessController {
  @Public()
  @Get('public/ping')
  ping(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Roles('admin', 'cajero')
  @Get('protected/admin-cajero')
  protectedAdminCajero(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
