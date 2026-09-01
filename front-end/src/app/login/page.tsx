'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Hero Glow do g-hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(74,4,4,0.5)_0%,rgba(5,5,5,0)_70%)] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ea2a33]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-[#ea2a33]/30 mb-3">
            <Wallet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-300 bg-clip-text text-transparent">
            Duzia
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Gestão Financeira Pessoal & Avisos WhatsApp
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea2a33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea2a33]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#ea2a33] to-rose-600 hover:from-[#d4222a] hover:to-rose-700 text-white text-xs font-extrabold shadow-lg shadow-[#ea2a33]/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Entrar no Duzia'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-6">
          Duzia Financial Management · Protegido por Supabase Auth
        </p>
      </div>
    </div>
  );
}
