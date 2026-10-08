import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required for role verification.');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new ForbiddenException('Account is inactive or not found.');
    }

    const hasRole = requiredRoles.includes(dbUser.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    // Attach verified role to request for downstream handlers
    request.userRole = dbUser.role;
    return true;
  }
}
