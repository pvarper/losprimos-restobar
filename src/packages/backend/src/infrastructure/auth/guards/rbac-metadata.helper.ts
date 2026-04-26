import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { REQUIRED_ROLES_KEY } from '../decorators/roles.decorator';

export type RbacMetadata = {
  isPublic: boolean;
  requiredRoles: string[];
};

const resolvePublicMetadata = (reflector: Reflector, context: ExecutionContext): boolean => {
  return reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) ?? false;
};

const resolveRequiredRolesMetadata = (reflector: Reflector, context: ExecutionContext): string[] => {
  return reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) ?? [];
};

export const resolveRbacMetadata = (reflector: Reflector, context: ExecutionContext): RbacMetadata => {
  return {
    isPublic: resolvePublicMetadata(reflector, context),
    requiredRoles: resolveRequiredRolesMetadata(reflector, context),
  };
};

export const hasAnyRequiredRole = (requiredRoles: string[], userRoles: string[]): boolean => {
  return requiredRoles.some((requiredRole) => userRoles.includes(requiredRole));
};
