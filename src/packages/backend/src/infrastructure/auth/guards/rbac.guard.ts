import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyRequiredRole, resolveRbacMetadata } from './rbac-metadata.helper';

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

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];

    if (requiredRoles.length === 0) {
      throw new ForbiddenException(JSON.stringify({
        message: 'Insufficient role permissions',
        required: [],
        actual: userRoles
      }));
    }

    if (!hasAnyRequiredRole(requiredRoles, userRoles)) {
      throw new ForbiddenException(JSON.stringify({
        message: 'Insufficient role permissions',
        required: requiredRoles,
        actual: userRoles
      }));
    }

    return true;
  }
}
