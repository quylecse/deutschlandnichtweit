import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { PendingLinksRepository } from './pending-links.repository.js';
import { AuthSessionsService } from './auth-sessions.service.js';
import { MailService } from '../mail/mail.service.js';
import { SignupDto, VerifyEmailDto, BaseAuthDto, SigninDto } from './dto/auth.dto.js';
import { User, UserWithPassword } from '../user/types/user.interface.js';
import { AuthSessionWithHash } from './auth-sessions.repository.js';

// Mock bcrypt và crypto helper
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('mock-password-hash'),
  compare: vi.fn(),
}));

vi.mock('./utils/crypto.util.js', () => ({
  generateVerificationToken: vi.fn().mockReturnValue('mock-verification-token-64-hex'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token-80-hex'),
  hashToken: vi.fn().mockReturnValue('mock-sha256-hash-value'),
}));

describe('AuthService - Complete Auth Flow', () => {
  let authService: AuthService;
  let userService: {
    createUser: ReturnType<typeof vi.fn>;
    removeAccount: ReturnType<typeof vi.fn>;
    verifyEmail: ReturnType<typeof vi.fn>;
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let pendingLinksRepo: {
    create: ReturnType<typeof vi.fn>;
    consumeToken: ReturnType<typeof vi.fn>;
    clearExistingTokens: ReturnType<typeof vi.fn>;
  };
  let mailService: {
    sendVerificationEmail: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
  };
  let authSessionsService: {
    createSession: ReturnType<typeof vi.fn>;
    findSessionByTokenHash: ReturnType<typeof vi.fn>;
    revokeSession: ReturnType<typeof vi.fn>;
    revokeAllSessions: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@example.com',
    emailVerified: false,
    roles: ['user'],
  };

  beforeEach(async () => {
    userService = {
      createUser: vi.fn(),
      removeAccount: vi.fn(),
      verifyEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findById: vi.fn(),
    };

    pendingLinksRepo = {
      create: vi.fn(),
      consumeToken: vi.fn(),
      clearExistingTokens: vi.fn(),
    };

    mailService = {
      sendVerificationEmail: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-access-token-jwt'),
    };

    authSessionsService = {
      createSession: vi.fn().mockResolvedValue('mock-session-id-uuid'),
      findSessionByTokenHash: vi.fn(),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeAllSessions: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: PendingLinksRepository, useValue: pendingLinksRepo },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthSessionsService, useValue: authSessionsService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. NHÓM TEST: signUp (Đăng ký tài khoản)
  // ===========================================================================
  describe('signUp', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
    };

    it('nên tạo user thành công, lưu token xác thực và gửi email', async () => {
      userService.createUser.mockResolvedValue(mockUser);
      pendingLinksRepo.create.mockResolvedValue(undefined);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      await authService.signUp(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(userService.createUser).toHaveBeenCalledWith(
        signupDto.email,
        'mock-password-hash',
      );
      expect(pendingLinksRepo.create).toHaveBeenCalledWith(
        'mock-verification-token-64-hex',
        mockUser.id,
        'VERIFY_EMAIL',
        15 * 60 * 1000,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        'mock-verification-token-64-hex',
      );
    });

    it('nếu email đã tồn tại (UserService ném lỗi), không thực hiện rollback xóa user', async () => {
      userService.createUser.mockRejectedValue(
        new ConflictException('EMAIL_ALREADY_EXISTS'),
      );

      await expect(authService.signUp(signupDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.removeAccount).not.toHaveBeenCalled();
      expect(pendingLinksRepo.create).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('nếu gửi email thất bại, phải kích hoạt Compensating Transaction để rollback xóa user', async () => {
      userService.createUser.mockResolvedValue(mockUser);
      pendingLinksRepo.create.mockResolvedValue(undefined);
      mailService.sendVerificationEmail.mockRejectedValue(
        new Error('SMTP_CONNECTION_REFUSED'),
      );
      userService.removeAccount.mockResolvedValue(undefined);

      await expect(authService.signUp(signupDto)).rejects.toThrow(
        new InternalServerErrorException('SIGNUP_FAILED'),
      );

      expect(userService.removeAccount).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ===========================================================================
  // 2. NHÓM TEST: verifyEmail (Kích hoạt tài khoản qua Token)
  // ===========================================================================
  describe('verifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = {
      verifyToken: 'a'.repeat(64),
    };

    it('nên tiêu thụ token, kích hoạt user và trả về EMAIL_VERIFIED_SUCCESS', async () => {
      pendingLinksRepo.consumeToken.mockResolvedValue(mockUser.id);
      userService.verifyEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      const result = await authService.verifyEmail(verifyEmailDto);

      expect(pendingLinksRepo.consumeToken).toHaveBeenCalledWith(
        verifyEmailDto.verifyToken,
        'VERIFY_EMAIL',
      );
      expect(userService.verifyEmail).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ code: 'EMAIL_VERIFIED_SUCCESS' });
    });

    it('nếu token không tồn tại hoặc đã hết hạn, phải ném lỗi LINK_NOT_FOUND_OR_EXPIRED', async () => {
      pendingLinksRepo.consumeToken.mockResolvedValue(null);

      await expect(authService.verifyEmail(verifyEmailDto)).rejects.toThrow(
        new BadRequestException('LINK_NOT_FOUND_OR_EXPIRED'),
      );
      expect(userService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 3. NHÓM TEST: resendVerificationEmail (Gửi lại email kích hoạt)
  // ===========================================================================
  describe('resendVerificationEmail', () => {
    const dto: BaseAuthDto = {
      email: 'test@example.com',
    };

    it('chống User Enumeration: nếu email không tồn tại, vẫn trả về VERIFICATION_EMAIL_SENT', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      const result = await authService.resendVerificationEmail(dto);

      expect(result).toEqual({ code: 'VERIFICATION_EMAIL_SENT' });
      expect(pendingLinksRepo.create).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('chống User Enumeration: nếu user đã xác thực trước đó, vẫn trả về VERIFICATION_EMAIL_SENT', async () => {
      const verifiedUser: UserWithPassword = {
        ...mockUser,
        emailVerified: true,
        passwordHash: 'hash',
      };
      userService.findByEmailWithPassword.mockResolvedValue(verifiedUser);

      const result = await authService.resendVerificationEmail(dto);

      expect(result).toEqual({ code: 'VERIFICATION_EMAIL_SENT' });
      expect(pendingLinksRepo.create).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('nếu user hợp lệ và chưa kích hoạt, xóa token cũ, sinh token mới và gửi email', async () => {
      const unverifiedUser: UserWithPassword = {
        ...mockUser,
        emailVerified: false,
        passwordHash: 'hash',
      };
      userService.findByEmailWithPassword.mockResolvedValue(unverifiedUser);
      pendingLinksRepo.clearExistingTokens.mockResolvedValue(undefined);
      pendingLinksRepo.create.mockResolvedValue(undefined);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await authService.resendVerificationEmail(dto);

      expect(pendingLinksRepo.clearExistingTokens).toHaveBeenCalledWith(
        mockUser.id,
        'VERIFY_EMAIL',
      );
      expect(pendingLinksRepo.create).toHaveBeenCalledWith(
        'mock-verification-token-64-hex',
        mockUser.id,
        'VERIFY_EMAIL',
        15 * 60 * 1000,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        'mock-verification-token-64-hex',
      );
      expect(result).toEqual({ code: 'VERIFICATION_EMAIL_SENT' });
    });

    it('nếu gửi mail thất bại, kích hoạt Compensating Transaction để dọn token vừa tạo', async () => {
      const unverifiedUser: UserWithPassword = {
        ...mockUser,
        emailVerified: false,
        passwordHash: 'hash',
      };
      userService.findByEmailWithPassword.mockResolvedValue(unverifiedUser);
      pendingLinksRepo.clearExistingTokens.mockResolvedValue(undefined);
      pendingLinksRepo.create.mockResolvedValue(undefined);
      mailService.sendVerificationEmail.mockRejectedValue(
        new Error('SMTP_OFFLINE'),
      );

      await expect(authService.resendVerificationEmail(dto)).rejects.toThrow(
        new InternalServerErrorException('RESEND_VERIFICATION_FAILED'),
      );

      expect(pendingLinksRepo.clearExistingTokens).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // 4. NHÓM TEST: signIn (Đăng nhập tài khoản & Cấp Session)
  // ===========================================================================
  describe('signIn', () => {
    const signinDto: SigninDto = {
      email: 'test@example.com',
      password: 'CorrectPassword123!',
    };

    const verifiedUser: UserWithPassword = {
      ...mockUser,
      emailVerified: true,
      passwordHash: 'valid-bcrypt-hash',
    };

    it('đăng nhập thành công: kiểm tra mật khẩu, ký Access Token và tạo Session', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(verifiedUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.signIn(
        signinDto,
        'Mozilla/5.0 Chrome',
        '127.0.0.1',
      );

      expect(userService.findByEmailWithPassword).toHaveBeenCalledWith(
        signinDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        verifiedUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: verifiedUser.id,
        email: verifiedUser.email,
        roles: verifiedUser.roles,
      });
      expect(authSessionsService.createSession).toHaveBeenCalledWith(
        verifiedUser.id,
        'mock-sha256-hash-value',
        7 * 24 * 60 * 60 * 1000,
        'Mozilla/5.0 Chrome',
        '127.0.0.1',
      );
      expect(result).toEqual({
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token-80-hex',
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          roles: verifiedUser.roles,
          emailVerified: verifiedUser.emailVerified,
        },
      });
    });

    it('chống User Enumeration: nếu email không tồn tại hoặc không có hash, ném INVALID_CREDENTIALS', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.signIn(signinDto)).rejects.toThrow(
        new UnauthorizedException('INVALID_CREDENTIALS'),
      );
    });

    it('nếu sai mật khẩu, ném INVALID_CREDENTIALS', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(verifiedUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.signIn(signinDto)).rejects.toThrow(
        new UnauthorizedException('INVALID_CREDENTIALS'),
      );
    });

    it('nếu mật khẩu đúng nhưng chưa kích hoạt email, ném EMAIL_NOT_VERIFIED', async () => {
      const unverifiedUser: UserWithPassword = {
        ...mockUser,
        emailVerified: false,
        passwordHash: 'valid-bcrypt-hash',
      };
      userService.findByEmailWithPassword.mockResolvedValue(unverifiedUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(authService.signIn(signinDto)).rejects.toThrow(
        new ForbiddenException('EMAIL_NOT_VERIFIED'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(authSessionsService.createSession).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 5. NHÓM TEST: refreshTokens (Token Rotation & Token Reuse Detection)
  // ===========================================================================
  describe('refreshTokens', () => {
    const rawToken = 'sample-refresh-token';
    const activeSession: AuthSessionWithHash = {
      id: 'session-uuid-123',
      userId: mockUser.id,
      userAgent: 'Chrome',
      ipAddress: '127.0.0.1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 1000000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refreshTokenHash: 'mock-sha256-hash-value',
    };

    it('thành công: thu hồi session cũ, tạo session mới và cấp Access Token mới', async () => {
      authSessionsService.findSessionByTokenHash.mockResolvedValue(activeSession);
      userService.findById.mockResolvedValue(mockUser);

      const result = await authService.refreshTokens(rawToken);

      expect(authSessionsService.revokeSession).toHaveBeenCalledWith(activeSession.id);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
      });
      expect(authSessionsService.createSession).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token-80-hex',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          roles: mockUser.roles,
          emailVerified: mockUser.emailVerified,
        },
      });
    });

    it('OWASP Token Reuse Detection: nếu token đã bị thu hồi, thu hồi TẤT CẢ sessions của user', async () => {
      const compromisedSession = { ...activeSession, isRevoked: true };
      authSessionsService.findSessionByTokenHash.mockResolvedValue(compromisedSession);

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(
        new UnauthorizedException('COMPROMISED_SESSION_DETECTED'),
      );

      // Kích hoạt phản ứng an ninh khẩn cấp: thu hồi toàn bộ sessions
      expect(authSessionsService.revokeAllSessions).toHaveBeenCalledWith(mockUser.id);
    });

    it('nếu session đã hết hạn, ném SESSION_EXPIRED', async () => {
      const expiredSession = {
        ...activeSession,
        expiresAt: new Date(Date.now() - 1000000).toISOString(),
      };
      authSessionsService.findSessionByTokenHash.mockResolvedValue(expiredSession);

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(
        new UnauthorizedException('SESSION_EXPIRED'),
      );
    });

    it('nếu không tìm thấy session nào khớp với token, ném INVALID_REFRESH_TOKEN', async () => {
      authSessionsService.findSessionByTokenHash.mockResolvedValue(null);

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(
        new UnauthorizedException('INVALID_REFRESH_TOKEN'),
      );
    });
  });

  // ===========================================================================
  // 6. NHÓM TEST: logout (Đăng xuất)
  // ===========================================================================
  describe('logout', () => {
    it('thu hồi session tương ứng và trả về LOGOUT_SUCCESS', async () => {
      const activeSession: AuthSessionWithHash = {
        id: 'session-uuid-123',
        userId: mockUser.id,
        userAgent: 'Chrome',
        ipAddress: '127.0.0.1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        refreshTokenHash: 'mock-sha256-hash-value',
      };
      authSessionsService.findSessionByTokenHash.mockResolvedValue(activeSession);

      const result = await authService.logout('raw-token');

      expect(authSessionsService.revokeSession).toHaveBeenCalledWith(activeSession.id);
      expect(result).toEqual({ code: 'LOGOUT_SUCCESS' });
    });

    it('nếu không có token truyền vào, vẫn trả về LOGOUT_SUCCESS', async () => {
      const result = await authService.logout(undefined);
      expect(result).toEqual({ code: 'LOGOUT_SUCCESS' });
      expect(authSessionsService.revokeSession).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 7. NHÓM TEST: getProfile (Lấy hồ sơ người dùng hiện tại)
  // ===========================================================================
  describe('getProfile', () => {
    it('thành công: trả về thông tin User nếu tìm thấy', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await authService.getProfile(mockUser.id);

      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('nếu không tìm thấy user, ném NotFoundException với mã USER_NOT_FOUND', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(
        new NotFoundException('USER_NOT_FOUND'),
      );
    });
  });
});
