'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { OnboardingModal } from '@/components/onboarding-modal';
import { PagamentoModal } from '@/components/pagamento-modal';
import {
  fetchApi,
  DashboardData,
  Ocorrencia,
  PerfilFinanceiro,
} from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  ArrowUpRight,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Onboarding Modal Check
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Payment Receipt Modal State
  const [selectedOcForPayment, setSelectedOcForPayment] = useState<Ocorrencia | null>(null);

  const loadDashboard = async (m = month, y = year) => {
    try {
      setLoading(true);
      const [res, perfil] = await Promise.all([
        fetchApi<DashboardData>(`/dashboard?mes=${m}&ano=${y}`),
        fetchApi<PerfilFinanceiro>('/perfil-financeiro').catch(() => null),
      ]);
      setData(res);

      if (!perfil || Number(perfil.vlSalarioLiquido || 0) === 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(month, year);
  }, [month, year]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  return (
    <div>
      {/* Modal de Configuração Financeira Obrigatório */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          loadDashboard();
        }}
      />

      {/* Modal de Confirmação de Pagamento com Comprovante */}
      <PagamentoModal
        ocorrencia={selectedOcForPayment}
        isOpen={!!selectedOcForPayment}
        onClose={() => setSelectedOcForPayment(null)}
        onSuccess={() => loadDashboard()}
      />

      <Header
        title="Visão Geral"
        subtitle="Resumo das suas finanças e controle de vencimentos do mês"
        selectedMonth={month}
        selectedYear={year}
        onMonthChange={handleMonthChange}
      />

      {loading ? (
        <div className="space-y-5 animate-pulse">
          <div className="h-44 bg-white/5 rounded-3xl border border-white/10"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-20 bg-white/5 rounded-2xl border border-white/10"></div>
            <div className="h-20 bg-white/5 rounded-2xl border border-white/10"></div>
            <div className="h-20 bg-white/5 rounded-2xl border border-white/10"></div>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6 sm:space-y-8">
          {/* ── Hero: Pendente do mês (mobile-first) ── */}
          <div className="sm:hidden">
            <div className="rounded-3xl p-6 border border-[#ea2a33]/30 bg-gradient-to-br from-[#4a0404]/70 via-[#1a0606] to-[#050505] relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300/90">
                  Pendente do mês
                </span>
                <div className="p-2 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-white mt-2 tracking-tight">
                {formatCurrency(data.resumoMes.totalPendente)}
              </p>
              <p className="text-xs text-rose-200/70 mt-1">
                {data.resumoMes.qtdPendente} conta(s) a vencer de {data.resumoMes.totalItens}
              </p>

              <div className="w-full bg-black/30 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ea2a33] to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data.resumoMes.percentualPago)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold mt-2">
                <span className="text-emerald-400">
                  {formatCurrency(data.resumoMes.totalPago)} pago
                </span>
                <span className="text-slate-400">
                  {data.resumoMes.percentualPago}% · total {formatCurrency(data.resumoMes.totalEsperado)}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards (>= sm keeps the 4-up grid) */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total a Pagar */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total do Mês
                </span>
                <div className="p-2.5 rounded-xl bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-3">
                {formatCurrency(data.resumoMes.totalEsperado)}
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                {data.resumoMes.totalItens} lançamentos cadastrados
              </p>
            </div>

            {/* Total Pago */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Já Pago
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-3">
                {formatCurrency(data.resumoMes.totalPago)}
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                {data.resumoMes.qtdPago} de {data.resumoMes.totalItens} itens pagos
              </p>
            </div>

            {/* Restante a Pagar */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Pendente
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-3">
                {formatCurrency(data.resumoMes.totalPendente)}
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                {data.resumoMes.qtdPendente} contas a vencer
              </p>
            </div>

            {/* Progresso de Quitação */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Progresso
                </span>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-400 mt-3">
                {data.resumoMes.percentualPago}%
              </p>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ea2a33] to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data.resumoMes.percentualPago)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid Principal: Próximos Vencimentos + Metas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Próximos 5 Vencimentos */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-[#ea2a33]" />
                  <h2 className="text-lg font-bold text-white">
                    Próximos Vencimentos
                  </h2>
                </div>
                <Link
                  href="/contas"
                  className="text-xs font-semibold text-[#ea2a33] hover:text-rose-400 flex items-center gap-1"
                >
                  Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.proximosVencimentos.length === 0 ? (
                <div className="text-center py-10 text-[#94a3b8] text-sm">
                  ✨ Nenhuma conta pendente para os próximos dias!
                </div>
              ) : (
                <div className="space-y-3">
                  {data.proximosVencimentos.map((oc) => (
                    <div
                      key={oc.cdOcorrencia}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ea2a33]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${
                              oc.tpOrigem === 'CONTA'
                                ? 'bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {oc.tpOrigem}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {oc.nmItem}
                            </p>
                            <p className="text-xs text-[#94a3b8]">
                              Vence em {formatDateBR(oc.dtVencimento)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-black text-white">
                          {formatCurrency(oc.vlEsperado)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setSelectedOcForPayment(oc)}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          Pagar &amp; Anexar
                        </button>
                        {oc.dsComprovanteUrl ? (
                          <a
                            href={oc.dsComprovanteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" /> Recibo
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metas de Compra Quick View */}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    Metas de Compra
                  </h2>
                </div>
                <Link
                  href="/metas"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Ver mais <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.metas.length === 0 ? (
                <div className="text-center py-10 text-[#94a3b8] text-sm">
                  Nenhuma meta de compra cadastrada ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.metas.map((meta) => {
                    const pct = Math.min(
                      100,
                      Math.round(
                        (Number(meta.vlPoupado || 0) / Number(meta.vlAlvo || 1)) *
                          100,
                      ),
                    );

                    return (
                      <div
                        key={meta.cdMeta}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-200">
                            {meta.nmMeta}
                          </p>
                          <span className="text-xs font-bold text-emerald-400">
                            {pct}%
                          </span>
                        </div>

                        <div className="w-full bg-white/10 rounded-full h-2 my-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-[#94a3b8] mt-1">
                          <span>{formatCurrency(meta.vlPoupado)}</span>
                          <span className="text-slate-500">
                            Meta: {formatCurrency(meta.vlAlvo)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
