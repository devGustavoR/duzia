'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, Assinatura, CartaoCredito } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Zap,
  Users,
  UserCheck,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Assinatura> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAssinaturas = async () => {
    try {
      setLoading(true);
      const [resAssinaturas, resCartoes] = await Promise.all([
        fetchApi<Assinatura[]>('/assinaturas').catch(() => []),
        fetchApi<CartaoCredito[]>('/cartao-credito').catch(() => []),
      ]);
      setAssinaturas(resAssinaturas || []);
      setCartoes(resCartoes || []);
    } catch (err) {
      toast.error('Erro ao carregar assinaturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssinaturas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nmAssinatura || !editingItem?.vlMensalidade) {
      toast.error('Preencha o nome e o valor da sua parte na assinatura.');
      return;
    }

    setSaving(true);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const payload = {
        ...editingItem,
        dsCiclo: editingItem.dsCiclo || 'MENSAL',
        snDividida: editingItem.snDividida || 'N',
        nrDiaVencimento: editingItem.nrDiaVencimento || 5,
        dtProximaCobranca: editingItem.dtProximaCobranca || todayISO,
        nrDiasAviso: editingItem.nrDiasAviso || 3,
        snAvisoAtivo: editingItem.snAvisoAtivo || 'S',
      };

      if (editingItem.cdAssinatura) {
        await fetchApi(`/assinaturas/${editingItem.cdAssinatura}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Assinatura atualizada!');
      } else {
        await fetchApi('/assinaturas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Assinatura cadastrada!');
      }
      setModalOpen(false);
      setEditingItem(null);
      loadAssinaturas();
    } catch (err) {
      toast.error('Erro ao salvar assinatura.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta assinatura?')) return;
    try {
      await fetchApi(`/assinaturas/${id}`, { method: 'DELETE' });
      toast.success('Assinatura removida.');
      loadAssinaturas();
    } catch (err) {
      toast.error('Erro ao excluir assinatura.');
    }
  };

  const totalMensal = assinaturas.reduce((acc, a) => {
    const val = Number(a.vlMensalidade || 0);
    return acc + (a.dsCiclo === 'ANUAL' ? val / 12 : val);
  }, 0);

  return (
    <div>
      <Header
        title="Assinaturas & SaaS"
        subtitle="Controle de cartões, serviços divididos com amigos e ciclos de cobrança"
      />

      {/* Overview Metric Banner com g-hub Merlot e Red */}
      <div className="glass-card rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/50 via-[#050505] to-[#050505]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Sua Cota Recorrente Estimada
            </p>
            <p className="text-2xl font-black text-white mt-0.5">
              {formatCurrency(totalMensal)}{' '}
              <span className="text-xs font-normal text-[#94a3b8]">/mês</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const todayISO = new Date().toISOString().split('T')[0];
            setEditingItem({
              dsCiclo: 'MENSAL',
              snDividida: 'N',
              nrDiaVencimento: 5,
              dtProximaCobranca: todayISO,
              nrDiasAviso: 3,
              snAvisoAtivo: 'S',
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/25 transition-all"
        >
          <Plus className="h-4 w-4" /> Nova Assinatura
        </button>
      </div>

      {/* Grid of Subscription Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : assinaturas.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-[#94a3b8]">
          <Zap className="h-10 w-10 mx-auto text-[#ea2a33] mb-3" />
          <p className="font-semibold text-slate-300">Nenhuma assinatura cadastrada</p>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre seus serviços como Disney+, Netflix, ChatGPT, Vercel ou Spotify.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assinaturas.map((item) => (
            <div
              key={item.cdAssinatura}
              className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">
                    {item.nmAssinatura}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.snDividida === 'S' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Dividida
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                        item.dsCiclo === 'ANUAL'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30'
                      }`}
                    >
                      {item.dsCiclo}
                    </span>
                  </div>
                </div>

                {item.snDividida === 'S' && item.dsAmigosDivididos && (
                  <div className="text-[11px] font-medium text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 mb-3">
                    Dividido com: <strong className="text-white">{item.dsAmigosDivididos}</strong>
                    {item.vlTotalServico && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Plano Total: {formatCurrency(item.vlTotalServico)} (Sua parte: {formatCurrency(item.vlMensalidade)})
                      </span>
                    )}
                  </div>
                )}

                <div className="text-2xl font-black text-white mb-4">
                  {formatCurrency(item.vlMensalidade)}
                  <span className="text-xs font-normal text-[#94a3b8] ml-1">
                    /{item.dsCiclo === 'ANUAL' ? 'ano' : 'mês'} (sua cota)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#94a3b8] border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span>Dia do Vencimento:</span>
                    <span className="font-semibold text-slate-200">Dia {item.nrDiaVencimento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próxima Cobrança:</span>
                    <span className="font-semibold text-slate-200">
                      {formatDateBR(item.dtProximaCobranca)}
                    </span>
                  </div>
                  {item.nmCartaoVinculado && (
                    <div className="flex justify-between items-center text-rose-300">
                      <span>Pagamento:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {item.nmCartaoVinculado}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.cdAssinatura)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingItem?.cdAssinatura
                ? 'Editar Assinatura'
                : 'Nova Assinatura / SaaS'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Assinatura / Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Disney+, Netflix, Spotify, ChatGPT"
                  value={editingItem?.nmAssinatura || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nmAssinatura: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              {/* Checkbox para Dividir Assinatura com Amigos */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem?.snDividida === 'S'}
                    onChange={(e) => {
                      const isSplit = e.target.checked;
                      setEditingItem({
                        ...editingItem,
                        snDividida: isSplit ? 'S' : 'N',
                      });
                    }}
                    className="h-4 w-4 rounded accent-[#ea2a33]"
                  />
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-400" /> Dividir esta assinatura com amigos/familiares?
                  </span>
                </label>

                {editingItem?.snDividida === 'S' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 animate-in fade-in duration-200">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Com quem você divide? *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pedro, Lucas, Família"
                        value={editingItem?.dsAmigosDivididos || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            dsAmigosDivididos: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Valor Total Plano (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="55.90"
                        value={editingItem?.vlTotalServico || ''}
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          const cotaAmigo = editingItem?.vlCotaAmigo || total / 2;
                          const suaParte = Math.max(0, total - cotaAmigo);
                          setEditingItem({
                            ...editingItem,
                            vlTotalServico: total,
                            vlMensalidade: suaParte,
                          });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Parte do Amigo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="27.95"
                        value={editingItem?.vlCotaAmigo || ''}
                        onChange={(e) => {
                          const cotaAmigo = parseFloat(e.target.value) || 0;
                          const total = editingItem?.vlTotalServico || cotaAmigo * 2;
                          const suaParte = Math.max(0, total - cotaAmigo);
                          setEditingItem({
                            ...editingItem,
                            vlCotaAmigo: cotaAmigo,
                            vlMensalidade: suaParte,
                          });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sua Parte Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="27.95"
                    value={editingItem?.vlMensalidade || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlMensalidade: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ciclo de Cobrança
                  </label>
                  <select
                    value={editingItem?.dsCiclo || 'MENSAL'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        dsCiclo: e.target.value as 'MENSAL' | 'ANUAL',
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editingItem?.nrDiaVencimento || 5}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrDiaVencimento: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Próxima Cobrança
                  </label>
                  <input
                    type="date"
                    required
                    value={editingItem?.dtProximaCobranca || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        dtProximaCobranca: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cartão de Crédito Utilizado para Pagamento
                </label>
                <select
                  value={editingItem?.nmCartaoVinculado || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      nmCartaoVinculado: e.target.value,
                    })
                  }
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                >
                  <option value="">Nenhum (Boleto / Pix / Débito em Conta)</option>
                  {cartoes.length > 0 ? (
                    cartoes.map((c) => (
                      <option key={c.cdCartaoCredito} value={`${c.nmCartao} (${c.nmBandeira})`}>
                        {c.nmCartao} - {c.nmBanco} ({c.nmBandeira})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Neon (Visa)">Neon (Visa)</option>
                      <option value="Nubank (Mastercard)">Nubank (Mastercard)</option>
                    </>
                  )}
                </select>
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Assinatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
