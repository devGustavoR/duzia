'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { PagamentoModal } from '@/components/pagamento-modal';
import { fetchApi, Conta, Categoria, Ocorrencia } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  CreditCard,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  UserCheck,
  QrCode,
  HeartHandshake,
  Repeat,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContasPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Conta> | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedOcForPayment, setSelectedOcForPayment] = useState<Ocorrencia | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contasRes, catRes] = await Promise.all([
        fetchApi<Conta[]>('/contas'),
        fetchApi<Categoria[]>('/categorias'),
      ]);
      setContas(contasRes);
      setCategorias(catRes);
    } catch (err) {
      toast.error('Erro ao carregar contas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nmConta || !editingItem?.vlValor) {
      toast.error('Preencha o nome da conta e o valor.');
      return;
    }

    setSaving(true);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const payload = {
        ...editingItem,
        snRecorrente: editingItem.snRecorrente || 'S',
        snFixo: editingItem.snFixo || 'S',
        dsFrequencia: editingItem.snRecorrente === 'N' ? 'UNICA' : 'MENSAL',
        snTerceiros: editingItem.snTerceiros || 'N',
        snReembolsado: editingItem.snReembolsado || 'S',
        vlCotaPropria: editingItem.snTerceiros === 'S' && editingItem.snReembolsado === 'S' ? 0 : Number(editingItem.vlValor),
        nrDiaVencimento: editingItem.nrDiaVencimento || 5,
        dtVencimentoInicial: editingItem.dtVencimentoInicial || todayISO,
        nrDiasAviso: editingItem.nrDiasAviso || 3,
        snAvisoAtivo: editingItem.snAvisoAtivo || 'S',
      };

      if (editingItem.cdConta) {
        await fetchApi(`/contas/${editingItem.cdConta}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Conta atualizada com sucesso!');
      } else {
        await fetchApi('/contas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Conta cadastrada!');
      }

      setModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar conta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta conta?')) return;
    try {
      await fetchApi(`/contas/${id}`, { method: 'DELETE' });
      toast.success('Conta removida.');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir conta.');
    }
  };

  // Cálculo de Cota Real (descontando contas 100% reembolsadas de terceiros)
  const totalContas = contas.reduce((acc, c) => {
    if (c.snTerceiros === 'S' && c.snReembolsado === 'S') return acc;
    return acc + Number(c.vlValor || 0);
  }, 0);

  return (
    <div>
      {/* Modal Pagamento com Comprovante */}
      <PagamentoModal
        ocorrencia={selectedOcForPayment}
        isOpen={!!selectedOcForPayment}
        onClose={() => setSelectedOcForPayment(null)}
        onSuccess={() => loadData()}
      />

      <Header
        title="Minhas Contas"
        subtitle="Gerenciamento de contas fixas, recorrentes, avulsas (1 mês) e terceiros"
      />

      {/* Overview Card */}
      <div className="glass-card rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/50 via-[#050505] to-[#050505]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Total Real de Contas do Seu Bolso
            </p>
            <p className="text-2xl font-black text-white mt-0.5">
              {formatCurrency(totalContas)}
              <span className="text-xs font-normal text-[#94a3b8] ml-1">/mês</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const todayISO = new Date().toISOString().split('T')[0];
            setEditingItem({
              snRecorrente: 'S',
              snFixo: 'S',
              dsFrequencia: 'MENSAL',
              snTerceiros: 'N',
              snReembolsado: 'S',
              nrDiaVencimento: 5,
              dtVencimentoInicial: todayISO,
              nrDiasAviso: 3,
              snAvisoAtivo: 'S',
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/25 transition-all"
        >
          <Plus className="h-4 w-4" /> Cadastrar Nova Conta
        </button>
      </div>

      {/* Grid de Contas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : contas.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-[#94a3b8]">
          <CreditCard className="h-10 w-10 mx-auto text-[#ea2a33] mb-3" />
          <p className="font-semibold text-slate-300">Nenhuma conta cadastrada</p>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre suas contas de Luz, Água, Internet ou Pagamentos para Terceiros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {contas.map((item) => (
            <div
              key={item.cdConta}
              className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">
                    {item.nmConta}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.snRecorrente === 'N' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Única (1 Mês)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        Recorrente
                      </span>
                    )}
                    {item.snTerceiros === 'S' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <HeartHandshake className="h-3 w-3" /> Terceiros
                      </span>
                    )}
                  </div>
                </div>

                {/* Tag de Conta de Terceiros / Avô */}
                {item.snTerceiros === 'S' && item.nmTitularTerceiro && (
                  <div className="text-[11px] font-medium bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 mb-3 space-y-1">
                    <p className="text-purple-200 font-bold flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5 text-purple-400" /> Pago para:{' '}
                      <span className="text-white">{item.nmTitularTerceiro}</span>
                    </p>
                    {item.snReembolsado === 'S' ? (
                      <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 100% Reembolsado via PIX (R$ 0 no seu bolso)
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Aguardando PIX de {formatCurrency(item.vlValor)} de {item.nmTitularTerceiro}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-2xl font-black text-white mb-2">
                  {formatCurrency(item.vlValor)}
                  {item.snTerceiros === 'S' && item.snReembolsado === 'S' && (
                    <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                      (Cota do seu bolso: R$ 0,00)
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-[#94a3b8]">
                  <p>
                    Vencimento:{' '}
                    <strong className="text-slate-200">
                      {item.snRecorrente === 'N' && item.dtVencimentoInicial
                        ? formatDateBR(item.dtVencimentoInicial)
                        : `Todo Dia ${item.nrDiaVencimento || 5}`}
                    </strong>
                  </p>
                  {item.categoria?.nmCategoria && (
                    <p className="text-slate-400">Categoria: {item.categoria.nmCategoria}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/10">
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
                  onClick={() => handleDelete(item.cdConta)}
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

      {/* Modal Cadastro / Edição de Conta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingItem?.cdConta ? 'Editar Conta' : 'Nova Conta'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nio, Conta Claro do Avô, Energia"
                  value={editingItem?.nmConta || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nmConta: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              {/* Seção Recorrência vs Única (1 Mês) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Tipo de Cobrança / Recorrência *
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="recorrenciaRadio"
                      checked={editingItem?.snRecorrente !== 'N'}
                      onChange={() =>
                        setEditingItem({
                          ...editingItem,
                          snRecorrente: 'S',
                        })
                      }
                      className="accent-[#ea2a33]"
                    />
                    <span className="font-semibold text-white">Recorrente (Todo Mês)</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="recorrenciaRadio"
                      checked={editingItem?.snRecorrente === 'N'}
                      onChange={() =>
                        setEditingItem({
                          ...editingItem,
                          snRecorrente: 'N',
                        })
                      }
                      className="accent-blue-500"
                    />
                    <span className="font-semibold text-blue-400">Conta Única / Apenas 1 Mês (Avulsa)</span>
                  </label>
                </div>
              </div>

              {/* Seção Especial de Conta de Terceiros / Reembolsada via PIX */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem?.snTerceiros === 'S'}
                    onChange={(e) => {
                      const isThirdParty = e.target.checked;
                      setEditingItem({
                        ...editingItem,
                        snTerceiros: isThirdParty ? 'S' : 'N',
                        nmTitularTerceiro: isThirdParty ? (editingItem?.nmTitularTerceiro || 'Vovô') : '',
                        snReembolsado: 'S',
                      });
                    }}
                    className="h-4 w-4 rounded accent-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <HeartHandshake className="h-4 w-4 text-purple-400" /> Esta conta é de terceiros / reembolsada? (ex: Avô enviou PIX)
                  </span>
                </label>

                {editingItem?.snTerceiros === 'S' && (
                  <div className="space-y-3 pt-2 border-t border-purple-500/20 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Para quem você está pagando? *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Vovô, Mãe, Amigo"
                        value={editingItem?.nmTitularTerceiro || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            nmTitularTerceiro: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Status do Dinheiro enviado via PIX:
                      </label>
                      <div className="flex gap-3 text-xs">
                        <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="reembolsadoRadio"
                            checked={editingItem?.snReembolsado === 'S'}
                            onChange={() =>
                              setEditingItem({
                                ...editingItem,
                                snReembolsado: 'S',
                              })
                            }
                            className="accent-emerald-500"
                          />
                          <span className="text-emerald-400 font-bold">100% Reembolsado (R$ 0 do seu bolso)</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="reembolsadoRadio"
                            checked={editingItem?.snReembolsado === 'N'}
                            onChange={() =>
                              setEditingItem({
                                ...editingItem,
                                snReembolsado: 'N',
                              })
                            }
                            className="accent-amber-500"
                          />
                          <span className="text-amber-400 font-bold">Aguardando PIX dele</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total da Conta (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={editingItem?.vlValor || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlValor: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                {editingItem?.snRecorrente === 'N' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Data do Vencimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingItem?.dtVencimentoInicial || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          dtVencimentoInicial: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Dia do Vencimento Mensal *
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
                          nrDiaVencimento: parseInt(e.target.value, 10) || 5,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={editingItem?.cdCategoria || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      cdCategoria: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                >
                  <option value="">Selecione uma categoria (opcional)</option>
                  {categorias.map((cat) => (
                    <option key={cat.cdCategoria} value={cat.cdCategoria}>
                      {cat.nmCategoria}
                    </option>
                  ))}
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
                  {saving ? 'Salvando...' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
