'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';
import {
  navItems,
  mobilePrimaryHrefs,
  logoutIcon as LogOut,
  titleForPath,
} from './nav-items';

const QUICK_ADD = [
  { label: 'Nova conta', href: '/contas' },
  { label: 'Registrar pagamento', href: '/' },
  { label: 'Compra no cartão', href: '/cartoes-credito' },
  { label: 'Compra Pix parcelado', href: '/pix-parcelado' },
  { label: 'Gasto de evento', href: '/eventos' },
];

function isActive(pathname: string, href: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/');
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (pathname === '/login') return null;

  const primary = mobilePrimaryHrefs
    .map((h) => navItems.find((i) => i.href === h))
    .filter((i): i is (typeof navItems)[number] => Boolean(i));

  const onPrimary = primary.some((i) => isActive(pathname, i.href));
  const title = titleForPath(pathname);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    toast.success('Sessão encerrada.');
    router.push('/login');
    router.refresh();
  };

  const go = (href: string) => {
    setMoreOpen(false);
    setAddOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ── Top app bar ─────────────────────────────────────── */}
      <header className="md:hidden fixed inset-x-0 top-0 z-40 h-appbar pt-safe bg-[#050505]/90 backdrop-blur-md border-b border-white/10">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            {!onPrimary && (
              <button
                onClick={() => router.back()}
                aria-label="Voltar"
                className="-ml-2 p-2 rounded-xl text-slate-300 hover:bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <span className="text-base font-black text-white truncate">{title}</span>
          </div>
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Menu"
            className="p-2 -mr-2 rounded-xl text-slate-300 hover:bg-white/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Bottom tab bar ──────────────────────────────────── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 pb-safe bg-[#050505]/95 backdrop-blur-md border-t border-white/10">
        <div className="grid grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
          {primary.slice(0, 2).map((item) => (
            <TabButton key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}

          {/* Center FAB */}
          <div className="flex justify-center">
            <button
              onClick={() => setAddOpen(true)}
              aria-label="Adicionar"
              className="-mt-6 h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-[#ea2a33]/40 active:scale-95 transition-transform"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          {primary.slice(2, 3).map((item) => (
            <TabButton key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-colors',
              moreOpen ? 'text-[#ea2a33]' : 'text-[#94a3b8]',
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            Mais
          </button>
        </div>
      </nav>

      {/* ── "Mais" sheet: full nav ──────────────────────────── */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Navegação">
        <div className="grid grid-cols-3 gap-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors',
                  active
                    ? 'bg-[#ea2a33]/15 border-[#ea2a33]/40 text-[#ea2a33]'
                    : 'bg-white/5 border-white/10 text-slate-300 active:bg-white/10',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-tight">{item.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-400"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </Sheet>

      {/* ── Quick-add sheet ─────────────────────────────────── */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar">
        <div className="space-y-2">
          {QUICK_ADD.map((q) => (
            <button
              key={q.label}
              onClick={() => go(q.href)}
              className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-sm font-semibold text-slate-200 active:bg-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ea2a33]/15 text-[#ea2a33]">
                <Plus className="h-4 w-4" />
              </span>
              {q.label}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function TabButton({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-colors',
        active ? 'text-[#ea2a33]' : 'text-[#94a3b8]',
      )}
    >
      <Icon className="h-5 w-5" />
      {item.short ?? item.name}
    </Link>
  );
}
