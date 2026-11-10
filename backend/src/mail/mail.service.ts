import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_API_KEY');

    if (mailUser && mailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailUser,
          pass: mailPass,
        },
        connectionTimeout: 5000, // Timeout 5s chống treo socket
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    }
  }

  async sendVerificationEmail(toEmail: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/auth/verify?token=${token}`;
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    const mailUser =
      this.configService.get<string>('MAIL_USER') || 'deutschlandnichtweit@gmail.com';

    const htmlContent = `
      <div style="font-family: sans-serif; padding: 24px; line-height: 1.6; color: #111111; max-width: 500px; margin: 0 auto; border: 1px solid #111111;">
        <h2 style="margin-top: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.05em;">Deutschland Nicht Weit</h2>
        <p style="font-size: 14px; margin-bottom: 20px;">
          Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn. Liên kết này có hiệu lực trong <strong>15 phút</strong>:
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${verifyLink}" style="background-color: #111111; color: #F6F5F0; padding: 12px 28px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
            Xác thực Email →
          </a>
        </div>
        <p style="font-size: 12px; color: #6E6D68; margin-top: 24px; border-top: 1px solid #E5E5E5; pt: 16px;">
          Nếu nút trên không phản hồi, bạn hãy copy đường dẫn sau và dán vào trình duyệt:<br/>
          <a href="${verifyLink}" style="color: #111111; word-break: break-all;">${verifyLink}</a>
        </p>
      </div>
    `;

    // 1. ƯU TIÊN: Gửi qua Brevo HTTP API (Port 443 HTTPS - Hoạt động 100% trên Render Free Tier bằng Gmail)
    if (brevoApiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey.trim(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: 'Deutschland Nicht Weit',
              email: mailUser,
            },
            to: [{ email: toEmail }],
            subject: 'Xác thực tài khoản của bạn - Deutschland Nicht Weit',
            htmlContent,
          }),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          this.logger.error(`Brevo API Error (${res.status}): ${errorBody}`);
          throw new Error('SEND_EMAIL_FAILED');
        }

        this.logger.log(`Email xác thực đã gửi thành công qua Brevo HTTPS tới ${toEmail}`);
        return;
      } catch (err) {
        this.logger.error('Lỗi khi gửi email qua Brevo HTTP API:', err);
        throw new Error('SEND_EMAIL_FAILED');
      }
    }

    // 2. DỰ PHÒNG: Gửi qua Nodemailer (Cho môi trường Localhost)
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Deutschland Nicht Weit" <${mailUser}>`,
          to: toEmail,
          subject: 'Xác thực tài khoản của bạn - Deutschland Nicht Weit',
          html: htmlContent,
        });
        this.logger.log(`Email xác thực đã gửi thành công qua Nodemailer tới ${toEmail}`);
        return;
      } catch (error) {
        this.logger.error('Lỗi khi gửi email bằng Nodemailer:', error);
        throw new Error('SEND_EMAIL_FAILED');
      }
    }

    this.logger.error('Chưa cấu hình BREVO_API_KEY hoặc MAIL_USER/MAIL_API_KEY');
    throw new Error('MAIL_SERVICE_NOT_CONFIGURED');
  }
}
