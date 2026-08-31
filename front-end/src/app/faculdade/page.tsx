'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { PagamentoModal } from '@/components/pagamento-modal';
import { fetchApi, DashboardFaculdade, Faculdade, Ocorrencia } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  GraduationCap,
  School,
  CheckCircle2,
  Calendar,
  Pencil,
  Eye,
  FileCheck,
  Award,
  BookOpen,
  DollarSign,
  Upload,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FaculdadePage() {
  const [data, setData] = useState<DashboardFaculdade | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedOcForPayment, setSelectedOcForPayment] = useState<Ocorrencia | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculdade, setEditingFaculdade] = useState<Partial<Faculdade> | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal Matrícula
  const [matriculaModalOpen, setMatriculaModalOpen] = useState(false);
  const [vlMatriculaInput, setVlMatriculaInput] = useState('');
  const [dtMatriculaInput, setDtMatriculaInput] = useState('');
  const [comprovanteMatriculaBase64, setComprovanteMatriculaBase64] = useState<string | null>(null);
  const [savingMatricula, setSavingMatricula] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<DashboardFaculdade>('/faculdade');
      setData(res);
      if (res.faculdade) {
        setVlMatriculaInput(String(res.faculdade.vlMatricula || ''));
        setDtMatriculaInput(res.faculdade.dtPagamentoMatricula || new Date().toISOString().split('T')[0]);
        setComprovanteMatriculaBase64(res.faculdade.dsComprovanteMatricula || null);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados da faculdade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFaculdade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculdade?.nmCurso || !editingFaculdade?.vlMensalidade) {
      toast.error('Preencha o nome do curso e o valor da mensalidade.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/faculdade', {
        method: 'POST',
        body: JSON.stringify({
          ...editingFaculdade,
          nrDiaVencimento: editingFaculdade.nrDiaVencimento || 5,
        }),
      });
      toast.success('Dados da faculdade atualizados!');
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar dados da faculdade.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(vlMatriculaInput);
    if (!val || val <= 0) {
      toast.error('Informe um valor de matrícula válido.');
      return;
    }

    setSavingMatricula(true);
    try {
      await fetchApi('/faculdade', {
        method: 'POST',
        body: JSON.stringify({
          vlMatricula: val,
          dtPagamentoMatricula: dtMatriculaInput,
          dsComprovanteMatricula: comprovanteMatriculaBase64,
        }),
      });
      toast.success('Pagamento de matrícula e comprovante registrados!');
      setMatriculaModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar pagamento de matrícula.');
    } finally {
      setSavingMatricula(false);
    }
  };

  const handleMatriculaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprovanteMatriculaBase64(reader.result as string);
      toast.success(`Comprovante "${file.name}" anexado!`);
    };
    reader.readAsDataURL(file);
  };

  const fac = data?.faculdade;

  return (
    <div>
      {/* Modal de Pagamento Mensalidade com Comprovante Flexível */}
      <PagamentoModal
        ocorrencia={selectedOcForPayment}
        isOpen={!!selectedOcForPayment}
        onClose={() => setSelectedOcForPayment(null)}
        onSuccess={() => loadData()}
      />

      <Header
        title="Faculdade & Mensalidades"
        subtitle="Gestão isolada do curso acadêmico, matrícula e boletos da universidade"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : fac ? (
        <div className="space-y-8">
          {/* Header Card do Curso */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/60 via-[#050505] to-[#050505] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#ea2a33] via-red-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-[#ea2a33]/30 shrink-0">
                <GraduationCap className="h-9 w-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-xl sm:text-2xl font-black text-white">
                    {fac.nmCurso}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
                    {fac.dsSemestre}
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                  <School className="h-4 w-4 text-[#ea2a33]" /> {fac.nmInstituicao}
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  Mensalidade Padrão: <strong className="text-white">{formatCurrency(fac.vlMensalidade)}</strong> (Vencimento todo Dia {fac.nrDiaVencimento})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingFaculdade(fac);
                setEditModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all shrink-0"
            >
              <Pencil className="h-4 w-4" /> Editar Dados do Curso
            </button>
          </div>

          {/* Banner Matrícula / Rematrícula + Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {/* Card de Matrícula */}
            <div className="glass-card p-5 rounded-2xl border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/30 to-[#050505] flex flex-col justify-between md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#ea2a33] flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Matrícula / Rematrícula do Semestre
                </span>
                {fac.dtPagamentoMatricula ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" /> Paga
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Pendente
                  </span>
                )}
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {fac.vlMatricula ? formatCurrency(fac.vlMatricula) : 'Não informada'}
                </p>
                {fac.dtPagamentoMatricula && (
                  <p className="text-xs text-slate-300 mt-1">
                    Paga em: {formatDateBR(fac.dtPagamentoMatricula)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                {fac.dsComprovanteMatricula ? (
                  <a
                    href={fac.dsComprovanteMatricula}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Comprovante Matrícula
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Sem comprovante de matrícula</span>
                )}

                <button
                  onClick={() => setMatriculaModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ea2a33] hover:bg-[#d4222a] text-white shadow-sm transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" /> Registrar Matrícula
                </button>
              </div>
            </div>

            {/* Total Investido */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-[#94a3b8]">
                  Investimento Total Acumulado
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
                  {formatCurrency(data.totalInvestido)}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Soma de mensalidades + matrícula
              </p>
            </div>

            {/* Mensalidades A Vencer */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-[#94a3b8]">
                  Mensalidades do Semestre
                </span>
                <p className="text-xl sm:text-2xl font-black text-white mt-2">
                  {data.qtdPagas} <span className="text-xs font-normal text-slate-400">pagas</span> / {data.qtdPendentes} <span className="text-xs font-normal text-amber-400">a vencer</span>
                </p>
              </div>
              <p className="text-xs text-emerald-400 mt-2">
                Grade de boletos acadêmicos
              </p>
            </div>
          </div>

          {/* Grade de Mensalidades da Faculdade */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#ea2a33]" />
                <h2 className="text-base font-bold text-white">
                  Grade de Mensalidades — {fac.nmInstituicao}
                </h2>
              </div>
              <span className="text-xs font-bold text-[#94a3b8]">
                {data.ocorrencias.length} mensalidades mapeadas
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
                      <GraduationCap className="h-5 w-5" />
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

      {/* Modal Registrar Matrícula */}
      {matriculaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4">
              Registrar Pagamento de Matrícula / Rematrícula
            </h2>

            <form onSubmit={handleSaveMatricula} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Matrícula (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200.00"
                    value={vlMatriculaInput}
                    onChange={(e) => setVlMatriculaInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dtMatriculaInput}
                    onChange={(e) => setDtMatriculaInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anexar Comprovante de Matrícula (PDF / Imagem)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleMatriculaFileUpload}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 file:bg-[#ea2a33] file:text-white file:border-0 file:rounded-lg file:px-2.5 file:py-1 file:mr-3 file:font-bold hover:file:bg-[#d4222a]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setMatriculaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMatricula}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingMatricula ? 'Salvando...' : 'Salvar Matrícula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Curso */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4">
              Editar Dados da Faculdade
            </h2>

            <form onSubmit={handleSaveFaculdade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Curso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenharia de Software, Medicina"
                  value={editingFaculdade?.nmCurso || ''}
                  onChange={(e) =>
                    setEditingFaculdade({ ...editingFaculdade, nmCurso: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Instituição / Universidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: UNIFACS, PUC, FIAP"
                    value={editingFaculdade?.nmInstituicao || ''}
                    onChange={(e) =>
                      setEditingFaculdade({ ...editingFaculdade, nmInstituicao: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Semestre Vigente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5º Semestre"
                    value={editingFaculdade?.dsSemestre || ''}
                    onChange={(e) =>
                      setEditingFaculdade({ ...editingFaculdade, dsSemestre: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Mensalidade (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200.00"
                    value={editingFaculdade?.vlMensalidade || ''}
                    onChange={(e) =>
                      setEditingFaculdade({
                        ...editingFaculdade,
                        vlMensalidade: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia Vencimento (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingFaculdade?.nrDiaVencimento || 5}
                    onChange={(e) =>
                      setEditingFaculdade({
                        ...editingFaculdade,
                        nrDiaVencimento: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Faculdade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
