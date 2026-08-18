import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Duzia — Gestão Financeira Pessoal',
  description:
    'App pessoal de gestão financeira com aviso automático via WhatsApp',
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
        <main className="md:pl-64 pb-20 md:pb-8 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
