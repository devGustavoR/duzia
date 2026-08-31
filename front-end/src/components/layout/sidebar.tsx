'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wallet, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { navItems } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sessão encerrada com sucesso.');
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') return null;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#050505]/95 p-5 min-h-screen fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-[#ea2a33]/25">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-300 bg-clip-text text-transparent">
            Duzia
          </h1>
          <p className="text-xs text-[#94a3b8] font-medium">Gestão Financeira</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30 shadow-sm shadow-[#ea2a33]/10 font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-[#ea2a33]' : 'text-[#94a3b8]')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/10 space-y-3">
        {userEmail && (
          <div className="flex items-center gap-2 px-2 text-xs text-slate-300 truncate">
            <User className="h-3.5 w-3.5 text-[#ea2a33] shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
        >
          <LogOut className="h-4 w-4" /> Sair da Conta
        </button>
      </div>
    </aside>
  );
}
