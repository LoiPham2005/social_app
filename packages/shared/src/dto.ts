import {
  FriendshipState,
  NotificationType,
  PostPrivacy,
  ReactionType,
} from './enums';

// ---- Auth ----
export interface RegisterDto {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

// ---- User ----
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

// ---- Post ----
export interface CreatePostDto {
  content: string;
  mediaUrls?: string[];
  privacy?: PostPrivacy;
}

export interface PostEntity {
  id: string;
  author: PublicUser;
  content: string;
  mediaUrls: string[];
  privacy: PostPrivacy;
  reactionCount: number;
  commentCount: number;
  myReaction: ReactionType | null;
  createdAt: string;
}

// ---- Comment ----
export interface CreateCommentDto {
  content: string;
  parentId?: string | null;
}

export interface CommentEntity {
  id: string;
  postId: string;
  author: PublicUser;
  parentId: string | null;
  content: string;
  createdAt: string;
}

// ---- Reaction ----
export interface ReactDto {
  type: ReactionType;
}

// ---- Friendship ----
export interface FriendRequestDto {
  targetId: string;
}

export interface FriendshipStatusResult {
  state: FriendshipState;
}

/** Một lời mời kết bạn (kèm người liên quan). */
export interface FriendRequestItem {
  friendshipId: string;
  user: PublicUser;
  createdAt: string;
}

// ---- Profile ----
export interface ProfileEntity {
  user: PublicUser;
  friendCount: number;
  postCount: number;
  friendshipState: FriendshipState;
  isMe: boolean;
}

// ---- Notification ----
export interface NotificationEntity {
  id: string;
  type: NotificationType;
  actor: PublicUser;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

// ---- Chat ----
export interface MessageEntity {
  id: string;
  conversationId: string;
  sender: PublicUser;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name: string | null;
  /** Người còn lại (với chat 1-1); null nếu là group. */
  otherUser: PublicUser | null;
  lastMessage: MessageEntity | null;
  unreadCount: number;
}

export interface SendMessageDto {
  content: string;
  mediaUrl?: string | null;
}

/** Payload các sự kiện socket. */
export interface SocketMessagePayload {
  conversationId: string;
  content: string;
  mediaUrl?: string | null;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

// ---- Upload ----
export interface UploadResult {
  url: string;
}

export type UploadFolder = 'posts' | 'avatars' | 'covers';

// ---- Common ----
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
