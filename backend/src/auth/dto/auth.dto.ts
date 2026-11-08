import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsHexadecimal,
    IsNotEmpty,
    IsString,
    Length,
    MaxLength,
    MinLength,
} from 'class-validator';

// 1. DTO Cơ sở: Chứa quy tắc chuẩn hóa và kiểm tra email
export class BaseAuthDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;
}

// 2. DTO Đăng nhập: Không ép độ dài tối thiểu mật khẩu (tránh lock user cũ)
export class SigninDto extends BaseAuthDto {
    @MaxLength(72)
    @IsString()
    @IsNotEmpty()
    password: string;
}

// 3. DTO Đăng ký: Kế thừa email, ép mật khẩu tối thiểu 8 ký tự (chuẩn OWASP)
export class SignupDto extends BaseAuthDto {
    @MinLength(8)
    @MaxLength(72)
    @IsString()
    @IsNotEmpty()
    password: string;
}

// 4. DTO Xác thực Email: Token ngẫu nhiên 32 bytes (chuỗi 64 ký tự hex)
export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    @Length(64, 64)
    @IsHexadecimal()
    verifyToken: string;
}