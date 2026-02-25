import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URLsh — URL Shortener',
  description: 'Paste a long URL. Get a short one.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
