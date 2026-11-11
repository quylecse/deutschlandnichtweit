import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service.js';
import { Role, User } from '../user/types/user.interface.js';
import { UserService } from '../user/user.service.js';
import { AuthSessionsService } from './auth-sessions.service.js';
import {
  BaseAuthDto,
  SigninDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto.js';
import { PendingLinksRepository } from './pending-links.repository.js';
import {
  REFRESH_TOKEN_TTL_MS,
  VERIFY_LINK_TTL_MS,
} from './constants/auth.constants.js';
import {
  generateRefreshToken,
  generateVerificationToken,
  hashToken,
} from './utils/crypto.util.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly pendingLinksRepo: PendingLinksRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  async signUp(signUpDto: SignupDto): Promise<{ code: string }> {
    const email = signUpDto.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(signUpDto.password, 10);

    // Kiểm tra xem email đã được đăng ký trước đó chưa
    const existingUser = await this.userService.findByEmailWithPassword(email);

    if (existingUser) {
      // Trường hợp 1: Tài khoản đã kích hoạt email -> Chặn đăng ký trùng
      if (existingUser.emailVerified) {
        throw new ConflictException('EMAIL_ALREADY_EXISTS');
      }

      // Trường hợp 2: Tài khoản đã đăng ký nhưng CHƯA kích hoạt (link hết hạn hoặc mất mail)
      // Cập nhật lại mật khẩu mới và gửi lại email xác thực (tránh kẹt/treo tài khoản)
      await this.userService.updatePassword(existingUser.id, passwordHash);
      await this.pendingLinksRepo.clearExistingTokens(existingUser.id, 'VERIFY_EMAIL');

      try {
        const verifyToken = generateVerificationToken();
        await this.pendingLinksRepo.create(
          verifyToken,
          existingUser.id,
          'VERIFY_EMAIL',
          VERIFY_LINK_TTL_MS,
        );
        await this.mailService.sendVerificationEmail(existingUser.email, verifyToken);

        return { code: 'SIGNUP_SUCCESS' };
      } catch (error) {
        console.error('Lỗi khi gửi lại email xác thực cho tài khoản chưa kích hoạt:', error);
        await this.pendingLinksRepo
          .clearExistingTokens(existingUser.id, 'VERIFY_EMAIL')
          .catch((err: unknown) => {
            console.error('CRITICAL: FAILED_TO_ROLLBACK_PENDING_LINK', err);
          });
        throw new InternalServerErrorException('SIGNUP_FAILED');
      }
    }

    // =======================================================
    // BƯỚC 1: TẠO USER MỚI
    // =======================================================
    const user = await this.userService.createUser(
      email,
      passwordHash,
    );

    if (!user) {
      throw new BadRequestException('USER_CREATION_FAILED');
    }

    // =======================================================
    // BƯỚC 2: CÁC TÁC VỤ PHỤ THUỘC (Lỗi ở đây PHẢI rollback)
    // =======================================================
    try {
      const verifyToken = generateVerificationToken();
      await this.pendingLinksRepo.create(
        verifyToken,
        user.id,
        'VERIFY_EMAIL',
        VERIFY_LINK_TTL_MS,
      );
      await this.mailService.sendVerificationEmail(user.email, verifyToken);

      // Trả về mã thành công chuẩn hóa (Rule 14)
      return { code: 'SIGNUP_SUCCESS' };
    } catch (error) {
      console.error(
        'Lỗi khi tạo token/email, tiến hành rollback user...',
        error,
      );

      // Compensating Transaction (Rule 13): Xóa user nếu gửi mail thất bại
      await this.userService.removeAccount(user.id).catch((err: unknown) => {
        console.error('CRITICAL: FAILED_TO_ROLLBACK_USER', err);
      });

      throw new InternalServerErrorException('SIGNUP_FAILED');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ code: string }> {
    const { verifyToken } = verifyEmailDto;

    // 1. Xác thực và tiêu thụ token (Single-use token: Xóa ngay lập tức khỏi DB chống Replay Attack)
    const userId = await this.pendingLinksRepo.consumeToken(
      verifyToken,
      'VERIFY_EMAIL',
    );

    if (!userId) {
      throw new BadRequestException('LINK_NOT_FOUND_OR_EXPIRED');
    }

    // 2. Kích hoạt trạng thái người dùng trong bảng users thông qua UserService
    await this.userService.verifyEmail(userId);

    // 3. Trả về mã thành công chuẩn hóa (Rule 14)
    return { code: 'EMAIL_VERIFIED_SUCCESS' };
  }

  async resendVerificationEmail(dto: BaseAuthDto): Promise<{ code: string }> {
    const { email } = dto;
    const user = await this.userService.findByEmailWithPassword(email);

    // Chống User Enumeration (OWASP):
    // Dù user không tồn tại hoặc đã kích hoạt, vẫn trả về cùng 1 mã thành công giả lập
    if (!user || user.emailVerified) {
      return { code: 'VERIFICATION_EMAIL_SENT' };
    }

    // Dọn dẹp các token cũ nếu có trước khi tạo token mới
    await this.pendingLinksRepo.clearExistingTokens(user.id, 'VERIFY_EMAIL');

    const verifyToken = generateVerificationToken();

    try {
      await this.pendingLinksRepo.create(
        verifyToken,
        user.id,
        'VERIFY_EMAIL',
        VERIFY_LINK_TTL_MS,
      );
      await this.mailService.sendVerificationEmail(email, verifyToken);

      return { code: 'VERIFICATION_EMAIL_SENT' };
    } catch (error) {
      console.error('CRITICAL: RESEND_VERIFICATION_FAILED', error);

      // Compensating Transaction: Xóa token vừa tạo nếu gửi mail thất bại
      await this.pendingLinksRepo
        .clearExistingTokens(user.id, 'VERIFY_EMAIL')
        .catch((err) => {
          console.error('CRITICAL: FAILED_TO_ROLLBACK_PENDING_LINK', err);
        });

      throw new InternalServerErrorException('RESEND_VERIFICATION_FAILED');
    }
  }

  async signIn(
    signInDto: SigninDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; roles: Role[]; emailVerified: boolean };
  }> {
    const { email, password } = signInDto;

    // 1. Tìm User kèm password hash
    const user = await this.userService.findByEmailWithPassword(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 2. Đối soát mật khẩu với bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 3. Kiểm tra điều kiện tiên quyết: Email đã kích hoạt chưa?
    if (!user.emailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }

    // 4. Ký Access Token (JWT - 15 phút)
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // 5. Sinh Refresh Token ngẫu nhiên (chuỗi an toàn 80 ký tự hex) & Băm SHA-256
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);

    // 6. Lưu phiên vào bảng auth_sessions (thời hạn 7 ngày)
    await this.authSessionsService.createSession(
      user.id,
      refreshTokenHash,
      REFRESH_TOKEN_TTL_MS,
      userAgent,
      ipAddress,
    );

    // 7. Trả về token và user để Controller ghi Cookie và phản hồi cho Client
    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Cấp lại Access Token mới và xoay vòng Refresh Token (Token Rotation)
   */
  async refreshTokens(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; roles: Role[]; emailVerified: boolean };
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('REFRESH_TOKEN_REQUIRED');
    }

    // 1. Băm SHA-256 token nhận từ Cookie
    const refreshTokenHash = hashToken(rawRefreshToken);

    // 2. Tra cứu Session trong DB theo hash
    const session = await this.authSessionsService.findSessionByTokenHash(
      refreshTokenHash,
    );

    // Không tìm thấy session nào khớp với token này -> Token rác / giả mạo
    if (!session) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    // 3. PHÁT HIỆN TOKEN REUSE (OWASP Token Reuse Detection):
    // Nếu session này đã bị thu hồi (isRevoked = true) mà token này vẫn được gửi lên!
    if (session.isRevoked) {
      console.warn(
        `SECURITY ALERT: TOKEN_REUSE_DETECTED for userId: ${session.userId}. Revoking all sessions!`,
      );
      // Thu hồi khẩn cấp TOÀN BỘ phiên của user này để bảo vệ tài khoản
      await this.authSessionsService.revokeAllSessions(session.userId);
      throw new UnauthorizedException('COMPROMISED_SESSION_DETECTED');
    }

    // 4. Kiểm tra hạn sử dụng của Session
    if (new Date(session.expiresAt) <= new Date()) {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }

    // 5. Kiểm tra user còn tồn tại không
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    // 6. THỰC HIỆN TOKEN ROTATION:
    // Thu hồi session cũ
    await this.authSessionsService.revokeSession(session.id);

    // Ký Access Token mới (15 phút)
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const newAccessToken = await this.jwtService.signAsync(payload);

    // Sinh Refresh Token mới (80 ký tự hex) & Băm SHA-256
    const newRawRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    // Tạo Session mới (7 ngày)
    await this.authSessionsService.createSession(
      user.id,
      newRefreshTokenHash,
      REFRESH_TOKEN_TTL_MS,
      userAgent,
      ipAddress,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Đăng xuất: Thu hồi phiên đăng nhập trong DB
   */
  async logout(rawRefreshToken?: string): Promise<{ code: string }> {
    if (!rawRefreshToken) {
      return { code: 'LOGOUT_SUCCESS' };
    }

    const refreshTokenHash = hashToken(rawRefreshToken);

    const session = await this.authSessionsService.findSessionByTokenHash(
      refreshTokenHash,
    );

    if (session) {
      await this.authSessionsService.revokeSession(session.id);
    }

    return { code: 'LOGOUT_SUCCESS' };
  }

  /**
   * Lấy thông tin hồ sơ của người dùng đang đăng nhập
   * @param userId ID của người dùng trích xuất từ Access Token
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return user;
  }
}
