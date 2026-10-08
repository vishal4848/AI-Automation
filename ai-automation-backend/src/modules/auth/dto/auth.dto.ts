import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class SendOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  purpose?: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  code: string;

  @IsString()
  @IsOptional()
  purpose?: string;
}

export class ResendOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  purpose?: string;
}
