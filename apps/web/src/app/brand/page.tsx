import { LogoMark } from '@/components/logo';

function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
        <stop offset="0" stopColor="#2b8bff" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
  );
}

function ConceptB({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <Grad id="cb" />
      <rect width="48" height="48" rx="13" fill="url(#cb)" />
      <circle cx="20" cy="24" r="9.5" fill="#ffffff" fillOpacity="0.95" />
      <circle cx="30" cy="24" r="9.5" fill="#bfdbfe" fillOpacity="0.9" />
      <circle cx="25" cy="24" r="3.4" fill="#4f46e5" />
    </svg>
  );
}

function ConceptC({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <Grad id="cc" />
      <rect width="48" height="48" rx="13" fill="url(#cc)" />
      <text
        x="24"
        y="34"
        fontSize="30"
        fontWeight="800"
        fill="#fff"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        S
      </text>
    </svg>
  );
}

function ConceptD({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <Grad id="cd" />
      <rect width="48" height="48" rx="13" fill="url(#cd)" />
      <path
        d="M24 24 L15 15 M24 24 L34 17 M24 24 L25 35"
        stroke="#ffffff"
        strokeOpacity=".7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="4" fill="#fff" />
      <circle cx="15" cy="15" r="3" fill="#bfdbfe" />
      <circle cx="34" cy="17" r="3" fill="#bfdbfe" />
      <circle cx="25" cy="35" r="3" fill="#bfdbfe" />
    </svg>
  );
}

function Concept({
  children,
  label,
  desc,
  active,
}: {
  children: React.ReactNode;
  label: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:border-brand dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-28 items-center justify-center">{children}</div>
      <p className="mt-2 font-bold">{label}</p>
      <p className="text-sm text-gray-400">{desc}</p>
      {active && (
        <span className="mt-2 inline-block rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
          Đang dùng
        </span>
      )}
    </div>
  );
}

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Bộ nhận diện · Social App
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          Logo &amp; nhận diện
        </h1>
        <p className="mt-2 max-w-xl text-gray-500">
          Biểu tượng “bong bóng chat chứa hai người kết nối” — trò chuyện +
          kết nối bạn bè.
        </p>

        {/* Hero */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-indigo-600 p-14 text-center text-white shadow-soft">
          <svg
            width="112"
            height="112"
            viewBox="0 0 48 48"
            className="mx-auto drop-shadow-xl"
          >
            <rect x="9" y="12" width="30" height="18" rx="7" fill="#fff" />
            <path d="M17 29 L17 37 L26 30.5 Z" fill="#fff" />
            <circle cx="18.6" cy="21" r="3.1" fill="#1877f2" />
            <circle cx="29.4" cy="21" r="3.1" fill="#7c3aed" />
            <path
              d="M21.7 21 H26.3"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="mt-5 text-3xl font-extrabold">Social</div>
          <div className="mt-1 text-white/80">Kết nối với bạn bè mọi lúc</div>
        </div>

        {/* Concepts */}
        <h2 className="mt-14 text-sm font-bold uppercase tracking-widest text-gray-400">
          4 phương án — chọn phương án bạn thích
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Concept label="A · Bubble Connect" desc="Chat + kết nối" active>
            <LogoMark size={84} />
          </Concept>
          <Concept label="B · Overlap" desc="Hai vòng giao nhau">
            <ConceptB />
          </Concept>
          <Concept label="C · Monogram" desc="Chữ S tối giản">
            <ConceptC />
          </Concept>
          <Concept label="D · Network" desc="Mạng lưới kết nối">
            <ConceptD />
          </Concept>
        </div>

        {/* Trên các nền */}
        <h2 className="mt-14 text-sm font-bold uppercase tracking-widest text-gray-400">
          Trên các nền
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex h-36 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <LogoMark size={60} />
          </div>
          <div className="flex h-36 items-center justify-center rounded-2xl bg-[#0b1020]">
            <LogoMark size={60} />
          </div>
          <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-indigo-600">
            <svg width="60" height="60" viewBox="0 0 48 48">
              <rect x="9" y="12" width="30" height="18" rx="7" fill="#fff" />
              <path d="M17 29 L17 37 L26 30.5 Z" fill="#fff" />
              <circle cx="18.6" cy="21" r="3.1" fill="#1877f2" />
              <circle cx="29.4" cy="21" r="3.1" fill="#7c3aed" />
              <path
                d="M21.7 21 H26.3"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Cỡ nhỏ */}
        <h2 className="mt-14 text-sm font-bold uppercase tracking-widest text-gray-400">
          Thu nhỏ vẫn rõ
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          {[16, 24, 40, 64].map((s) => (
            <div key={s} className="text-center">
              <LogoMark size={s} />
              <div className="mt-2 text-xs text-gray-400">{s}px</div>
            </div>
          ))}
        </div>

        {/* Wordmark + màu */}
        <h2 className="mt-14 text-sm font-bold uppercase tracking-widest text-gray-400">
          Wordmark &amp; màu sắc
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <LogoMark size={52} />
            <span className="bg-gradient-to-br from-brand to-indigo-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Social
            </span>
          </div>
          <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            {[
              ['#2B8BFF', 'Brand Blue'],
              ['#4F46E5', 'Indigo'],
              ['#7C3AED', 'Accent tím'],
            ].map(([hex, name]) => (
              <div key={hex} className="flex items-center gap-3">
                <span
                  className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700"
                  style={{ background: hex }}
                />
                <span className="font-semibold">{name}</span>
                <span className="ml-auto font-mono text-sm text-gray-400">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
