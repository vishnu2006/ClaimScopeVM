import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ClaimScope — P&C Auto Claim Adjudication & Decision Support',
  description:
    'Next-generation multimodal decision-support intelligence for Property & Casualty automobile claim investigation, damage cross-referencing, and adjustor compliance.',
  icons: {
    icon: '/brand/vmlogo.png',
    shortcut: '/brand/vmlogo.png',
    apple: '/brand/vmlogo.png',
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
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
