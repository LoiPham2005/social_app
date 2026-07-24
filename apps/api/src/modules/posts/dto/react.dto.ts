import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReactionType, type ReactDto as IReactDto } from '@social/shared';

export class ReactDto implements IReactDto {
  @ApiProperty({ enum: ReactionType, example: ReactionType.LIKE })
  @IsEnum(ReactionType)
  type!: ReactionType;
}
