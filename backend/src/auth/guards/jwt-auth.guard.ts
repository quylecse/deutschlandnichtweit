import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE_NAME } from '../constants/auth.constants.js';
import { Role } from '../../user/types/user.interface.js';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    try {
      // Xác thực chữ ký và kiểm tra thời hạn sống của token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Gắn thông tin người dùng vào request để Controller và Decorator có thể dùng
      request.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };

      return true;
    } catch {
      throw new UnauthorizedException('INVALID_OR_EXPIRED_TOKEN');
    }
  }

  /**
   * Bóc tách Token từ Cookie (ưu tiên) hoặc Header Authorization
   */
  private extractToken(request: Request): string | undefined {
    // 1. Kiểm tra trong HttpOnly Cookie
    if (request.cookies?.[ACCESS_TOKEN_COOKIE_NAME]) {
      return request.cookies[ACCESS_TOKEN_COOKIE_NAME];
    }

    // 2. Dự phòng: Kiểm tra Header Authorization (Bearer <token>)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }
}

