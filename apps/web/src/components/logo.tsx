/**
 * Logo Social App — biểu tượng "bong bóng chat" chứa 2 người kết nối,
 * thể hiện: trò chuyện (chat) + kết nối (mạng xã hội).
 */
export function LogoMark({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Social App logo"
    >
      <defs>
        <linearGradient id="sa-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#2b8bff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      {/* Nền bo góc */}
      <rect width="48" height="48" rx="13" fill="url(#sa-grad)" />

      {/* Bong bóng chat */}
      <rect x="9" y="12" width="30" height="18" rx="7" fill="#fff" />
      <path d="M17 29 L17 37 L26 30.5 Z" fill="#fff" />

      {/* Hai người + đường kết nối */}
      <circle cx="18.6" cy="21" r="3.1" fill="#1877f2" />
      <circle cx="29.4" cy="21" r="3.1" fill="#7c3aed" />
      <path
        d="M21.7 21 H26.3"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Logo + chữ "Social" nằm ngang. */
export function LogoWordmark({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight text-brand"
        style={{ fontSize: size * 0.52 }}
      >
        Social
      </span>
    </span>
  );
}
