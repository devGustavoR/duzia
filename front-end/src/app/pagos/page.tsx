'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { PagamentoModal } from '@/components/pagamento-modal';
import { fetchApi, Ocorrencia } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  FileCheck,
  CheckCircle2,
  Paperclip,
  Calendar,
  Search,
  ExternalLink,
  Eye,
  FileText,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HistoricoPagosPage() {
  const [ocorrenciasPagas, setOcorrenciasPagas] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Modal para editar / anexar comprovante em contas já pagas
  const [selectedOcForEdit, setSelectedOcForEdit] = useState<Ocorrencia | null>(null);

  const loadData = async (m = month, y = year) => {
    try {
      setLoading(true);
      const queryStr = m === 0 ? '' : `?mes=${m}&ano=${y}`;
      const res = await fetchApi<Ocorrencia[]>(`/ocorrencias/pagas${queryStr}`);
      setOcorrenciasPagas(res);
    } catch (err) {
      toast.error('Erro ao carregar histórico de pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(month, year);
  }, [month, year]);

  const filteredItems = ocorrenciasPagas.filter((o) =>
    o.nmItem.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPagoMes = filteredItems.reduce(
    (acc, item) => acc + Number(item.vlPago || item.vlEsperado || 0),
    0,
  );

  const comComprovanteCount = filteredItems.filter((item) => !!item.dsComprovanteUrl).length;

  return (
    <div>
      {/* Modal para Editar/Adicionar Comprovante */}
      <PagamentoModal
        ocorrencia={selectedOcForEdit}
        isOpen={!!selectedOcForEdit}
        onClose={() => setSelectedOcForEdit(null)}
        onSuccess={() => loadData()}
      />

      <Header
        title="Contas Pagas & Comprovantes"
        subtitle="Histórico de quitações, recibos arquivados e comprovantes anexados"
        selectedMonth={month}
        selectedYear={year}
        allowAllMonths={true}
        onMonthChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#94a3b8]">
              Total Quitado no Mês
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalPagoMes)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredItems.length} contas pagas cadastradas
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#94a3b8]">
              Comprovantes Anexados
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {comComprovanteCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                de {filteredItems.length}
              </span>
            </p>
            <p className="text-xs text-emerald-400 mt-0.5">
              Recibos digitais arquivados
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#94a3b8]">
              Sem Comprovante
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {filteredItems.length - comComprovanteCount}
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Aguardando anexo do recibo
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome da conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ea2a33]"
          />
        </div>
        <span className="text-xs text-[#94a3b8]">
          Exibindo lançamentos de {month}/{year}
        </span>
      </div>

      {/* Paid Items Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center text-[#94a3b8] text-sm animate-pulse">
          Carregando histórico de pagamentos...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-[#94a3b8]">
          <FileCheck className="h-10 w-10 mx-auto text-[#ea2a33] mb-3" />
          <p className="font-semibold text-slate-300">Nenhum pagamento registrado neste mês</p>
          <p className="text-xs text-slate-500 mt-1">
            Dê baixa em suas contas pendentes no Dashboard ou na tela de Contas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.cdOcorrencia}
              className="glass-card glass-card-hover rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{item.nmItem}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                      {item.tpOrigem}
                    </span>
                    {item.dsFormaPagamento === 'DINHEIRO' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        💵 Dinheiro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Pago em:{' '}
                    <strong className="text-emerald-400">
                      {item.dtPagamento ? formatDateBR(item.dtPagamento) : 'Mês Atual'}
                    </strong>{' '}
                    · Vencimento Original: {formatDateBR(item.dtVencimento)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 uppercase">Valor Pago</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatCurrency(item.vlPago || item.vlEsperado)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.dsComprovanteUrl ? (
                    <a
                      href={item.dsComprovanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Comprovante
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <AlertCircle className="h-3 w-3" /> Sem Anexo
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedOcForEdit(item)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    title={item.dsComprovanteUrl ? 'Editar Anexo' : 'Anexar Comprovante'}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
