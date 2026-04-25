import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyRequiredRole, resolveRbacMetadata } from './rbac-metadata.helper';

const FORBIDDEN_MESSAGE = 'Insufficient role permissions';

type RequestUser = {
  roles?: string[];
};

type RequestWithUser = {
  user?: RequestUser;
};

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { isPublic, requiredRoles } = resolveRbacMetadata(this.reflector, context);

    if (isPublic) {
      return true;
    }

    if (requiredRoles.length === 0) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];

    if (!hasAnyRequiredRole(requiredRoles, userRoles)) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return true;
  }
}
