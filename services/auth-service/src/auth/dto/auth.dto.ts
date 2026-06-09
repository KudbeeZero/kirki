import { IsEmail, IsString, Length, Matches, IsOptional } from 'class-validator';

/**
 * Request DTOs with strict validation. The global ValidationPipe runs with
 * `whitelist` + `forbidNonWhitelisted`, so any unexpected field is rejected —
 * this is the first line of defence against parameter-pollution attacks.
 */
export class RegisterDto {
  @IsEmail()
  email!: string;

  // Policy is also enforced server-side in PasswordService; this is a fast reject.
  @IsString()
  @Length(12, 128)
  password!: string;

  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Handle must be 3–20 chars: letters, numbers, underscore.',
  })
  handle!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 128)
  password!: string;

  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'MFA code must be 6 digits.' })
  mfaCode?: string;
}

export class PasswordResetRequestDto {
  @IsEmail()
  email!: string;
}

export class PasswordResetConfirmDto {
  @IsString()
  @Length(10, 256)
  token!: string;

  @IsString()
  @Length(12, 128)
  newPassword!: string;
}
