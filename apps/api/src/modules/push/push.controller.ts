import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscribeDto, UnsubscribeDto } from './dto/subscribe.dto';
import { PushService } from './push.service';

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('public-key')
  publicKey(): { publicKey: string } {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ): Promise<void> {
    return this.push.subscribe(userId, dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unsubscribe(@Body() dto: UnsubscribeDto): Promise<void> {
    return this.push.unsubscribe(dto.endpoint);
  }
}
