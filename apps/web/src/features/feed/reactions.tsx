'use client';

import { ReactionType } from '@social/shared';

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

export const REACTIONS: ReactionConfig[] = [
  { type: ReactionType.LIKE, emoji: '👍', label: 'Thích', color: 'text-brand' },
  { type: ReactionType.LOVE, emoji: '❤️', label: 'Yêu thích', color: 'text-red-500' },
  { type: ReactionType.HAHA, emoji: '😆', label: 'Haha', color: 'text-amber-500' },
  { type: ReactionType.WOW, emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  { type: ReactionType.SAD, emoji: '😢', label: 'Buồn', color: 'text-amber-500' },
  { type: ReactionType.ANGRY, emoji: '😡', label: 'Phẫn nộ', color: 'text-orange-600' },
];

export function reactionOf(type: ReactionType | null | undefined): ReactionConfig {
  return REACTIONS.find((r) => r.type === type) ?? REACTIONS[0];
}

/** Bảng chọn cảm xúc hiện khi rê chuột lên nút Thích. */
export function ReactionPicker({
  onPick,
}: {
  onPick: (type: ReactionType) => void;
}) {
  return (
    <div className="pointer-events-auto absolute -top-12 left-0 flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => onPick(r.type)}
          title={r.label}
          className="text-2xl transition-transform duration-100 hover:-translate-y-1 hover:scale-125"
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
