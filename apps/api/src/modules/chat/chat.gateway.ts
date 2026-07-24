import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type {
  MessageEntity,
  SocketMessagePayload,
  TypingPayload,
} from '@social/shared';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Xác thực socket bằng JWT lấy từ handshake.auth.token. */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      // Mỗi user có 1 room riêng để nhận cập nhật danh sách hội thoại.
      client.join(this.userRoom(payload.sub));
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): Promise<void> {
    const userId = client.data.userId as string;
    if (!userId) return;
    if (await this.chat.isMember(userId, conversationId)) {
      client.join(this.convRoom(conversationId));
    }
  }

  @SubscribeMessage('conversation:leave')
  onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    client.leave(this.convRoom(conversationId));
  }

  @SubscribeMessage('message:send')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SocketMessagePayload,
  ): Promise<void> {
    const userId = client.data.userId as string;
    if (!userId) return;
    const message = await this.chat.sendMessage(
      userId,
      payload.conversationId,
      payload.content,
      payload.mediaUrl,
    );
    const memberIds = await this.chat.getMemberIds(payload.conversationId);
    this.broadcastMessage(message, memberIds);
  }

  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ): void {
    const userId = client.data.userId as string;
    if (!userId) return;
    client.to(this.convRoom(payload.conversationId)).emit('typing', {
      conversationId: payload.conversationId,
      userId,
      isTyping: payload.isTyping,
    });
  }

  /** Bắn 1 sự kiện bất kỳ tới room riêng của 1 user (dùng cho notification). */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(this.userRoom(userId)).emit(event, data);
  }

  /** Bắn tin mới tới room hội thoại + cập nhật danh sách cho từng thành viên. */
  broadcastMessage(message: MessageEntity, memberIds: string[]): void {
    this.server.to(this.convRoom(message.conversationId)).emit('message:new', message);
    for (const id of memberIds) {
      this.server.to(this.userRoom(id)).emit('conversation:updated', {
        conversationId: message.conversationId,
      });
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
  private convRoom(conversationId: string): string {
    return `conv:${conversationId}`;
  }
}
