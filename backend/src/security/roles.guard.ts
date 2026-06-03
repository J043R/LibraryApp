import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DatabaseService, UserRecord } from '../database/database.service';
import { ROLES_KEY } from './roles.decorator';
import { TokenService } from './token.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly database: DatabaseService,
    private readonly tokenService: TokenService
  ) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: UserRecord; role?: string }>();
    const payload = this.tokenService.verify(this.getBearerToken(request));
    const user = payload
      ? this.database.get<UserRecord>(
          'SELECT * FROM users WHERE CAST(id AS INTEGER) = ?',
          payload.id
        )
      : undefined;
    const role = user?.role || 'guest';

    request.user = user;
    request.role = role;
    return requiredRoles.includes(role);
  }

  private getBearerToken(request: Request) {
    const authorization = request.headers.authorization || '';
    return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  }
}
