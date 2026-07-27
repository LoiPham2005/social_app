import { NotificationType, type NotificationEntity } from '@social/shared';

/** Câu mô tả thông báo hiển thị cho người dùng. */
export function notificationText(n: NotificationEntity): string {
  const name = n.actor.fullName;
  switch (n.type) {
    case NotificationType.LIKE:
      return `${name} đã thích bài viết của bạn`;
    case NotificationType.COMMENT:
      return `${name} đã bình luận bài viết của bạn`;
    case NotificationType.FRIEND_REQUEST:
      return `${name} đã gửi cho bạn lời mời kết bạn`;
    case NotificationType.FRIEND_ACCEPT:
      return `${name} đã chấp nhận lời mời kết bạn`;
    case NotificationType.MESSAGE:
      return `${name} đã gửi cho bạn một tin nhắn`;
    case NotificationType.TAG:
      return `${name} đã nhắc đến bạn`;
    default:
      return `${name} có hoạt động mới`;
  }
}

export function notificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.LIKE:
      return '👍';
    case NotificationType.COMMENT:
      return '💬';
    case NotificationType.FRIEND_REQUEST:
      return '🤝';
    case NotificationType.FRIEND_ACCEPT:
      return '✅';
    case NotificationType.MESSAGE:
      return '✉️';
    default:
      return '🔔';
  }
}

/** Đường dẫn khi bấm vào 1 thông báo. */
export function notificationHref(n: NotificationEntity): string {
  switch (n.type) {
    case NotificationType.FRIEND_REQUEST:
      return '/friends';
    case NotificationType.FRIEND_ACCEPT:
      return `/u/${n.actor.username}`;
    case NotificationType.LIKE:
    case NotificationType.COMMENT:
      return n.targetId ? `/posts/${n.targetId}` : '/feed';
    default:
      return '/feed';
  }
}
