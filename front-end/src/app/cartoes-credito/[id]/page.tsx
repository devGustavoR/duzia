'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { fetchApi, CartaoCredito, CartaoCreditoCompra } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Settings,
  Trash2,
  Calendar,
  DollarSign,
  Search,
  Zap,
  ShoppingBag,
  Palette,
  Sparkles,
  Tag,
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

export default function CartaoCreditoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const cardId = resolvedParams.id;
  const router = useRouter();

  const [card, setCard] = useState<CartaoCredito | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<CartaoCredito>>({});
  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [novaCompra, setNovaCompra] = useState<{
    dsCompra: string;
    vlTotal: number;
    nrParcelas: number;
    dtCompra: string;
    nmCategoria: string;
  }>({
    dsCompra: '',
    vlTotal: 0,
    nrParcelas: 1,
    dtCompra: new Date().toISOString().split('T')[0],
    nmCategoria: 'Geral',
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCard = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<CartaoCredito>(`/cartao-credito/${cardId}`);
      if (res && res.cdCartaoCredito) {
        setCard(res);
        setEditingCard(res);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Erro ao carregar cartão da API, buscando do localStorage:', err);
    }

    // Fallback local
    try {
      const saved = localStorage.getItem('duzia_cartoes_credito_v3');
      if (saved) {
        const list: CartaoCredito[] = JSON.parse(saved);
        const found = list.find((c) => Number(c.cdCartaoCredito) === Number(cardId));
        if (found) {
          setCard(found);
          setEditingCard(found);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setLoading(false);
  };

  useEffect(() => {
    loadCard();
  }, [cardId]);

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
        body: JSON.stringify({ ...editingCard, cdCartaoCredito: Number(cardId) }),
      });
      toast.success('Cartão de crédito atualizado!');
      setEditModalOpen(false);
      loadCard();
    } catch (err: any) {
      toast.error('Erro ao salvar cartão.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Deseja realmente remover este cartão de crédito?')) return;
    try {
      await fetchApi(`/cartao-credito/${cardId}`, { method: 'DELETE' });
      toast.success('Cartão de crédito removido.');
      router.push('/cartoes-credito');
    } catch (err: any) {
      toast.error('Erro ao remover cartão.');
    }
  };

  const handleAddCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCompra.dsCompra || !novaCompra.vlTotal) {
      toast.error('Informe a descrição e o valor da compra.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi(`/cartao-credito/${cardId}/compra`, {
        method: 'POST',
        body: JSON.stringify(novaCompra),
      });
      toast.success('Compra adicionada à fatura do cartão!');
      setCompraModalOpen(false);
      setNovaCompra({
        dsCompra: '',
        vlTotal: 0,
        nrParcelas: 1,
        dtCompra: new Date().toISOString().split('T')[0],
        nmCategoria: 'Geral',
      });
      loadCard();
    } catch (err: any) {
      toast.error('Erro ao lançar compra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompra = async (cdCompra: number) => {
    if (!confirm('Remover esta compra da fatura do cartão?')) return;
    try {
      await fetchApi(`/cartao-credito/compra/${cdCompra}`, { method: 'DELETE' });
      toast.success('Compra removida.');
      loadCard();
    } catch (err: any) {
      toast.error('Erro ao remover compra.');
    }
  };

  const compras = card?.compras || [];
  const comprasFiltradas = compras.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.dsCompra.toLowerCase().includes(term) ||
      item.nmCategoria.toLowerCase().includes(term) ||
      item.dtCompra.includes(term)
    );
  });

  const limiteTotal = Number(card?.vlLimiteTotal || 0);
  const limiteUsado = Number(card?.vlLimiteUsado || 0);
  const limiteDisponivel = Math.max(0, limiteTotal - limiteUsado);
  const pctUsado = limiteTotal > 0 ? (limiteUsado / limiteTotal) * 100 : 0;
  const bgGradient = card?.dsCorCard || COLOR_OPTIONS[0].value;

  // Melhor dia de compra
  const diaFechamento = card?.nrDiaFechamento || 5;
  const diaMelhorCompra = diaFechamento === 31 ? 1 : diaFechamento + 1;

  return (
    <div className="space-y-8 pb-12">
      {/* Voltar */}
      <div>
        <Link
          href="/cartoes-credito"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Cartões de Crédito
        </Link>
        <Header
          title={card?.nmCartao || 'Detalhes do Cartão'}
          subtitle={`${card?.nmBanco || ''} · ${card?.nmBandeira || ''} (•••• ${card?.nrUltimosDigitos || '****'})`}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : (
        <>
          {/* Header Card Mockup & Métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Card Preview */}
            <div className={`lg:col-span-1 glass-card rounded-2xl p-6 border border-white/20 bg-gradient-to-tr ${bgGradient} relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[230px]`}>
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-white tracking-wider block uppercase truncate max-w-[150px]">
                        {card?.nmCartao}
                      </span>
                      <span className="text-[10px] text-white/70 font-semibold">
                        {card?.nmBanco} · {card?.nmBandeira}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                      title="Editar Cartão"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleDeleteCard}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition-colors"
                      title="Excluir Cartão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-white/60 uppercase tracking-widest block">
                      Número do Cartão
                    </span>
                    <span className="text-lg font-mono font-bold text-white tracking-widest mt-0.5 block">
                      •••• •••• •••• {card?.nrUltimosDigitos || '••••'}
                    </span>
                  </div>
                  <div className="h-7 w-9 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center shadow-inner">
                    <div className="h-4 w-6 border-r border-b border-amber-600/40 rounded-sm"></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-end justify-between text-xs text-white">
                <div>
                  <span className="text-[10px] text-white/60 block uppercase">Limite Total</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(limiteTotal)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/60 block uppercase">Disponível</span>
                  <span className="text-lg font-bold text-emerald-400">{formatCurrency(limiteDisponivel)}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Fatura Usada */}
              <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 to-transparent flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-rose-400" /> Fatura Atual (Usado)
                  </span>
                  <p className="text-3xl font-black text-rose-400 mt-2">
                    {formatCurrency(limiteUsado)}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pctUsado)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {pctUsado.toFixed(1)}% do limite utilizado
                  </span>
                </div>
              </div>

              {/* Melhor Dia para Compra */}
              <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-transparent flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-400" /> Melhor Dia de Compra
                  </span>
                  <p className="text-2xl font-black text-amber-300 mt-2">
                    Dia {diaMelhorCompra}
                  </p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Fatura fecha no dia {card?.nrDiaFechamento}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Vencimento no dia {card?.nrDiaVencimento}
                </p>
              </div>

              {/* Total de Compras */}
              <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-[#ea2a33]" /> Compras Registradas
                  </span>
                  <p className="text-3xl font-black text-white mt-2">{compras.length}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Lançamentos na fatura deste cartão
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Lançamentos & Compras do Cartão */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Lançamentos da Fatura</h2>
                  <p className="text-xs text-slate-400">
                    Compras realizadas e parcelamentos no cartão {card?.nmCartao}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar compras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ea2a33] w-48 sm:w-64"
                  />
                </div>

                <button
                  onClick={() => setCompraModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold transition-all shadow-md shadow-[#ea2a33]/20 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Lançar Compra
                </button>
              </div>
            </div>

            {comprasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="h-10 w-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">Nenhuma compra registrada nesta fatura.</p>
                <p className="text-xs text-slate-500">
                  Clique em "+ Lançar Compra" para registrar compras neste cartão.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Descrição da Compra</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4 text-center">Parcelamento</th>
                      <th className="py-3 px-4 text-right">Valor da Parcela</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comprasFiltradas.map((compra) => (
                      <tr
                        key={compra.cdCompra}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {compra.dsCompra}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10 font-medium text-[11px] inline-flex items-center gap-1">
                            <Tag className="h-3 w-3 text-[#ea2a33]" /> {compra.nmCategoria}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {new Date(compra.dtCompra + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-amber-300">
                          {compra.nrParcelas > 1 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                              {compra.nrParcelaAtual}/{compra.nrParcelas}x
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">À vista</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-rose-400 text-sm">
                          {formatCurrency(compra.vlParcela)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-slate-300 text-sm">
                          {formatCurrency(compra.vlTotal)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCompra(compra.cdCompra)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors"
                            title="Remover Compra"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Lançar Nova Compra */}
      {compraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#ea2a33]" /> Lançar Compra no Cartão
              </h2>
              <button
                onClick={() => setCompraModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompra} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição da Compra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amazon - Monitor Gamer LG"
                  value={novaCompra.dsCompra}
                  onChange={(e) => setNovaCompra({ ...novaCompra, dsCompra: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 1200.00"
                    value={novaCompra.vlTotal || ''}
                    onChange={(e) =>
                      setNovaCompra({ ...novaCompra, vlTotal: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nº de Parcelas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    placeholder="1"
                    value={novaCompra.nrParcelas}
                    onChange={(e) =>
                      setNovaCompra({ ...novaCompra, nrParcelas: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={novaCompra.dtCompra}
                    onChange={(e) => setNovaCompra({ ...novaCompra, dtCompra: e.target.value })}
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Eletrônicos, Mercado..."
                    value={novaCompra.nmCategoria}
                    onChange={(e) => setNovaCompra({ ...novaCompra, nmCategoria: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCompraModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Lançando...' : 'Lançar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cartão de Crédito */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#ea2a33]" /> Editar Cartão de Crédito
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
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
                  value={editingCard.nmCartao || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, nmCartao: e.target.value })}
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
                    onChange={(e) => setEditingCard({ ...editingCard, nmBanco: e.target.value })}
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
                    onChange={(e) => setEditingCard({ ...editingCard, nmBandeira: e.target.value })}
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
                    value={editingCard.nrUltimosDigitos || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, nrUltimosDigitos: e.target.value })}
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
                    value={editingCard.nrDiaFechamento || 5}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        nrDiaFechamento: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={editingCard.nrDiaVencimento || 12}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        nrDiaVencimento: parseInt(e.target.value) || 12,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ea2a33]" /> Estilo Visual
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
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
