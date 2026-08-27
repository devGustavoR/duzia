'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import {
  fetchApi,
  Evento,
  EventoItem,
  EventoProjecao,
} from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  CalendarHeart,
  CalendarClock,
  Trash2,
  Pencil,
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

const d = (s?: string | null) => (s ? s.split('T')[0] : '');

const STATUS_META: Record<
  EventoItem['snStatus'],
  { label: string; cls: string }
> = {
  PLANEJADO: { label: 'Planejado', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  COMPRADO: { label: 'Comprado', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  PAGO: { label: 'Pago', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [projecao, setProjecao] = useState<EventoProjecao | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProj, setLoadingProj] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Partial<Evento> | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<EventoItem> | null>(null);

  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi<Evento[]>('/eventos');
      setEventos(res);
      setSelectedId((prev) => prev ?? res[0]?.cdEvento ?? null);
    } catch (err) {
      toast.error('Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjecao = useCallback(async (id: number) => {
    try {
      setLoadingProj(true);
      const res = await fetchApi<EventoProjecao>(`/eventos/${id}/projecao`);
      setProjecao(res);
    } catch (err) {
      toast.error('Erro ao carregar a projeção do evento.');
      setProjecao(null);
    } finally {
      setLoadingProj(false);
    }
  }, []);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  useEffect(() => {
    if (selectedId) loadProjecao(selectedId);
  }, [selectedId, loadProjecao]);

  const refresh = () => {
    loadEventos();
    if (selectedId) loadProjecao(selectedId);
  };

  // --- Evento CRUD ---
  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvento?.nmEvento || !editingEvento?.dtEvento) {
      toast.error('Preencha o nome e a data do evento.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nmEvento: editingEvento.nmEvento,
        dtEvento: editingEvento.dtEvento,
        dsObservacao: editingEvento.dsObservacao || null,
      };
      if (editingEvento.cdEvento) {
        await fetchApi(`/eventos/${editingEvento.cdEvento}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Evento atualizado!');
      } else {
        const novo = await fetchApi<Evento>('/eventos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSelectedId(novo.cdEvento);
        toast.success('Evento criado!');
      }
      setEventoModalOpen(false);
      setEditingEvento(null);
      refresh();
    } catch (err) {
      toast.error('Erro ao salvar evento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvento = async (id: number) => {
    if (!confirm('Excluir este evento e todos os seus itens?')) return;
    try {
      await fetchApi(`/eventos/${id}`, { method: 'DELETE' });
      toast.success('Evento excluído.');
      if (selectedId === id) {
        setSelectedId(null);
        setProjecao(null);
      }
      loadEventos();
    } catch (err) {
      toast.error('Erro ao excluir evento.');
    }
  };

  // --- Item CRUD ---
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editingItem?.dsItem) {
      toast.error('Informe a descrição do gasto.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        dsItem: editingItem.dsItem,
        nmCategoria: editingItem.nmCategoria || null,
        vlEstimado: editingItem.vlEstimado || 0,
        vlReal:
          editingItem.vlReal === undefined || editingItem.vlReal === null
            ? null
            : editingItem.vlReal,
        dtPrevista: editingItem.dtPrevista || null,
        snStatus: editingItem.snStatus || 'PLANEJADO',
        snReembolsavel: editingItem.snReembolsavel || 'N',
      };
      if (editingItem.cdItem) {
        await fetchApi(`/eventos/itens/${editingItem.cdItem}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Gasto atualizado!');
      } else {
        await fetchApi(`/eventos/${selectedId}/itens`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Gasto adicionado!');
      }
      setItemModalOpen(false);
      setEditingItem(null);
      refresh();
    } catch (err) {
      toast.error('Erro ao salvar gasto.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (item: EventoItem, status: EventoItem['snStatus']) => {
    try {
      await fetchApi(`/eventos/itens/${item.cdItem}`, {
        method: 'PUT',
        body: JSON.stringify({ snStatus: status }),
      });
      refresh();
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Excluir este gasto?')) return;
    try {
      await fetchApi(`/eventos/itens/${id}`, { method: 'DELETE' });
      toast.success('Gasto excluído.');
      refresh();
    } catch (err) {
      toast.error('Erro ao excluir gasto.');
    }
  };

  const selectedEvento = eventos.find((ev) => ev.cdEvento === selectedId) || null;
  const itens = projecao?.evento.itens || [];
  const folgaNegativa = (projecao?.folgaAposEvento ?? 0) < 0;
  const timelineMax = Math.max(
    1,
    ...(projecao?.timeline || []).map((t) => t.total),
  );

  return (
    <div>
      <Header
        title="Preparação para o Dia"
        subtitle="Planeje os gastos até uma data importante e veja quanto sobra da sua renda no período"
      />

      {/* Seletor de eventos */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {loading ? (
          <div className="h-9 w-40 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
        ) : (
          eventos.map((ev) => (
            <button
              key={ev.cdEvento}
              onClick={() => setSelectedId(ev.cdEvento)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                ev.cdEvento === selectedId
                  ? 'bg-[#ea2a33] text-white border-[#ea2a33] shadow-sm shadow-[#ea2a33]/30'
                  : 'bg-white/5 text-[#94a3b8] border-white/10 hover:text-white'
              }`}
            >
              <CalendarHeart className="h-3.5 w-3.5" />
              {ev.nmEvento}
              <span className="opacity-70 font-normal">{formatDateBR(d(ev.dtEvento))}</span>
            </button>
          ))
        )}
        <button
          onClick={() => {
            setEditingEvento({ nmEvento: '', dtEvento: '' });
            setEventoModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 text-[#ea2a33] border border-[#ea2a33]/30 hover:bg-[#ea2a33]/10 transition-all"
        >
          <Plus className="h-4 w-4" /> Novo Evento
        </button>
      </div>

      {!loading && eventos.length === 0 && (
        <div className="glass-card rounded-2xl p-12 border border-white/10 text-center text-[#94a3b8]">
          <Gift className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-white">Nenhum evento planejado ainda.</p>
          <p className="text-xs mt-1">
            Crie um evento (aniversário, viagem, data especial) e liste os gastos previstos.
          </p>
        </div>
      )}

      {selectedEvento && (
        <div className="space-y-6">
          {/* Cabeçalho do evento */}
          <div className="glass-card rounded-2xl p-6 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/50 via-[#050505] to-[#050505] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-[#ea2a33]/30 shrink-0">
                <CalendarHeart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">{selectedEvento.nmEvento}</h1>
                <p className="text-sm text-slate-300 font-medium mt-0.5">
                  {formatDateBR(d(selectedEvento.dtEvento))}
                  {projecao && (
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                      {projecao.diasRestantes === 0
                        ? 'É hoje!'
                        : `faltam ${projecao.diasRestantes} dia${projecao.diasRestantes === 1 ? '' : 's'}`}
                    </span>
                  )}
                </p>
                {selectedEvento.dsObservacao && (
                  <p className="text-xs text-[#94a3b8] mt-1.5">{selectedEvento.dsObservacao}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setEditingEvento({
                    ...selectedEvento,
                    dtEvento: d(selectedEvento.dtEvento),
                  });
                  setEventoModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => handleDeleteEvento(selectedEvento.cdEvento)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10"
                title="Excluir evento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* KPIs de projeção */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <span className="text-xs font-semibold uppercase text-[#94a3b8]">
                Custo total da preparação
              </span>
              <p className="text-2xl font-black text-white mt-2">
                {formatCurrency(projecao?.custoEventoTotal || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {itens.length} gasto{itens.length === 1 ? '' : 's'} listado{itens.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <span className="text-xs font-semibold uppercase text-[#94a3b8]">Já gasto</span>
              <p className="text-2xl font-black text-emerald-400 mt-2">
                {formatCurrency(projecao?.custoEventoPago || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Itens marcados como pagos</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <span className="text-xs font-semibold uppercase text-[#94a3b8]">Falta gastar</span>
              <p className="text-2xl font-black text-amber-400 mt-2">
                {formatCurrency(projecao?.custoEventoRestante || 0)}
              </p>
              {(projecao?.reembolsavelPendente ?? 0) > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {formatCurrency(projecao!.reembolsavelPendente)} reembolsável
                </p>
              )}
            </div>
            <div
              className={`glass-card p-5 rounded-2xl border flex flex-col justify-between ${
                folgaNegativa
                  ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/50 to-[#050505]'
                  : 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-[#050505]'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-[#94a3b8] flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> Folga após o evento
                </span>
                <p
                  className={`text-2xl font-black mt-2 ${
                    folgaNegativa ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(projecao?.folgaAposEvento || 0)}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {folgaNegativa
                  ? 'Seus gastos do mês + evento passam da sua renda.'
                  : 'Sobra estimada da renda do mês depois de tudo.'}
              </p>
            </div>
          </div>

          {/* Card de projeção detalhada */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-[#ea2a33]" /> Projeção de caixa do mês
            </h2>
            {loadingProj ? (
              <div className="py-6 text-center text-sm text-[#94a3b8] animate-pulse">
                Calculando projeção...
              </div>
            ) : projecao ? (
              <>
                <div className="space-y-2 text-sm max-w-xl">
                  <Row label="Renda mensal estimada" value={projecao.rendaMensalEstimada} tone="pos" />
                  <Row
                    label="− Contas e assinaturas do mês"
                    value={-projecao.gastosFixosMes}
                    tone="neg"
                  />
                  <Row
                    label="− Parcelas (Pix Parcelado + Dívidas)"
                    value={-projecao.parcelasMes}
                    tone="neg"
                  />
                  <div className="border-t border-white/10 my-1" />
                  <Row label="= Sobra da renda do mês" value={projecao.sobraDoMes} tone="neutral" bold />
                  <Row
                    label="− Gastos restantes do evento"
                    value={-projecao.custoEventoRestante}
                    tone="neg"
                  />
                  <div className="border-t border-white/10 my-1" />
                  <Row
                    label="= Folga após o evento"
                    value={projecao.folgaAposEvento}
                    tone={folgaNegativa ? 'neg' : 'pos'}
                    bold
                  />
                </div>

                <div className="mt-4 text-[11px] text-[#94a3b8] bg-white/5 p-2.5 rounded-xl border border-white/10">
                  Até o dia <strong className="text-white">{formatDateBR(d(selectedEvento.dtEvento))}</strong> você
                  ainda tem <strong className="text-white">{formatCurrency(projecao.gastosAntesDoEvento)}</strong> a
                  desembolsar (contas pendentes + gastos do evento). {projecao.premissas}
                </div>

                {folgaNegativa && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: com os gastos atuais você fecha o mês{' '}
                      <strong>{formatCurrency(Math.abs(projecao.folgaAposEvento))}</strong> no vermelho.
                      Reduza itens do evento ou adie compras não essenciais.
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Timeline até o dia */}
          {projecao && projecao.timeline.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <CalendarClock className="h-5 w-5 text-[#ea2a33]" /> Agenda de desembolsos até o dia
              </h2>
              <div className="space-y-2">
                {projecao.timeline.map((t) => (
                  <div key={t.data} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 w-16 shrink-0">
                      {formatDateBR(t.data).slice(0, 5)}
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden relative">
                      {t.total > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-[#ea2a33] to-rose-400 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(6, (t.total / timelineMax) * 100)}%` }}
                        >
                          <span className="text-[10px] font-bold text-white whitespace-nowrap">
                            {formatCurrency(t.total)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 w-24 shrink-0 text-right">
                      acum. {formatCurrency(t.acumulado)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-3">
                Barras somam gastos do evento (data prevista) + contas pendentes que vencem no dia.
              </p>
            </div>
          )}

          {/* Lista de gastos do evento */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#ea2a33]" /> Gastos da preparação
              </h2>
              <button
                onClick={() => {
                  setEditingItem({
                    dsItem: '',
                    vlEstimado: 0,
                    snStatus: 'PLANEJADO',
                    snReembolsavel: 'N',
                    dtPrevista: d(selectedEvento.dtEvento),
                  });
                  setItemModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ea2a33] hover:bg-[#d4222a] text-white shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Adicionar gasto
              </button>
            </div>

            {itens.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#94a3b8]">
                Nenhum gasto listado. Adicione roupa, flores, presente, unhas...
              </p>
            ) : (
              <div className="space-y-3">
                {itens.map((item) => {
                  const valor = Number(item.vlReal ?? item.vlEstimado ?? 0);
                  const meta = STATUS_META[item.snStatus];
                  return (
                    <div
                      key={item.cdItem}
                      className="glass-card glass-card-hover rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.dsItem}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                          {item.snReembolsavel === 'S' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              Reembolsável
                            </span>
                          )}
                          {item.nmCategoria && (
                            <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                              {item.nmCategoria}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-1">
                          {item.dtPrevista
                            ? `Previsto p/ ${formatDateBR(d(item.dtPrevista))}`
                            : 'Sem data prevista'}
                          {item.vlReal != null &&
                            Number(item.vlReal) !== Number(item.vlEstimado) &&
                            ` · estimado ${formatCurrency(Number(item.vlEstimado))}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                        <span className="text-sm font-black text-white">
                          {formatCurrency(valor)}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.snStatus !== 'PAGO' ? (
                            <button
                              onClick={() => handleQuickStatus(item, 'PAGO')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Marcar pago
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickStatus(item, 'PLANEJADO')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10 text-slate-300 hover:bg-white/20 transition-all"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingItem({ ...item, dtPrevista: d(item.dtPrevista) });
                              setItemModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.cdItem)}
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
        </div>
      )}

      {/* Modal Evento */}
      {eventoModalOpen && editingEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CalendarHeart className="h-5 w-5 text-[#ea2a33]" />
              {editingEvento.cdEvento ? 'Editar Evento' : 'Novo Evento'}
            </h2>
            <form onSubmit={handleSaveEvento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aniversário da Namorada"
                  value={editingEvento.nmEvento || ''}
                  onChange={(e) =>
                    setEditingEvento({ ...editingEvento, nmEvento: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data do evento *
                </label>
                <input
                  type="date"
                  required
                  value={d(editingEvento.dtEvento)}
                  onChange={(e) =>
                    setEditingEvento({ ...editingEvento, dtEvento: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observação
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes, lembretes..."
                  value={editingEvento.dsObservacao || ''}
                  onChange={(e) =>
                    setEditingEvento({ ...editingEvento, dsObservacao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEventoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Item */}
      {itemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#ea2a33]" />
              {editingItem.cdItem ? 'Editar Gasto' : 'Novo Gasto'}
            </h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Flores, Unhas dela, Roupa"
                  value={editingItem.dsItem || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, dsItem: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.00"
                    value={editingItem.vlEstimado || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlEstimado: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor real (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="opcional"
                    value={editingItem.vlReal ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlReal: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data prevista
                  </label>
                  <input
                    type="date"
                    value={d(editingItem.dtPrevista)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, dtPrevista: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Presente"
                    value={editingItem.nmCategoria || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, nmCategoria: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editingItem.snStatus || 'PLANEJADO'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        snStatus: e.target.value as EventoItem['snStatus'],
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    <option value="PLANEJADO">Planejado</option>
                    <option value="COMPRADO">Comprado</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={editingItem.snReembolsavel === 'S'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        snReembolsavel: e.target.checked ? 'S' : 'N',
                      })
                    }
                    className="h-4 w-4 rounded accent-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-300">Alguém me reembolsa</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: number;
  tone: 'pos' | 'neg' | 'neutral';
  bold?: boolean;
}) {
  const color =
    tone === 'pos'
      ? 'text-emerald-400'
      : tone === 'neg'
      ? 'text-rose-400'
      : 'text-white';
  return (
    <div className="flex items-center justify-between">
      <span className={`text-slate-300 ${bold ? 'font-bold' : ''}`}>{label}</span>
      <span className={`${color} ${bold ? 'font-black' : 'font-bold'} tabular-nums`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
