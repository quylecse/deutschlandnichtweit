import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE_NAME } from '../constants/auth.constants.js';
import {
    AuthenticatedRequest,
    JwtPayload,
} from './jwt-auth.guard.js';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractToken(request);

        if (!token) {
            return true; // Khách vãng lai -> Vẫn cho qua
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
            request.user = {
                id: payload.sub,
                email: payload.email,
                roles: payload.roles,
            };
        } catch {
            // Token hết hạn hoặc không hợp lệ -> Coi như khách vãng lai, không chặn
            request.user = undefined;
        }

        return true;
    }

    private extractToken(request: Request): string | undefined {
        if (request.cookies?.[ACCESS_TOKEN_COOKIE_NAME]) {
            return request.cookies[ACCESS_TOKEN_COOKIE_NAME];
        }
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return undefined;
    }
}