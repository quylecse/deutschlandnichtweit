import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        secret:
            configService.get<string>('JWT_SECRET') ||
            'dev_jwt_secret_key_32_bytes_fallback',
        signOptions: { expiresIn: '15m' },
    }),
};