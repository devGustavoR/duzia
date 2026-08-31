'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { fetchApi, CartaoConfig } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Bus,
  CreditCard,
  Plus,
  ArrowRight,
  Settings,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const COLOR_OPTIONS = [
  { label: 'Vermelho SalvadorCARD', value: 'from-[#ea2a33] to-[#4a0404]' },
  { label: 'Azul Metropolitano', value: 'from-blue-600 to-indigo-950' },
  { label: 'Verde Vale Transporte', value: 'from-emerald-600 to-teal-950' },
  { label: 'Roxo Estudantil', value: 'from-purple-600 to-slate-950' },
  { label: 'Dourado Premium', value: 'from-amber-500 to-stone-900' },
];

export default function CartoesListPage() {
  const [cartoes, setCartoes] = useState<CartaoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<CartaoConfig>>({});
  const [saving, setSaving] = useState(false);

  const loadCartoes = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<CartaoConfig[]>('/cartao');
      setCartoes(res);
    } catch (err: any) {
      toast.error('Erro ao carregar a lista de cartões.');
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
      numeroCartao: '',
      idOperadora: 1,
      vlSaldoMinimo: 15,
      dsCorCard: 'from-[#ea2a33] to-[#4a0404]',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (card: CartaoConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setModalOpen(true);
  };

  const handleDeleteCard = async (cdCartao: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja remover este cartão?')) return;

    try {
      await fetchApi(`/cartao/${cdCartao}`, { method: 'DELETE' });
      toast.success('Cartão removido com sucesso.');
      loadCartoes();
    } catch (err: any) {
      toast.error('Erro ao remover cartão.');
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard.numeroCartao || !editingCard.nmCartao) {
      toast.error('Preencha o nome e o número do cartão.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/cartao', {
        method: 'POST',
        body: JSON.stringify(editingCard),
      });
      toast.success(editingCard.cdCartao ? 'Cartão atualizado!' : 'Novo cartão adicionado!');
      setModalOpen(false);
      loadCartoes();
    } catch (err: any) {
      toast.error('Erro ao salvar cartão: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <Header
        title="Meus Cartões de Passagem"
        subtitle="Gerencie seus cartões de transporte, acompanhe os saldos e consulte detalhes das últimas viagens"
      />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#ea2a33]" /> Cartões Cadastrados
          </h2>
          <p className="text-xs text-slate-400">
            Clique em qualquer cartão para abrir a página exclusiva de extrato e detalhes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadCartoes}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar Saldos Live
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold transition-all shadow-lg shadow-[#ea2a33]/25"
          >
            <Plus className="h-4 w-4" /> Adicionar Novo Cartão
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : cartoes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-4 border border-white/10">
          <Bus className="h-12 w-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">Nenhum cartão cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Adicione seu cartão de passagem (SalvadorCARD, Metrô ou Vale Transporte) para acompanhar seu saldo e extrato.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea2a33] text-white text-xs font-bold shadow-md"
          >
            <Plus className="h-4 w-4" /> Cadastrar Meu Primeiro Cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((card) => {
            const saldo = Number(card.vlSaldoAtual || 0);
            const saldoMinimo = Number(card.vlSaldoMinimo || 15);
            const isSaldoBaixo = saldo < saldoMinimo;
            const bgGradient = card.dsCorCard || 'from-[#ea2a33] to-[#4a0404]';

            return (
              <div
                key={card.cdCartao}
                className={`glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-tr ${bgGradient} relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#ea2a33]/50 group cursor-pointer`}
              >
                {/* Efeito de brilho de fundo */}
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                <div>
                  {/* Top Header Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                        <Bus className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-extrabold tracking-wider text-white uppercase truncate max-w-[150px]">
                        {card.nmCartao}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isSaldoBaixo
                            ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                            : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                        }`}
                      >
                        {isSaldoBaixo ? 'Saldo Baixo' : 'Ativo'}
                      </span>

                      <button
                        onClick={(e) => handleOpenEditModal(card, e)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Editar Cartão"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>

                      {cartoes.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteCard(card.cdCartao, e)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition-colors"
                          title="Remover Cartão"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Número do Cartão */}
                  <div className="my-4">
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest block">
                      Número do Cartão
                    </span>
                    <span className="text-lg font-mono font-bold tracking-widest text-white mt-0.5 block">
                      {card.numeroCartao}
                    </span>
                  </div>

                  {/* ÚLTIMA LINHA */}
                  {card.dsUltimaLinha && (
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 mb-4 flex items-center justify-between text-xs text-slate-200">
                      <span className="font-semibold flex items-center gap-1 text-slate-300">
                        <Bus className="h-3.5 w-3.5 text-[#ea2a33]" /> Último uso:
                      </span>
                      <span className="font-bold text-white">Linha {card.dsUltimaLinha}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-white/15 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase block font-medium">
                      Saldo Disponível
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {formatCurrency(saldo)}
                    </span>
                  </div>

                  <Link
                    href={`/cartoes/${card.cdCartao}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-bold shadow-md transition-all group-hover:translate-x-1"
                  >
                    Ver Detalhes <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Cartão */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#ea2a33]" />
                {editingCard.cdCartao ? 'Editar Cartão' : 'Novo Cartão de Passagem'}
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
                  Nome / Identificação do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SalvadorCARD Estudante"
                  value={editingCard.nmCartao || ''}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, nmCartao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 036500336819453"
                  value={editingCard.numeroCartao || ''}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, numeroCartao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Número impresso na frente ou verso do cartão.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ID Operadora
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={editingCard.idOperadora || 1}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        idOperadora: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saldo Mínimo (Alerta R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={editingCard.vlSaldoMinimo || 15}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        vlSaldoMinimo: parseFloat(e.target.value) || 15,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              {/* Escolha do Estilo Visual */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ea2a33]" /> Cor / Estilo do Cartão
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

              {/* Token KIM */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-rose-300">
                  KIM Token (ID Token / Access Token)
                </label>
                <textarea
                  rows={2}
                  placeholder="Cole aqui o token do KIM para este cartão..."
                  value={editingCard.tokenKim || ''}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, tokenKim: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#ea2a33]"
                />
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
                  {saving ? 'Salvando...' : editingCard.cdCartao ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
