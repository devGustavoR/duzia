'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, MetaCompra } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  Target,
  PiggyBank,
  CheckCircle2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MetasPage() {
  const [metas, setMetas] = useState<MetaCompra[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Partial<MetaCompra> | null>(null);

  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [targetMeta, setTargetMeta] = useState<MetaCompra | null>(null);
  const [valorAporte, setValorAporte] = useState('');

  const loadMetas = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<MetaCompra[]>('/metas');
      setMetas(res);
    } catch (err) {
      toast.error('Erro ao carregar metas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetas();
  }, []);

  const [saving, setSaving] = useState(false);
  const [savingAporte, setSavingAporte] = useState(false);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeta?.nmMeta || !editingMeta?.vlAlvo) {
      toast.error('Preencha o nome e o valor da meta.');
      return;
    }

    setSaving(true);
    try {
      if (editingMeta.cdMeta) {
        await fetchApi(`/metas/${editingMeta.cdMeta}`, {
          method: 'PUT',
          body: JSON.stringify(editingMeta),
        });
        toast.success('Meta atualizada!');
      } else {
        await fetchApi('/metas', {
          method: 'POST',
          body: JSON.stringify({
            ...editingMeta,
            vlPoupado: editingMeta.vlPoupado || 0,
          }),
        });
        toast.success('Meta criada!');
      }
      setModalOpen(false);
      setEditingMeta(null);
      loadMetas();
    } catch (err) {
      toast.error('Erro ao salvar meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valorAporte);
    if (!targetMeta || !numVal || numVal <= 0) {
      toast.error('Informe um valor válido de aporte.');
      return;
    }

    setSavingAporte(true);
    try {
      await fetchApi(`/metas/${targetMeta.cdMeta}/aportar`, {
        method: 'POST',
        body: JSON.stringify({ valor: numVal }),
      });
      toast.success(`Aporte de ${formatCurrency(numVal)} adicionado à meta!`);
      setAporteModalOpen(false);
      setTargetMeta(null);
      setValorAporte('');
      loadMetas();
    } catch (err) {
      toast.error('Erro ao realizar aporte.');
    } finally {
      setSavingAporte(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta meta?')) return;
    try {
      await fetchApi(`/metas/${id}`, { method: 'DELETE' });
      toast.success('Meta excluída.');
      loadMetas();
    } catch (err) {
      toast.error('Erro ao excluir meta.');
    }
  };

  return (
    <div>
      <Header
        title="Metas de Compra"
        subtitle="Defina objetivos de consumo, guarde dinheiro e acompanhe seu progresso"
      />

      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditingMeta({ vlPoupado: 0 });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/25 transition-all"
        >
          <Plus className="h-4 w-4" /> Nova Meta de Compra
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : metas.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-[#94a3b8]">
          <Target className="h-10 w-10 mx-auto text-[#ea2a33] mb-3" />
          <p className="font-semibold text-slate-300">Nenhuma meta cadastrada</p>
          <p className="text-xs text-slate-500 mt-1">
            Planeje compras como um novo notebook, viagem ou reserva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {metas.map((meta) => {
            const poupado = Number(meta.vlPoupado || 0);
            const alvo = Number(meta.vlAlvo || 1);
            const pct = Math.min(100, Math.round((poupado / alvo) * 100));
            const isCompleted = meta.snConcluida === 'S' || pct >= 100;

            return (
              <div
                key={meta.cdMeta}
                className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-white">
                      {meta.nmMeta}
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Concluída
                      </span>
                    ) : (
                      <span className="text-xs font-black text-emerald-400">
                        {pct}%
                      </span>
                    )}
                  </div>

                  {meta.dsObservacao && (
                    <p className="text-xs text-[#94a3b8] mb-3">{meta.dsObservacao}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 rounded-full h-2.5 my-3 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-[#ea2a33] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-baseline text-xs text-[#94a3b8] mt-2">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-500">Poupado</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(poupado)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-slate-500">Objetivo</span>
                      <span className="text-sm font-bold text-slate-200">
                        {formatCurrency(alvo)}
                      </span>
                    </div>
                  </div>

                  {meta.dtPrazo && (
                    <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-[#94a3b8]">
                      Prazo: <span className="text-slate-300 font-semibold">{formatDateBR(meta.dtPrazo)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setTargetMeta(meta);
                      setAporteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <PiggyBank className="h-3.5 w-3.5" /> Guardar Dinheiro
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingMeta(meta);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(meta.cdMeta)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingMeta?.cdMeta ? 'Editar Meta' : 'Nova Meta de Compra'}
            </h2>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Meta / Objetivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MacBook Pro, Viagem de Fim de Ano"
                  value={editingMeta?.nmMeta || ''}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, nmMeta: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Alvo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={editingMeta?.vlAlvo || ''}
                    onChange={(e) =>
                      setEditingMeta({
                        ...editingMeta,
                        vlAlvo: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Já Poupado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editingMeta?.vlPoupado || ''}
                    onChange={(e) =>
                      setEditingMeta({
                        ...editingMeta,
                        vlPoupado: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data Limite / Prazo
                </label>
                <input
                  type="date"
                  value={editingMeta?.dtPrazo || ''}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, dtPrazo: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Guardar Dinheiro / Aporte */}
      {aporteModalOpen && targetMeta && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">
              Guardar Dinheiro
            </h2>
            <p className="text-xs text-[#94a3b8] mb-4">
              Meta: <span className="text-emerald-400 font-bold">{targetMeta.nmMeta}</span>
            </p>

            <form onSubmit={handleAporte} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor a guardar (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  placeholder="100.00"
                  value={valorAporte}
                  onChange={(e) => setValorAporte(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAporteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAporte}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAporte ? 'Salvando...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
