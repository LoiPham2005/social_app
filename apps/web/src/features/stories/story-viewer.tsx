'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoryGroup } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { timeAgo } from '@/lib/format';
import { markStorySeen } from './api';

const DURATION = 5000; // 5s mỗi story

export function StoryViewer({
  groups,
  startIndex,
  onClose,
}: {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
}) {
  const [gi, setGi] = useState(startIndex);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const group = groups[gi];
  const story = group?.stories[si];

  const goNext = useCallback(() => {
    setProgress(0);
    if (group && si < group.stories.length - 1) {
      setSi((v) => v + 1);
    } else if (gi < groups.length - 1) {
      setGi((v) => v + 1);
      setSi(0);
    } else {
      onClose();
    }
  }, [group, si, gi, groups.length, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    if (si > 0) setSi((v) => v - 1);
    else if (gi > 0) {
      setGi((v) => v - 1);
      setSi(0);
    }
  }, [si, gi]);

  // Đánh dấu đã xem + chạy thanh tiến trình.
  useEffect(() => {
    if (!story) return;
    void markStorySeen(story.id);
    setProgress(0);
    const start = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(timer.current);
  }, [story, goNext]);

  // Điều hướng bằng phím.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-3xl text-white/80 hover:text-white"
      >
        ✕
      </button>

      <div className="relative flex h-full max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-gray-900">
        {/* Thanh tiến trình */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {group.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width:
                    idx < si ? '100%' : idx === si ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header tác giả */}
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center gap-2 px-3 pt-2">
          <Avatar name={group.author.fullName} url={group.author.avatarUrl} size={36} />
          <div>
            <p className="text-sm font-semibold text-white">
              {group.author.fullName}
            </p>
            <p className="text-xs text-white/70">{timeAgo(story.createdAt)}</p>
          </div>
        </div>

        {/* Ảnh */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.mediaUrl}
          alt=""
          className="h-full w-full object-contain"
        />

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pb-6">
            <p className="text-center text-white">{story.caption}</p>
          </div>
        )}

        {/* Vùng bấm trái/phải */}
        <button
          onClick={goPrev}
          className="absolute bottom-0 left-0 top-0 w-1/3"
          aria-label="Trước"
        />
        <button
          onClick={goNext}
          className="absolute bottom-0 right-0 top-0 w-1/3"
          aria-label="Sau"
        />
      </div>
    </div>
  );
}
