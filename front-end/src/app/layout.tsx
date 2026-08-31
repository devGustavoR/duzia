import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Duzia — Gestão Financeira Pessoal',
  description:
    'App pessoal de gestão financeira com aviso automático via WhatsApp',
  applicationName: 'Duzia',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Duzia',
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <Sidebar />
        <MobileNav />
        <main className="md:pl-64 pt-[calc(56px+env(safe-area-inset-top))] md:pt-0 pb-bottomnav md:pb-8 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <Toaster position="top-center" offset="72px" theme="dark" richColors />
      </body>
    </html>
  );
}
