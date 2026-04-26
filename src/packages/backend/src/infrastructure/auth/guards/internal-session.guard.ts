import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResolveSessionUseCase } from '../../../identity-access/application/use-cases/resolve-session.use-case';
import { PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { IDENTITY_ACCESS_TOKENS } from '../../../identity-access/identity-access.tokens';

type RequestWithHeadersAndUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: { internalSessionId?: string; [key: string]: unknown };
};

@Injectable()
export class InternalSessionGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_ACCESS_TOKENS.resolveSessionUseCase)
    private readonly resolveSessionUseCase: ResolveSessionUseCase,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithHeadersAndUser>();
    
    // Sesión no se lee del cliente web, sino del payload validado por ApiKey
    const internalSessionId = request.user?.internalSessionId;

    if (typeof internalSessionId !== 'string' || internalSessionId.trim().length === 0) {
      throw new UnauthorizedException('Missing internal session ID in context');
    }

    const session = await this.resolveSessionUseCase.execute({
      action: 'resolve',
      sessionId: internalSessionId.trim(),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid internal session');
    }

    return true;
  }
}
