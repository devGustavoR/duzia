'use client';

import { useState } from 'react';
import { fetchApi, PerfilFinanceiro } from '@/lib/api';
import { Wallet, DollarSign, TrendingUp, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [salario, setSalario] = useState('5000');
  const [rendaVariavel, setRendaVariavel] = useState('0');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salNum = parseFloat(salario);
    if (!salNum || salNum <= 0) {
      toast.error('Informe um valor de salário líquido válido.');
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/perfil-financeiro', {
        method: 'POST',
        body: JSON.stringify({
          vlSalarioLiquido: salNum,
          vlRendaVariavel: parseFloat(rendaVariavel) || 0,
          vlOutrasRendas: 0,
          dsPerfilRisco: 'MODERADO',
        }),
      });
      toast.success('Renda cadastrada! Inteligência financeira ativada.');
      onComplete();
    } catch (err) {
      toast.error('Erro ao salvar dados de renda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#ea2a33]/40 shadow-2xl relative overflow-hidden bg-[#050505]">
        {/* Glow de Destaque g-hub */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#ea2a33]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-[#ea2a33]/30 mb-3">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Configuração Inicial Obrigatória
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1 max-w-sm leading-relaxed">
            Para ativar a inteligência do Duzia e diagnosticar seu comprometimento de renda, informe seu salário e ganhos mensais.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Salário Líquido Mensal (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                required
                placeholder="5000.00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base font-bold text-white focus:outline-none focus:border-[#ea2a33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Média de Renda Variável / Extras (R$)
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={rendaVariavel}
                onChange={(e) => setRendaVariavel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#4a0404]/30 border border-[#ea2a33]/30 text-[11px] text-rose-300 flex items-center gap-2 mt-2">
            <Sparkles className="h-4 w-4 shrink-0 text-[#ea2a33]" />
            <span>Estes dados são mantidos em sigilo e usados exclusivamente nos seus cálculos.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#ea2a33] to-rose-600 hover:from-[#d4222a] hover:to-rose-700 text-white text-xs font-extrabold shadow-lg shadow-[#ea2a33]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar e Liberar Acesso'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
