import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  FriendRequestItem,
  FriendshipStatusResult,
  PublicUser,
} from '@social/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendshipsService } from './friendships.service';

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly service: FriendshipsService) {}

  @Get()
  listFriends(@CurrentUser('id') userId: string): Promise<PublicUser[]> {
    return this.service.listFriends(userId);
  }

  @Get('requests')
  listRequests(
    @CurrentUser('id') userId: string,
    @Query('type') type?: 'incoming' | 'outgoing',
  ): Promise<FriendRequestItem[]> {
    return this.service.listRequests(userId, type ?? 'incoming');
  }

  @Get('suggestions')
  suggestions(@CurrentUser('id') userId: string): Promise<PublicUser[]> {
    return this.service.suggestions(userId);
  }

  @Get('status/:targetId')
  status(
    @CurrentUser('id') userId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ): Promise<FriendshipStatusResult> {
    return this.service.statusWith(userId, targetId);
  }

  @Post('request')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: FriendRequestDto,
  ): Promise<void> {
    return this.service.sendRequest(userId, dto.targetId);
  }

  @Post('accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  accept(
    @CurrentUser('id') userId: string,
    @Body() dto: FriendRequestDto,
  ): Promise<void> {
    return this.service.accept(userId, dto.targetId);
  }

  @Delete(':targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ): Promise<void> {
    return this.service.remove(userId, targetId);
  }
}
