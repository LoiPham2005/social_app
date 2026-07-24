import {
  Body,
  Controller,
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
  ConversationSummary,
  MessageEntity,
  Paginated,
} from '@social/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get()
  list(@CurrentUser('id') userId: string): Promise<ConversationSummary[]> {
    return this.chat.listConversations(userId);
  }

  @Post('with/:userId')
  getOrCreate(
    @CurrentUser('id') userId: string,
    @Param('userId', ParseUUIDPipe) otherUserId: string,
  ): Promise<{ id: string }> {
    return this.chat.getOrCreateDirect(userId, otherUserId);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cursor') cursor?: string,
  ): Promise<Paginated<MessageEntity>> {
    return this.chat.getMessages(userId, id, cursor);
  }

  @Post(':id/messages')
  async send(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageEntity> {
    const message = await this.chat.sendMessage(userId, id, dto.content, dto.mediaUrl);
    const memberIds = await this.chat.getMemberIds(id);
    this.gateway.broadcastMessage(message, memberIds);
    return message;
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.chat.markRead(userId, id);
  }
}
