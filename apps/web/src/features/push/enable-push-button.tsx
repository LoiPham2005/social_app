'use client';

import { useEffect, useState } from 'react';
import { getPushPublicKey, subscribePush, unsubscribePush } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type State = 'unsupported' | 'off' | 'on' | 'working';

export function EnablePushButton() {
  const [state, setState] = useState<State>('off');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setState('unsupported');
      return;
    }
    // Kiểm tra đã đăng ký chưa.
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    });
  }, []);

  async function enable() {
    setState('working');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('off');
        alert('Bạn cần cho phép thông báo trong trình duyệt.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const publicKey = await getPushPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await subscribePush(sub.toJSON());
      setState('on');
    } catch (err) {
      console.error(err);
      setState('off');
      alert('Không bật được thông báo đẩy.');
    }
  }

  async function disable() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setState('on');
    }
  }

  if (state === 'unsupported') return null;

  if (state === 'on') {
    return (
      <button
        onClick={disable}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        🔕 Tắt thông báo đẩy
      </button>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={state === 'working'}
      className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
    >
      {state === 'working' ? 'Đang bật…' : '🔔 Bật thông báo đẩy'}
    </button>
  );
}
