'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { PagamentoModal } from '@/components/pagamento-modal';
import { fetchApi, DashboardAcademia, Academia, Ocorrencia } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Dumbbell,
  Users,
  CheckCircle2,
  Calendar,
  Pencil,
  Eye,
  Activity,
  Flame,
  QrCode,
  DollarSign,
  HeartHandshake,
  FileCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AcademiaPage() {
  const [data, setData] = useState<DashboardAcademia | null>(null);
  const [loading, setLoading] = useState(true);

  // Modais
  const [selectedOcForPayment, setSelectedOcForPayment] = useState<Ocorrencia | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAcademia, setEditingAcademia] = useState<Partial<Academia> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<DashboardAcademia>('/academia');
      setData(res);
    } catch (err) {
      toast.error('Erro ao carregar dados da academia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAcademia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcademia?.nmAcademia || !editingAcademia?.vlMensalidadeAcademia) {
      toast.error('Preencha o nome da academia e a mensalidade.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/academia', {
        method: 'POST',
        body: JSON.stringify({
          ...editingAcademia,
          nrDiaVencimentoAcademia: editingAcademia.nrDiaVencimentoAcademia || 10,
          nrDiaVencimentoPersonal: editingAcademia.nrDiaVencimentoPersonal || 10,
        }),
      });
      toast.success('Plano fitness atualizado!');
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar plano fitness.');
    } finally {
      setSaving(false);
    }
  };

  const ac = data?.academia;

  // Localiza a ocorrência do Personal Trainer.
  // A lista traz vários meses (ordenados ASC), então priorizamos o mês atual,
  // depois a primeira pendente, e só então a mais antiga.
  const personalOcs = (data?.ocorrencias || []).filter(
    (o) =>
      o.nmItem.toLowerCase().includes('personal') ||
      (ac?.nmPersonal ? o.nmItem.includes(ac.nmPersonal) : false),
  );
  const hoje = new Date();
  const personalOc =
    personalOcs.find((o) => {
      const d = new Date(o.dtVencimento);
      return (
        d.getUTCMonth() === hoje.getMonth() &&
        d.getUTCFullYear() === hoje.getFullYear()
      );
    }) ||
    personalOcs.find((o) => o.snPago === 'N') ||
    personalOcs[0];

  return (
    <div>
      {/* Modal de Pagamento com Comprovante Flexível */}
      <PagamentoModal
        ocorrencia={selectedOcForPayment}
        isOpen={!!selectedOcForPayment}
        onClose={() => setSelectedOcForPayment(null)}
        onSuccess={() => loadData()}
      />

      <Header
        title="Academia & Saúde"
        subtitle="Gestão isolada de academia, personal trainer (2x), suplementos e reembolsos PIX"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : ac ? (
        <div className="space-y-8">
          {/* Header Card Fitness */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/60 via-[#050505] to-[#050505] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-[#ea2a33]/30 shrink-0">
                <Dumbbell className="h-9 w-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {ac.nmAcademia}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Rotina Fitness Ativa
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-[#ea2a33]" /> Personal Trainer: <strong className="text-white">{ac.nmPersonal} (2x - Você & {ac.nmTitularTerceiro || 'Namorada'})</strong>
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  Mensalidade: <strong className="text-white">{formatCurrency(ac.vlMensalidadeAcademia)}</strong> · Personal: <strong className="text-white">{formatCurrency(Number(ac.vlPersonalUnitario || 0) * (ac.nrQtdPessoas || 2))} total</strong> (Vencimento Dia {ac.nrDiaVencimentoAcademia})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingAcademia(ac);
                setEditModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all shrink-0"
            >
              <Pencil className="h-4 w-4" /> Editar Plano Fitness
            </button>
          </div>

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
            {/* Custo Real do Bolso */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-[#94a3b8]">
                  Custo Fitness Real (Seu Bolso)
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {formatCurrency(data.custoFitnessBolsoMensal)}
                  <span className="text-xs font-normal text-[#94a3b8] ml-1">/mês</span>
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Sua Academia + Personal (2x) + Suplementos
              </p>
            </div>

            {/* Card Destaque Personal Trainer 2x (Anexo Direto de Comprovante) */}
            <div className="glass-card p-5 rounded-2xl border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/40 to-[#050505] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#ea2a33]" /> Personal Trainer (2x pessoas)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
                    Você & {ac.nmTitularTerceiro || 'Namorada'}
                  </span>
                </div>

                <p className="text-2xl font-black text-white">
                  {formatCurrency(Number(ac.vlPersonalUnitario || 0) * (ac.nrQtdPessoas || 2))}
                  <span className="text-xs font-normal text-slate-400 ml-1">/mês (100% do seu bolso)</span>
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                {personalOc?.dsComprovanteUrl ? (
                  <a
                    href={personalOc.dsComprovanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Comprovante Personal
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Sem comprovante do personal</span>
                )}

                <button
                  onClick={() => {
                    if (personalOc) {
                      setSelectedOcForPayment(personalOc);
                    } else {
                      toast.error('Ocorrência do personal não encontrada.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ea2a33] hover:bg-[#d4222a] text-white shadow-sm transition-all"
                >
                  <FileCheck className="h-3.5 w-3.5" /> Pagar / Anexar Personal
                </button>
              </div>
            </div>

            {/* Total Investido em Saúde */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-[#94a3b8]">
                  Total Acumulado em Saúde
                </span>
                <p className="text-2xl font-black text-white mt-2">
                  {formatCurrency(data.totalInvestidoSaude)}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Soma de parcelas fitness quitadas até hoje
              </p>
            </div>
          </div>

          {/* Grade de Lançamentos Fitness do Mês */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#ea2a33]" />
                <h2 className="text-base font-bold text-white">
                  Lançamentos da Rotina Fitness
                </h2>
              </div>
              <span className="text-xs font-bold text-[#94a3b8]">
                {data.ocorrencias.length} pagamentos mapeados
              </span>
            </div>

            <div className="space-y-3">
              {data.ocorrencias.map((oc) => (
                <div
                  key={oc.cdOcorrencia}
                  className="glass-card glass-card-hover rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        oc.snPago === 'S'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30'
                      }`}
                    >
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{oc.nmItem}</h3>
                      <p className="text-xs text-[#94a3b8]">
                        Vencimento: {formatDateBR(oc.dtVencimento)}
                        {oc.dtPagamento && ` · Pago em: ${formatDateBR(oc.dtPagamento)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">
                        {formatCurrency(oc.vlPago || oc.vlEsperado)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          oc.snPago === 'S' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {oc.snPago === 'S' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>

                    {oc.dsComprovanteUrl && (
                      <a
                        href={oc.dsComprovanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" /> Comprovante
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedOcForPayment(oc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        oc.snPago === 'S'
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {oc.snPago === 'S' ? 'Editar / Anexo' : 'Pagar & Anexar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Editar Plano Fitness */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-[#ea2a33]" /> Editar Plano Fitness, Personal & Reembolsos
            </h2>

            <form onSubmit={handleSaveAcademia} className="space-y-4">
              {/* Secao Academia do Usuario */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Sua Mensalidade da Academia
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome da Academia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Smart Fit, Bodytech"
                      value={editingAcademia?.nmAcademia || ''}
                      onChange={(e) =>
                        setEditingAcademia({ ...editingAcademia, nmAcademia: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Sua Mensalidade (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="120.00"
                      value={editingAcademia?.vlMensalidadeAcademia || ''}
                      onChange={(e) =>
                        setEditingAcademia({
                          ...editingAcademia,
                          vlMensalidadeAcademia: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>
                </div>
              </div>

              {/* Secao Academia da Namorada (Terceiros / Reembolso PIX) */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-purple-400" /> Mensalidade da Academia da Namorada (Terceiros / PIX)
                </h3>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAcademia?.snAcademiaNamorada === 'S'}
                    onChange={(e) =>
                      setEditingAcademia({
                        ...editingAcademia,
                        snAcademiaNamorada: e.target.checked ? 'S' : 'N',
                      })
                    }
                    className="h-4 w-4 rounded accent-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-200">
                    Você também paga a mensalidade da academia dela? (Reembolsado por PIX)
                  </span>
                </label>

                {editingAcademia?.snAcademiaNamorada === 'S' && (
                  <div className="space-y-3 pt-2 border-t border-purple-500/20 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Nome
                        </label>
                        <input
                          type="text"
                          placeholder="Namorada"
                          value={editingAcademia?.nmTitularTerceiro || ''}
                          onChange={(e) =>
                            setEditingAcademia({
                              ...editingAcademia,
                              nmTitularTerceiro: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Valor Academia Dela (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="120.00"
                          value={editingAcademia?.vlAcademiaNamorada || ''}
                          onChange={(e) =>
                            setEditingAcademia({
                              ...editingAcademia,
                              vlAcademiaNamorada: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Status do PIX de Reembolso da Namorada:
                      </label>
                      <div className="flex gap-3 text-xs">
                        <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="academiaNamoradaReembolso"
                            checked={editingAcademia?.snAcademiaNamoradaReembolsado === 'S'}
                            onChange={() =>
                              setEditingAcademia({
                                ...editingAcademia,
                                snAcademiaNamoradaReembolsado: 'S',
                              })
                            }
                            className="accent-emerald-500"
                          />
                          <span className="text-emerald-400 font-bold">100% Reembolsado via PIX por ela (R$ 0 do seu bolso)</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="academiaNamoradaReembolso"
                            checked={editingAcademia?.snAcademiaNamoradaReembolsado === 'N'}
                            onChange={() =>
                              setEditingAcademia({
                                ...editingAcademia,
                                snAcademiaNamoradaReembolsado: 'N',
                              })
                            }
                            className="accent-amber-500"
                          />
                          <span className="text-amber-400 font-bold">Aguardando PIX dela</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Secao Personal Trainer 2x (Pago 100% pelo Usuário) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#ea2a33]" /> Personal Trainer (2x - Você & Namorada)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome do Personal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Personal Lucas"
                      value={editingAcademia?.nmPersonal || ''}
                      onChange={(e) =>
                        setEditingAcademia({ ...editingAcademia, nmPersonal: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Valor p/ Pessoa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="400.00"
                      value={editingAcademia?.vlPersonalUnitario || ''}
                      onChange={(e) =>
                        setEditingAcademia({
                          ...editingAcademia,
                          vlPersonalUnitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Total Personal (2x pessoas): <strong className="text-white">{formatCurrency(Number(editingAcademia?.vlPersonalUnitario || 0) * 2)}</strong> (pago 100% pelo seu bolso).
                </p>
              </div>

              {/* Secao Suplementos */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gastos Recorrentes com Suplementos / Nutricionista (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="200.00"
                  value={editingAcademia?.vlSuplementos || ''}
                  onChange={(e) =>
                    setEditingAcademia({
                      ...editingAcademia,
                      vlSuplementos: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Plano Fitness'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
