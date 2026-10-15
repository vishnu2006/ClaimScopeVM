import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ClaimScope — Auto Accident Claim Investigation Assistant',
  description:
    'Enterprise multi-document AI investigation pipeline for US P&C Auto Claims. Automated intake, damage extraction, cross-referencing, and adjustor reporting.',
  icons: {
    icon: '/brand/claimscope-logo.png',
    shortcut: '/brand/claimscope-logo.png',
    apple: '/brand/claimscope-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-50 text-surface-800 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
