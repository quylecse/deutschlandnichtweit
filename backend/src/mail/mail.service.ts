import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_API_KEY'),
      },
    });
  }

  async sendVerificationEmail(toEmail: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/auth/verify?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: `"Deutschland Nicht Weit" <${this.configService.get<string>('MAIL_USER')}>`,
        to: toEmail,
        subject: 'Xác thực tài khoản của bạn',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Chào mừng bạn đến với hệ thống!</h2>
            <p>Vui lòng click vào nút bên dưới để xác thực địa chỉ email của bạn. Link này có hiệu lực trong 15 phút.</p>
            <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              Xác thực Email
            </a>
            <p>Hoặc copy đường link này dán vào trình duyệt:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Lỗi khi gửi email bằng Nodemailer:', error);
      throw new Error('SEND_EMAIL_FAILED');
    }
  }
}
