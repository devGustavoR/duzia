'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, PerfilFinanceiro } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [salario, setSalario] = useState('5000');
  const [rendaVariavel, setRendaVariavel] = useState('1000');
  const [outrasRendas, setOutrasRendas] = useState('0');
  const [perfilRisco, setPerfilRisco] = useState('MODERADO');

  useEffect(() => {
    fetchApi<PerfilFinanceiro>('/perfil-financeiro')
      .then((data) => {
        if (data) {
          setSalario(String(data.vlSalarioLiquido || 5000));
          setRendaVariavel(String(data.vlRendaVariavel || 0));
          setOutrasRendas(String(data.vlOutrasRendas || 0));
          setPerfilRisco(data.dsPerfilRisco || 'MODERADO');
        }
      })
      .catch(() => {});
  }, []);

  const totalRenda =
    (parseFloat(salario) || 0) +
    (parseFloat(rendaVariavel) || 0) +
    (parseFloat(outrasRendas) || 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetchApi('/perfil-financeiro', {
        method: 'POST',
        body: JSON.stringify({
          vlSalarioLiquido: parseFloat(salario) || 0,
          vlRendaVariavel: parseFloat(rendaVariavel) || 0,
          vlOutrasRendas: parseFloat(outrasRendas) || 0,
          dsPerfilRisco: perfilRisco,
        }),
      });
      toast.success('Perfil financeiro atualizado com sucesso!');
      router.push('/dividas');
    } catch (err) {
      toast.error('Erro ao salvar perfil financeiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Hero Glow g-hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(74,4,4,0.5)_0%,rgba(5,5,5,0)_70%)] pointer-events-none" />

      <div className="glass-card w-full max-w-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#ea2a33] to-rose-500 flex items-center justify-center text-white shadow-md shadow-[#ea2a33]/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Quiz de Diagnóstico Financeiro</h1>
              <p className="text-xs text-[#94a3b8]">Configure sua renda para ativar a inteligência de orçamento</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#ea2a33] bg-[#ea2a33]/15 border border-[#ea2a33]/30 px-3 py-1 rounded-full">
            Passo {step} de 3
          </span>
        </div>

        {/* STEP 1: Renda Fixa */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
              <DollarSign className="h-4 w-4 text-[#ea2a33]" />
              <span>Qual é o seu Salário Líquido (Renda Fixa)?</span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Informe o valor líquido que você recebe mensalmente (após descontos de impostos/INSS).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Salário Líquido Mensal (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="5000.00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-[#ea2a33]"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/30 transition-all"
              >
                Próximo Passo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Renda Variável & Outros */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
              <TrendingUp className="h-4 w-4 text-[#ea2a33]" />
              <span>Você possui Renda Variável ou Ganhos Extras?</span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Considere média mensal de freelances, comissões, dividendos ou aluguel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Média Renda Variável (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={rendaVariavel}
                  onChange={(e) => setRendaVariavel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Outras Rendas (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={outrasRendas}
                  onChange={(e) => setOutrasRendas(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/30 transition-all"
              >
                Próximo Passo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Resumo & Salvar */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-[#ea2a33]" />
              <span>Resumo do seu Orçamento Mensal</span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-[#4a0404]/50 via-[#050505] to-[#050505] border border-[#ea2a33]/30 space-y-3">
              <div className="flex justify-between text-xs text-[#94a3b8]">
                <span>Salário Líquido:</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(salario) || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#94a3b8]">
                <span>Renda Variável:</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(rendaVariavel) || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#94a3b8]">
                <span>Outras Rendas:</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(outrasRendas) || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold border-t border-white/10 pt-2 text-[#ea2a33]">
                <span>Renda Mensal Consolidada:</span>
                <span className="text-lg">{formatCurrency(totalRenda)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ea2a33] to-rose-600 hover:from-[#d4222a] hover:to-rose-700 text-white text-xs font-extrabold shadow-lg shadow-[#ea2a33]/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Concluir & Ir para Dívidas'}
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
