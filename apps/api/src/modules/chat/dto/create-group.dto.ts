import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { CreateGroupDto as ICreateGroupDto } from '@social/shared';

export class CreateGroupDto implements ICreateGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  memberIds!: string[];
}
