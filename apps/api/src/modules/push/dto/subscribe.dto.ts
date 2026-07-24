import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';

class SubscriptionKeys {
  @ApiProperty()
  @IsString()
  p256dh!: string;

  @ApiProperty()
  @IsString()
  auth!: string;
}

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  endpoint!: string;

  @ApiProperty({ type: SubscriptionKeys })
  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionKeys)
  keys!: SubscriptionKeys;
}

export class UnsubscribeDto {
  @ApiProperty()
  @IsString()
  endpoint!: string;
}
