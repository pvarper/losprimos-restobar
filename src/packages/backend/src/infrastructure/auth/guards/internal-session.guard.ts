import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ResolveSessionUseCase } from '../../../identity-access/application/use-cases/resolve-session.use-case';
import { IDENTITY_ACCESS_TOKENS } from '../../../identity-access/identity-access.tokens';

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class InternalSessionGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_ACCESS_TOKENS.resolveSessionUseCase)
    private readonly resolveSessionUseCase: ResolveSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const sessionHeader = request.headers['x-session-id'];

    if (typeof sessionHeader !== 'string' || sessionHeader.trim().length === 0) {
      throw new UnauthorizedException('Missing internal session');
    }

    const session = await this.resolveSessionUseCase.execute({
      action: 'resolve',
      sessionId: sessionHeader.trim(),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid internal session');
    }

    return true;
  }
}
