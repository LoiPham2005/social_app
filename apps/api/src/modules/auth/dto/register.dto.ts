import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { RegisterDto as IRegisterDto } from '@social/shared';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'alice', description: '3-20 chars, a-z 0-9 _' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username may only contain letters, numbers and underscore',
  })
  username!: string;

  @ApiProperty({ example: 'Alice Nguyen' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  fullName!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
