'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, Divida, AnaliseQuitacao, PerfilFinanceiro } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  Flame,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Pencil,
  Sparkles,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DividasPage() {
  const [analise, setAnalise] = useState<AnaliseQuitacao | null>(null);
  const [perfil, setPerfil] = useState<PerfilFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<'AVALANCHE' | 'BOLADENEVE'>('AVALANCHE');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Divida> | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [an, perf] = await Promise.all([
        fetchApi<AnaliseQuitacao>('/dividas/analise-quitacao'),
        fetchApi<PerfilFinanceiro>('/perfil-financeiro'),
      ]);
      setAnalise(an);
      setPerfil(perf);
    } catch (err) {
      toast.error('Erro ao carregar dados de dívidas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRenda =
    (Number(perfil?.vlSalarioLiquido) || 0) +
    (Number(perfil?.vlRendaVariavel) || 0) +
    (Number(perfil?.vlOutrasRendas) || 0) || 5000;

  const totalParcelas = analise?.resumo.totalParcelaMensal || 0;
  const pctComprometimento = Math.round((totalParcelas / totalRenda) * 100);

  const handlePagarParcela = async (divida: Divida) => {
    try {
      await fetchApi(`/dividas/${divida.cdDivida}/pagar-parcela`, {
        method: 'POST',
      });
      toast.success(`1 Parcela da dívida "${divida.nmDivida}" registrada como paga!`);
      loadData();
    } catch (err) {
      toast.error('Erro ao registrar pagamento de parcela.');
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSaveDivida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nmDivida || !editingItem?.vlTotalOriginal) {
      toast.error('Preencha o nome e o valor total da dívida.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...editingItem,
        vlSaldoDevedor: editingItem.vlSaldoDevedor ?? editingItem.vlTotalOriginal,
        vlParcela: editingItem.vlParcela || 0,
        taxaJurosMensal: editingItem.taxaJurosMensal || 0,
        nrParcelasTotais: editingItem.nrParcelasTotais || 1,
        nrParcelasPagas: editingItem.nrParcelasPagas || 0,
      };

      if (editingItem.cdDivida) {
        await fetchApi(`/dividas/${editingItem.cdDivida}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Dívida atualizada!');
      } else {
        await fetchApi('/dividas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Dívida cadastrada!');
      }
      setModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar dívida.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDivida = async (id: number) => {
    if (!confirm('Deseja excluir esta dívida?')) return;
    try {
      await fetchApi(`/dividas/${id}`, { method: 'DELETE' });
      toast.success('Dívida excluída.');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir dívida.');
    }
  };

  const currentList =
    activeStrategy === 'AVALANCHE'
      ? analise?.estrategiaAvalanche || []
      : analise?.estrategiaBolaDeNeve || [];

  return (
    <div>
      <Header
        title="Gestão de Dívidas & Estratégia"
        subtitle="Quitação inteligente, análise de risco e redução de juros do mercado"
      />

      {/* KPI & Comprometimento de Renda Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-semibold uppercase text-[#94a3b8]">
            Saldo Devedor Acumulado
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(analise?.resumo.totalSaldoDevedor || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {analise?.resumo.totalDividasAtivas || 0} dívidas ativas no sistema
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-semibold uppercase text-[#94a3b8]">
            Comprometimento da Renda Mensal
          </span>
          <p
            className={`text-xl sm:text-2xl font-black mt-2 ${
              pctComprometimento > 30
                ? 'text-rose-500'
                : pctComprometimento > 20
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {pctComprometimento}%{' '}
            <span className="text-xs font-normal text-slate-400">da renda</span>
          </p>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pctComprometimento > 30
                  ? 'bg-rose-500'
                  : pctComprometimento > 20
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, pctComprometimento)}%` }}
            />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 glass-card p-5 rounded-2xl border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/40 to-[#050505] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ea2a33]">
              <ShieldAlert className="h-4 w-4" /> Diagnóstico de Orçamento
            </div>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
              {pctComprometimento > 30
                ? '⚠️ Atenção: Mais de 30% da sua renda está comprometida com parcelas. Foque no Método Avalanche!'
                : pctComprometimento > 20
                ? '🟡 Nível Moderado: Seu orçamento tem pouca margem de manobra.'
                : '🟢 Nível Saudável: Seu nível de endividamento está seguro.'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem({ nrParcelasTotais: 12, nrParcelasPagas: 0 });
              setModalOpen(true);
            }}
            className="mt-3 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-md shadow-[#ea2a33]/25 transition-all"
          >
            <Plus className="h-4 w-4" /> Nova Dívida
          </button>
        </div>
      </div>

      {/* Selector de Estratégias de Quitação Inteligente */}
      <div className="glass-card rounded-2xl p-6 mb-8 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#ea2a33]" /> Ordem Recomendada de Quitação
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Escolha uma estratégia de mercado para acelerar o fim das suas dívidas
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveStrategy('AVALANCHE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStrategy === 'AVALANCHE'
                  ? 'bg-[#ea2a33] text-white shadow-sm shadow-[#ea2a33]/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Flame className="h-4 w-4" /> Método Avalanche (Maior Juros)
            </button>
            <button
              onClick={() => setActiveStrategy('BOLADENEVE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStrategy === 'BOLADENEVE'
                  ? 'bg-[#ea2a33] text-white shadow-sm shadow-[#ea2a33]/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Snowflake className="h-4 w-4" /> Bola de Neve (Menor Saldo)
            </button>
          </div>
        </div>

        {/* Informações da Estratégia Ativa */}
        <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 mb-6">
          {activeStrategy === 'AVALANCHE' ? (
            <p>
              🔥 <strong>Método Avalanche (Recomendado por Economistas):</strong> As dívidas abaixo foram ordenadas pela <strong>maior taxa de juros (% a.m.)</strong>. Pagar estas em prioridade reduz drasticamente o dinheiro desperdiçado com juros.
            </p>
          ) : (
            <p>
              ❄️ <strong>Método Bola de Neve (Snowball):</strong> As dívidas abaixo foram ordenadas pelo <strong>menor saldo devedor restante</strong>. Eliminar dívidas menores primeiro traz vitórias psicológicas rápidas.
            </p>
          )}
        </div>

        {/* Lista de Dívidas Ordenadas */}
        {loading ? (
          <div className="py-8 text-center text-[#94a3b8] text-sm animate-pulse">
            Analisando dívidas...
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-12 text-center text-[#94a3b8]">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
            <p className="font-bold text-white">Parabéns! Nenhuma dívida ativa registrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((divida, index) => {
              const pctPaga = Math.min(
                100,
                Math.round(
                  (Number(divida.nrParcelasPagas || 0) /
                    Number(divida.nrParcelasTotais || 1)) *
                    100,
                ),
              );

              return (
                <div
                  key={divida.cdDivida}
                  className="glass-card glass-card-hover rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-black text-[#ea2a33] bg-[#ea2a33]/15 border border-[#ea2a33]/30 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {divida.nmDivida}
                        </h3>
                        {divida.dsCredor && (
                          <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                            {divida.dsCredor}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        Juros: <strong className="text-rose-400">{divida.taxaJurosMensal}% a.m.</strong> · Parcela:{' '}
                        <strong className="text-white">{formatCurrency(divida.vlParcela)}</strong> ({divida.nrParcelasPagas}/{divida.nrParcelasTotais} pagas)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 uppercase">Saldo Devedor</span>
                      <span className="text-sm font-black text-rose-400">
                        {formatCurrency(divida.vlSaldoDevedor)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePagarParcela(divida)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        Pagar 1 Parcela
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(divida);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDivida(divida.cdDivida)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingItem?.cdDivida ? 'Editar Dívida' : 'Nova Dívida'}
            </h2>

            <form onSubmit={handleSaveDivida} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Dívida / Financiamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empréstimo Pessoal, Financiamento Carro"
                  value={editingItem?.nmDivida || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nmDivida: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credor / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Banco Itaú, Nubank"
                    value={editingItem?.dsCredor || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, dsCredor: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa Juros Mensal (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2.50"
                    value={editingItem?.taxaJurosMensal || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        taxaJurosMensal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Saldo Devedor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10000.00"
                    value={editingItem?.vlSaldoDevedor || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlSaldoDevedor: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor da Parcela Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="550.00"
                    value={editingItem?.vlParcela || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlParcela: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nº Total de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem?.nrParcelasTotais || 12}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrParcelasTotais: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nº Parcelas Já Pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem?.nrParcelasPagas || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrParcelasPagas: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-[#ffffff] hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Dívida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
