import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { themeInitScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Social App',
  description: 'Mạng xã hội — web client',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
