import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ==========================================
// SEC-05: Role-Based Access Control (RBAC) Guard
// ==========================================

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint
 * Usage: @Roles(Role.ADMIN) or @Roles(Role.ADMIN, Role.USER)
 */
export const Roles = (...roles: Role[]) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(ROLES_KEY, roles, target);
    return target;
  };
};

/**
 * Decorator for admin-only endpoints
 * Shorthand for @Roles(Role.ADMIN)
 */
export const AdminOnly = () => Roles(Role.ADMIN);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JWT auth guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has required role
    const userRole = user.isAdmin ? Role.ADMIN : Role.USER;
    const hasRole = requiredRoles.some((role) => role === userRole || role === Role.USER);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`
      );
    }

    return true;
  }
}
