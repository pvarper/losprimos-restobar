import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ResolveSessionUseCase } from '../../../identity-access/application/use-cases/resolve-session.use-case';

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class InternalSessionGuard implements CanActivate {
  constructor(private readonly resolveSessionUseCase: ResolveSessionUseCase) {}

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
