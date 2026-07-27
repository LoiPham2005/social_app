'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ---------- Types ----------
interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: string;
}
interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
}
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface DialogApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  toast: (message: string, type?: ToastType) => void;
}

type Pending =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void }
  | null;

const Ctx = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDialog phải nằm trong DialogProvider');
  return ctx;
}
export const useConfirm = () => useDialog().confirm;
export const usePrompt = () => useDialog().prompt;
export const useToast = () => useDialog().toast;

// ---------- Provider ----------
let toastId = 0;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending>(null);
  const [inputValue, setInputValue] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) =>
        setPending({ kind: 'confirm', opts, resolve }),
      ),
    [],
  );

  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setInputValue(opts.defaultValue ?? '');
        setPending({ kind: 'prompt', opts, resolve });
      }),
    [],
  );

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const close = useCallback(
    (result: boolean | string | null) => {
      if (!pending) return;
      if (pending.kind === 'confirm') pending.resolve(result as boolean);
      else pending.resolve(result as string | null);
      setPending(null);
    },
    [pending],
  );

  // Focus input khi mở prompt.
  useEffect(() => {
    if (pending?.kind === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pending]);

  // Escape để hủy.
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(pending.kind === 'confirm' ? false : null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const danger = pending?.kind === 'confirm' && pending.opts.danger;

  return (
    <Ctx.Provider value={{ confirm, prompt, toast }}>
      {children}

      {/* Modal confirm / prompt */}
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => close(pending.kind === 'confirm' ? false : null)}
        >
          <div
            className="w-full max-w-sm animate-pop-in rounded-2xl bg-white p-6 shadow-soft dark:bg-gray-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-3">
              {(pending.opts as ConfirmOptions).icon && (
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
                    danger
                      ? 'bg-red-100 dark:bg-red-500/15'
                      : 'bg-brand-light dark:bg-brand/15'
                  }`}
                >
                  {(pending.opts as ConfirmOptions).icon}
                </span>
              )}
              <h3 className="text-lg font-bold">{pending.opts.title}</h3>
            </div>

            {pending.opts.message && (
              <p className="mb-4 text-sm text-gray-500">{pending.opts.message}</p>
            )}

            {pending.kind === 'prompt' && (
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && close(inputValue)}
                placeholder={pending.opts.placeholder}
                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800"
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => close(pending.kind === 'confirm' ? false : null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {pending.kind === 'confirm'
                  ? (pending.opts.cancelText ?? 'Hủy')
                  : 'Hủy'}
              </button>
              <button
                onClick={() =>
                  close(pending.kind === 'confirm' ? true : inputValue)
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {(pending.opts as ConfirmOptions).confirmText ?? 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-soft ${
              t.type === 'success'
                ? 'bg-emerald-500'
                : t.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-800 dark:bg-gray-700'
            }`}
          >
            <span>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
