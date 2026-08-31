'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { fetchApi, CartaoCredito } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  ArrowRight,
  Settings,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  PieChart,
  Palette,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const BANK_OPTIONS = ['Nubank', 'Itaú', 'XP', 'Bradesco', 'Inter', 'Santander', 'C6 Bank', 'Banco do Brasil', 'Caixa', 'Outro'];
const BRAND_OPTIONS = ['Mastercard', 'Visa', 'Elo', 'Amex'];

const COLOR_OPTIONS = [
  { label: 'Roxinho Nubank', value: 'from-purple-950 via-purple-800 to-indigo-950' },
  { label: 'Laranja Itaú', value: 'from-orange-600 via-amber-700 to-stone-900' },
  { label: 'Black Infinite / XP', value: 'from-slate-900 via-zinc-900 to-black' },
  { label: 'Azul Inter', value: 'from-blue-600 via-cyan-700 to-slate-900' },
  { label: 'Vermelho Santander', value: 'from-red-700 via-rose-900 to-zinc-950' },
  { label: 'Dourado Gold / Platinum', value: 'from-amber-600 via-yellow-700 to-zinc-900' },
  { label: 'Verde C6 / Carbon', value: 'from-emerald-700 via-teal-900 to-slate-950' },
];

const DEFAULT_CARTOES: CartaoCredito[] = [
  {
    cdCartaoCredito: 1,
    nmCartao: 'Nubank',
    nmBanco: 'Nubank',
    nmBandeira: 'Mastercard',
    nrUltimosDigitos: '6814',
    vlLimiteTotal: 68.14,
    vlLimiteUsado: 45.73,
    nrDiaFechamento: 12,
    nrDiaVencimento: 19,
    dsCorCard: 'from-purple-950 via-purple-800 to-indigo-950',
    snAtivo: 'S',
    compras: [
      {
        cdCompra: 101,
        cdCartaoCredito: 1,
        dsCompra: 'Contabo Cloud VPS 4 (vmi3504804)',
        vlTotal: 45.73,
        nrParcelas: 1,
        nrParcelaAtual: 1,
        vlParcela: 45.73,
        dtCompra: '2026-08-12',
        nmCategoria: 'Servidores & Cloud',
      },
    ],
  },
  {
    cdCartaoCredito: 2,
    nmCartao: 'Neon',
    nmBanco: 'Neon',
    nmBandeira: 'Visa',
    nrUltimosDigitos: '3248',
    vlLimiteTotal: 1180.0,
    vlLimiteUsado: 1044.46,
    nrDiaFechamento: 31,
    nrDiaVencimento: 5,
    dsCorCard: 'from-cyan-700 via-teal-800 to-slate-950',
    snAtivo: 'S',
    compras: [
      {
        cdCompra: 102,
        cdCartaoCredito: 2,
        dsCompra: 'Anthropic* Claude Sub',
        vlTotal: 118.0,
        nrParcelas: 1,
        nrParcelaAtual: 1,
        vlParcela: 118.0,
        dtCompra: '2026-07-28',
        nmCategoria: 'Assinaturas & SaaS',
      },
    ],
  },
];

export default function CartoesCreditoListPage() {
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<CartaoCredito>>({});
  const [saving, setSaving] = useState(false);

  const updateCartoesState = (list: CartaoCredito[]) => {
    const unique = list.filter(
      (c, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.cdCartaoCredito === c.cdCartaoCredito ||
            (t.nmCartao === c.nmCartao && t.nmBanco === c.nmBanco),
        ),
    );
    setCartoes(unique);
    try {
      localStorage.setItem('duzia_cartoes_credito_v3', JSON.stringify(unique));
    } catch (e) {}
  };

  const loadCartoes = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<CartaoCredito[]>('/cartao-credito');
      if (Array.isArray(res) && res.length > 0) {
        updateCartoesState(res);
      } else {
        const saved = localStorage.getItem('duzia_cartoes_credito_v3');
        if (saved) {
          updateCartoesState(JSON.parse(saved));
        } else {
          updateCartoesState(DEFAULT_CARTOES);
        }
      }
    } catch (err: any) {
      console.warn('Usando fallback de cartões locais:', err);
      const saved = localStorage.getItem('duzia_cartoes_credito_v3');
      if (saved) {
        updateCartoesState(JSON.parse(saved));
      } else {
        updateCartoesState(DEFAULT_CARTOES);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCartoes();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCard({
      nmCartao: '',
      nmBanco: 'Nubank',
      nmBandeira: 'Mastercard',
      nrUltimosDigitos: '1234',
      vlLimiteTotal: 5000,
      vlLimiteUsado: 0,
      nrDiaFechamento: 5,
      nrDiaVencimento: 12,
      dsCorCard: COLOR_OPTIONS[0].value,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (card: CartaoCredito, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setModalOpen(true);
  };

  const handleDeleteCard = async (cdCartaoCredito: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente remover este cartão de crédito?')) return;

    try {
      await fetchApi(`/cartao-credito/${cdCartaoCredito}`, { method: 'DELETE' });
      toast.success('Cartão de crédito removido com sucesso.');
      loadCartoes();
    } catch (err: any) {
      toast.error('Erro ao remover cartão de crédito.');
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard.nmCartao || !editingCard.vlLimiteTotal) {
      toast.error('Preencha o nome e o limite do cartão.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/cartao-credito', {
        method: 'POST',
        body: JSON.stringify(editingCard),
      });
      toast.success(
        editingCard.cdCartaoCredito
          ? 'Cartão de crédito atualizado!'
          : 'Novo cartão de crédito adicionado!',
      );
      setModalOpen(false);
      loadCartoes();
    } catch (err: any) {
      toast.error('Erro ao salvar cartão de crédito.');
    } finally {
      setSaving(false);
    }
  };

  // Totais Combinados
  const totalLimite = cartoes.reduce((acc, c) => acc + Number(c.vlLimiteTotal || 0), 0);
  const totalUsado = cartoes.reduce((acc, c) => acc + Number(c.vlLimiteUsado || 0), 0);
  const totalDisponivel = Math.max(0, totalLimite - totalUsado);
  const percentualUsadoGlobal = totalLimite > 0 ? (totalUsado / totalLimite) * 100 : 0;

  return (
    <div className="space-y-8 pb-12">
      <Header
        title="Meus Cartões de Crédito"
        subtitle="Gerencie seus cartões de crédito, acompanhe limites disponíveis, faturas e controle suas compras parceladas"
      />

      {/* Resumo de Limites Globais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-[#ea2a33]" /> Limite Total Combinado
          </span>
          <p className="text-xl sm:text-3xl font-black text-white mt-2">{formatCurrency(totalLimite)}</p>
          <p className="text-xs text-slate-400 mt-2">Soma de {cartoes.length} cartão(ões)</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 to-transparent flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-rose-400" /> Fatura Total Atual (Usado)
          </span>
          <p className="text-xl sm:text-3xl font-black text-rose-400 mt-2">{formatCurrency(totalUsado)}</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, percentualUsadoGlobal)}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-transparent flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-emerald-300 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-emerald-400" /> Limite Livre Disponível
          </span>
          <p className="text-xl sm:text-3xl font-black text-emerald-400 mt-2">
            {formatCurrency(totalDisponivel)}
          </p>
          <p className="text-xs text-emerald-300/80 mt-2">Pronto para utilizar</p>
        </div>
      </div>

      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#ea2a33]" /> Seus Cartões de Crédito
          </h2>
          <p className="text-xs text-slate-400">
            Clique em um cartão para acessar a página detalhada de fatura e lançamentos.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold transition-all shadow-lg shadow-[#ea2a33]/25 shrink-0"
        >
          <Plus className="h-4 w-4" /> Adicionar Cartão de Crédito
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : cartoes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-4 border border-white/10">
          <CreditCard className="h-12 w-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">Nenhum cartão de crédito cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cadastre seus cartões de crédito para acompanhar faturas, limite disponível e compras parceladas.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea2a33] text-white text-xs font-bold shadow-md"
          >
            <Plus className="h-4 w-4" /> Cadastrar Cartão de Crédito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((card) => {
            const limiteTotal = Number(card.vlLimiteTotal || 0);
            const limiteUsado = Number(card.vlLimiteUsado || 0);
            const limiteDisponivel = Math.max(0, limiteTotal - limiteUsado);
            const pctUsado = limiteTotal > 0 ? (limiteUsado / limiteTotal) * 100 : 0;
            const bgGradient = card.dsCorCard || COLOR_OPTIONS[0].value;

            // Melhor dia de compra (dia após fechamento)
            const diaMelhorCompra = card.nrDiaFechamento === 31 ? 1 : card.nrDiaFechamento + 1;

            return (
              <div
                key={card.cdCartaoCredito}
                className={`glass-card rounded-2xl p-6 border border-white/15 bg-gradient-to-tr ${bgGradient} relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/40 group cursor-pointer`}
              >
                {/* Brilho de fundo */}
                <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <div>
                  {/* Top bar do Cartão */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-white tracking-wider block uppercase truncate max-w-[130px]">
                          {card.nmCartao}
                        </span>
                        <span className="text-[10px] text-white/70 font-semibold">
                          {card.nmBanco} · {card.nmBandeira}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEditModal(card, e)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Editar Cartão"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCard(card.cdCartaoCredito, e)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition-colors"
                        title="Remover Cartão"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Número dos dígitos e Chip visual */}
                  <div className="my-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-white/60 uppercase tracking-widest block">
                        Número do Cartão
                      </span>
                      <span className="text-base font-mono font-bold text-white tracking-widest mt-0.5 block">
                        •••• •••• •••• {card.nrUltimosDigitos || '••••'}
                      </span>
                    </div>
                    {/* Chip gráfico */}
                    <div className="h-7 w-9 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center shadow-inner">
                      <div className="h-4 w-6 border-r border-b border-amber-600/40 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Fechamento & Vencimento */}
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 my-3 grid grid-cols-2 gap-2 text-[11px] text-white">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fecha todo dia</span>
                      <strong className="text-white font-bold">Dia {card.nrDiaFechamento}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vence todo dia</span>
                      <strong className="text-white font-bold">Dia {card.nrDiaVencimento}</strong>
                    </div>
                  </div>
                </div>

                {/* Progress bar e Footer */}
                <div className="pt-3 border-t border-white/15 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/70 font-medium">Fatura Atual</span>
                      <span className="font-bold text-rose-300">{formatCurrency(limiteUsado)}</span>
                    </div>
                    <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pctUsado)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/60 mt-1">
                      <span>Livre: <strong className="text-emerald-300">{formatCurrency(limiteDisponivel)}</strong></span>
                      <span>Total: <strong>{formatCurrency(limiteTotal)}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/cartoes-credito/${card.cdCartaoCredito}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-bold shadow-md transition-all group-hover:bg-amber-300"
                  >
                    Ver Fatura & Compras <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Cartão de Crédito */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#ea2a33]" />
                {editingCard.cdCartaoCredito ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Roxinho Ultra"
                  value={editingCard.nmCartao || ''}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, nmCartao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Instituição / Banco
                  </label>
                  <select
                    value={editingCard.nmBanco || 'Nubank'}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, nmBanco: e.target.value })
                    }
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bandeira
                  </label>
                  <select
                    value={editingCard.nmBandeira || 'Mastercard'}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, nmBandeira: e.target.value })
                    }
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Últimos 4 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 4892"
                    value={editingCard.nrUltimosDigitos || ''}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, nrUltimosDigitos: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 5000"
                    value={editingCard.vlLimiteTotal || 5000}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        vlLimiteTotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Fechamento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="5"
                    value={editingCard.nrDiaFechamento || 5}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        nrDiaFechamento: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Dia em que a fatura fecha.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="12"
                    value={editingCard.nrDiaVencimento || 12}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        nrDiaVencimento: parseInt(e.target.value) || 12,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Dia em que a fatura vence.</p>
                </div>
              </div>

              {/* Estilo Visual */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ea2a33]" /> Estilo / Tema Visual
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setEditingCard({ ...editingCard, dsCorCard: c.value })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        (editingCard.dsCorCard || COLOR_OPTIONS[0].value) === c.value
                          ? 'border-white bg-white/15 text-white font-bold'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-gradient-to-r ${c.value} shrink-0`}></div>
                      <span className="text-xs truncate">{c.label}</span>
                    </button>
                  ))}
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingCard.cdCartaoCredito ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
