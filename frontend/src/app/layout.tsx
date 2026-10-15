import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/context/ThemeContext';

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

// Inline script to prevent theme flash (FOUC) before React mounts
const themeInitializerScript = `
(function() {
  try {
    var stored = localStorage.getItem('claimscope-theme');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
      </head>
      <body className="min-h-screen bg-surface-50 text-surface-800 antialiased font-sans">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
