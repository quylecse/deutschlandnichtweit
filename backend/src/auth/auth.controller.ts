import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  BaseAuthDto,
  SigninDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto.js';
import type { Request, Response } from 'express';
import { clearAuthCookies, setAuthCookies } from './utils/cookie.util.js';
import { REFRESH_TOKEN_COOKIE_NAME } from './constants/auth.constants.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignupDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() baseAuthDto: BaseAuthDto) {
    return await this.authService.resendVerificationEmail(baseAuthDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SigninDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(
      signInDto,
      userAgent,
      ipAddress,
    );

    // Thiết lập Cookie HttpOnly chuẩn bảo mật OWASP
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // Trả về mã thành công chuẩn hóa và thông tin User
    return {
      code: 'LOGIN_SUCCESS',
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    const result = await this.authService.refreshTokens(
      rawRefreshToken,
      userAgent,
      ipAddress,
    );

    // Xoay vòng Refresh Token & Cấp lại Access Token vào Cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      code: 'TOKEN_REFRESHED_SUCCESS',
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    await this.authService.logout(rawRefreshToken);

    // Xóa sạch cookie HttpOnly trên trình duyệt
    clearAuthCookies(res);

    return {
      code: 'LOGOUT_SUCCESS',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.getProfile(user.id);
    return {
      user: profile,
    };
  }
}

