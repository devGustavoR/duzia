'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, PerfilFinanceiro, AnaliseQuitacao, Assinatura } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
  DollarSign,
  Percent,
  Calendar,
  Zap,
  Sparkles,
  Users,
  Layers,
  ArrowUpRight,
  Plus,
  Info,
  Flame,
  Globe,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SimuladorPage() {
  const [activeTab, setActiveTab] = useState<'EMPRESTIMO' | 'SAAS'>('SAAS');
  const [perfil, setPerfil] = useState<PerfilFinanceiro | null>(null);
  const [analise, setAnalise] = useState<AnaliseQuitacao | null>(null);
  const [assinaturasExistentes, setAssinaturasExistentes] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);

  // Inputs - Simulação de Empréstimo
  const [valorEmprestimo, setValorEmprestimo] = useState('10000');
  const [taxaJurosMensal, setTaxaJurosMensal] = useState('2.5');
  const [numParcelas, setNumParcelas] = useState('24');

  // Inputs - Simulação de Nova Assinatura SaaS / Serviço
  const [nmSaas, setNmSaas] = useState('Claude Pro / ChatGPT');
  const [moeda, setMoeda] = useState<'BRL' | 'USD'>('BRL');
  const [cotacaoDolar, setCotacaoDolar] = useState('5.60');
  const [valorSaas, setValorSaas] = useState('110');
  const [cicloSaas, setCicloSaas] = useState<'MENSAL' | 'ANUAL'>('MENSAL');
  const [snDivididaSaas, setSnDivididaSaas] = useState<'S' | 'N'>('N');
  const [qtdAmigos, setQtdAmigos] = useState('1'); // Quantos amigos dividem com você
  const [savingSaas, setSavingSaas] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi<PerfilFinanceiro>('/perfil-financeiro').catch(() => null),
      fetchApi<AnaliseQuitacao>('/dividas/analise-quitacao').catch(() => null),
      fetchApi<Assinatura[]>('/assinaturas').catch(() => []),
    ])
      .then(([perf, an, ass]) => {
        setPerfil(perf);
        setAnalise(an);
        setAssinaturasExistentes(ass || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRenda =
    (Number(perfil?.vlSalarioLiquido) || 0) +
    (Number(perfil?.vlRendaVariavel) || 0) +
    (Number(perfil?.vlOutrasRendas) || 0) || 6000;

  // ----------------------------------------------------
  // CÁLCULOS: EMPRÉSTIMO
  // ----------------------------------------------------
  const parcelasExistentes = analise?.resumo.totalParcelaMensal || 0;
  const pv = parseFloat(valorEmprestimo) || 0;
  const i = (parseFloat(taxaJurosMensal) || 0) / 100;
  const n = parseInt(numParcelas, 10) || 1;

  let parcelaEmprestimo = 0;
  if (pv > 0 && n > 0) {
    if (i > 0) {
      parcelaEmprestimo = (pv * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
    } else {
      parcelaEmprestimo = pv / n;
    }
  }

  const totalPagoEmprestimo = parcelaEmprestimo * n;
  const totalJurosEmprestimo = Math.max(0, totalPagoEmprestimo - pv);
  const comprometimentoAtualEmprestimo = Math.round((parcelasExistentes / totalRenda) * 100);
  const novaParcelaTotalEmprestimo = parcelasExistentes + parcelaEmprestimo;
  const novoComprometimentoEmprestimo = Math.round((novaParcelaTotalEmprestimo / totalRenda) * 100);

  // ----------------------------------------------------
  // CÁLCULOS: NOVA ASSINATURA SAAS
  // ----------------------------------------------------
  const valBrutoInput = parseFloat(valorSaas) || 0;
  const cotDolarVal = parseFloat(cotacaoDolar) || 5.6;

  // Se for USD, adiciona IOF de 4.38% + Cotação do Dólar
  let valBrutoMensalBRL = valBrutoInput;
  if (moeda === 'USD') {
    const valComIOF = valBrutoInput * 1.0438; // 4.38% IOF cartão exterior
    valBrutoMensalBRL = valComIOF * cotDolarVal;
  }

  if (cicloSaas === 'ANUAL') {
    valBrutoMensalBRL = valBrutoMensalBRL / 12;
  }

  // Divisão com amigos
  const numPessoasDividindo = snDivididaSaas === 'S' ? Math.max(1, parseInt(qtdAmigos, 10) + 1) : 1;
  const cotaSaasMensalBolso = valBrutoMensalBRL / numPessoasDividindo;
  const cotaSaasAnualBolso = cotaSaasMensalBolso * 12;

  // Impacto em relação às assinaturas atuais
  const gastoAssinaturasAtuaisMensal = assinaturasExistentes.reduce((acc, a) => {
    const v = Number(a.vlCotaPropria !== undefined ? a.vlCotaPropria : a.vlMensalidade);
    return acc + (a.dsCiclo === 'ANUAL' ? v / 12 : v);
  }, 0);

  const novoTotalAssinaturasMensal = gastoAssinaturasAtuaisMensal + cotaSaasMensalBolso;
  const percentualAumentoAssinaturas = gastoAssinaturasAtuaisMensal > 0
    ? Math.round((cotaSaasMensalBolso / gastoAssinaturasAtuaisMensal) * 100)
    : 100;

  const percComprometimentoRendaSaas = ((cotaSaasMensalBolso / totalRenda) * 100).toFixed(1);

  // Salvar nova assinatura simulada no Duzia
  const handleContratarSaas = async () => {
    if (!nmSaas || valBrutoInput <= 0) {
      toast.error('Informe o nome da assinatura e um valor válido.');
      return;
    }

    setSavingSaas(true);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      await fetchApi('/assinaturas', {
        method: 'POST',
        body: JSON.stringify({
          nmAssinatura: nmSaas,
          vlMensalidade: cotaSaasMensalBolso,
          dsCiclo: 'MENSAL',
          snDividida: snDivididaSaas,
          vlTotalServico: valBrutoMensalBRL,
          dsAmigosDivididos: snDivididaSaas === 'S' ? `${qtdAmigos} amigo(s)` : undefined,
          vlCotaAmigo: snDivididaSaas === 'S' ? cotaSaasMensalBolso : undefined,
          vlCotaPropria: cotaSaasMensalBolso,
          nrDiaVencimento: 10,
          dtVencimentoInicial: todayISO,
          nrDiasAviso: 3,
          snAvisoAtivo: 'S',
        }),
      });

      toast.success(`Assinatura "${nmSaas}" adicionada com sucesso às suas assinaturas!`);
      // Recarrega assinaturas
      const updated = await fetchApi<Assinatura[]>('/assinaturas');
      setAssinaturasExistentes(updated || []);
    } catch (err) {
      toast.error('Erro ao salvar assinatura.');
    } finally {
      setSavingSaas(false);
    }
  };

  return (
    <div>
      <Header
        title="Simulador de Impacto Financeiro"
        subtitle="Simule o impacto de empréstimos ou de novas assinaturas SaaS antes de fechar um contrato"
      />

      {/* Tabs de Seleção de Simulação */}
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('SAAS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'SAAS'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Zap className="h-4 w-4" /> Simular Nova Assinatura SaaS / Serviço
        </button>

        <button
          onClick={() => setActiveTab('EMPRESTIMO')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'EMPRESTIMO'
              ? 'bg-[#ea2a33] text-white shadow-lg shadow-[#ea2a33]/25 border border-red-500/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Calculator className="h-4 w-4" /> Simular Novo Empréstimo / Financiamento
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: SIMULADOR DE NOVA ASSINATURA SAAS / SERVIÇO */}
      {/* ========================================================================= */}
      {activeTab === 'SAAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form de Configuração da Assinatura */}
          <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-purple-500/5 space-y-5">
            <div className="flex items-center gap-2 border-b border-purple-500/20 pb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Parâmetros do Novo SaaS</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Software / Serviço *
              </label>
              <input
                type="text"
                value={nmSaas}
                onChange={(e) => setNmSaas(e.target.value)}
                placeholder="Ex: Claude Pro, ChatGPT Plus, Midjourney, Vercel"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Seletor de Moeda BRL vs USD */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Moeda de Cobrança
                </label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMoeda('BRL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      moeda === 'BRL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    R$ (Reais)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoeda('USD')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      moeda === 'USD' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    US$ (Dólar)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ciclo de Cobrança
                </label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCicloSaas('MENSAL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      cicloSaas === 'MENSAL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCicloSaas('ANUAL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      cicloSaas === 'ANUAL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Anual
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs de Valor & Cotação */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor ({moeda === 'USD' ? 'US$' : 'R$'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorSaas}
                  onChange={(e) => setValorSaas(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {moeda === 'USD' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Cotação US$</span>
                    <span className="text-[10px] text-purple-300">+4.38% IOF</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={cotacaoDolar}
                    onChange={(e) => setCotacaoDolar(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Divisão com Amigos (Split) */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snDivididaSaas === 'S'}
                  onChange={(e) => setSnDivididaSaas(e.target.checked ? 'S' : 'N')}
                  className="h-4 w-4 rounded accent-purple-500"
                />
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-400" /> Vai dividir essa assinatura com amigos/família?
                </span>
              </label>

              {snDivididaSaas === 'S' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Com quantos amigos você vai rachar a conta?
                  </label>
                  <select
                    value={qtdAmigos}
                    onChange={(e) => setQtdAmigos(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="1">1 amigo (Dividir meio a meio - 50%)</option>
                    <option value="2">2 amigos (Dividir por 3 pessoas - 33%)</option>
                    <option value="3">3 amigos (Dividir por 4 pessoas - 25%)</option>
                    <option value="4">4 amigos (Dividir por 5 pessoas - 20%)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Botão de 1 Clique para Contratar */}
            <button
              type="button"
              onClick={handleContratarSaas}
              disabled={savingSaas}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {savingSaas ? 'Adicionando...' : 'Decidi Contratar: Salvar no Duzia'}
            </button>
          </div>

          {/* Diagnóstico de Impacto Financeiro do SaaS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner com o Impacto do Bolso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Card Custo Mensal Real */}
              <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#050505] to-[#050505] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-purple-400" /> Custo Mensal no Seu Bolso
                  </span>
                  <p className="text-3xl font-black text-white mt-2">
                    {formatCurrency(cotaSaasMensalBolso)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/mês</span>
                  </p>
                </div>
                {snDivididaSaas === 'S' && (
                  <p className="text-xs text-purple-300 mt-2">
                    Valor total de {formatCurrency(valBrutoMensalBRL)} dividido por {numPessoasDividindo} pessoas
                  </p>
                )}
              </div>

              {/* Card Efeito Acumulado Anual (12 Meses) */}
              <div className="glass-card rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-r from-[#4a0404]/40 via-[#050505] to-[#050505] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-[#ea2a33]" /> Custo Anual Acumulado (12 Meses)
                  </span>
                  <p className="text-3xl font-black text-rose-400 mt-2">
                    {formatCurrency(cotaSaasAnualBolso)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ano</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Efeito gotejamento de 1 ano dessa nova assinatura
                </p>
              </div>
            </div>

            {/* Diagnóstico de Comparação com Assinaturas Existentes */}
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" /> Diagnóstico de Impacto no Portfólio de Assinaturas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-[#94a3b8] uppercase font-semibold">Assinaturas Atuais</span>
                  <p className="text-xl font-bold text-slate-200 mt-1">
                    {formatCurrency(gastoAssinaturasAtuaisMensal)} /mês
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {assinaturasExistentes.length} serviços já contratados
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-[#94a3b8] uppercase font-semibold">Após Nova Contratação</span>
                  <p className="text-xl font-bold text-purple-300 mt-1">
                    {formatCurrency(novoTotalAssinaturasMensal)} /mês
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    +{percentualAumentoAssinaturas}% de aumento no seu custo fixo SaaS
                  </p>
                </div>
              </div>

              {/* Parecer da IA para Assinaturas */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  Number(percComprometimentoRendaSaas) > 5
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : Number(percComprometimentoRendaSaas) > 2
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {Number(percComprometimentoRendaSaas) > 5 ? (
                  <AlertTriangle className="h-6 w-6 shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" />
                )}

                <div className="text-xs leading-relaxed">
                  <strong className="block text-sm mb-1">
                    {Number(percComprometimentoRendaSaas) > 5
                      ? '🔴 Alerta SaaS: Alto impacto percentual na sua renda mensal'
                      : Number(percComprometimentoRendaSaas) > 2
                      ? '🟡 Atenção: Assinatura relevante no seu orçamento'
                      : '🟢 Nível Saudável: Assinatura de baixo impacto financeiro'}
                  </strong>
                  <p>
                    Esta assinatura de <strong>{nmSaas || 'SaaS'}</strong> consumirá{' '}
                    <strong>{percComprometimentoRendaSaas}%</strong> da sua renda mensal total ({formatCurrency(totalRenda)}). Em 1 ano, ela custará{' '}
                    <strong>{formatCurrency(cotaSaasAnualBolso)}</strong>.
                  </p>
                  <p className="mt-2 text-slate-300 border-t border-white/10 pt-2 font-medium">
                    💡 <strong>Insight de Equivalência Real:</strong> Esse valor anual acumulado ({formatCurrency(cotaSaasAnualBolso)}) equivale a aproximadamente{' '}
                    <span className="text-white font-bold">
                      {Math.round(cotaSaasAnualBolso / 120)} meses de academia
                    </span>{' '}
                    ou <span className="text-white font-bold">{Math.round(cotaSaasAnualBolso / 200)} potes de suplemento</span>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: SIMULADOR DE EMPRÉSTIMO & FINANCIAMENTO */}
      {/* ========================================================================= */}
      {activeTab === 'EMPRESTIMO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário do Simulador de Empréstimo */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Calculator className="h-5 w-5 text-[#ea2a33]" />
              <h2 className="text-base font-bold text-white">Parâmetros do Empréstimo</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Desejado do Empréstimo (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="500"
                  value={valorEmprestimo}
                  onChange={(e) => setValorEmprestimo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Taxa Juros (% a.m.)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    value={taxaJurosMensal}
                    onChange={(e) => setTaxaJurosMensal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prazo (Nº Parcelas)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Valor Solicitado:</span>
                <span className="font-bold text-white">{formatCurrency(pv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total de Juros Pagos:</span>
                <span className="font-bold text-rose-400">{formatCurrency(totalJurosEmprestimo)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-black text-sm">
                <span>Custo Total do Empréstimo:</span>
                <span className="text-white">{formatCurrency(totalPagoEmprestimo)}</span>
              </div>
            </div>
          </div>

          {/* Diagnóstico de Impacto & Parecer de IA de Empréstimo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Parcela Estimada */}
            <div className="glass-card rounded-2xl p-6 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/50 via-[#050505] to-[#050505] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  Nova Parcela Mensal Estimada
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  {n}x de {formatCurrency(parcelaEmprestimo)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
                <TrendingDown className="h-8 w-8" />
              </div>
            </div>

            {/* Comparativo de Orçamento */}
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#ea2a33]" /> Diagnóstico de Impacto na sua Renda Mensal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-[#94a3b8] uppercase font-semibold">Orçamento Atual</span>
                  <p className="text-xl font-bold text-slate-200 mt-1">
                    {comprometimentoAtualEmprestimo}% da renda
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Parcelas atuais: {formatCurrency(parcelasExistentes)} / mês
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-[#94a3b8] uppercase font-semibold">Após Novo Empréstimo</span>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      novoComprometimentoEmprestimo > 30
                        ? 'text-rose-500'
                        : novoComprometimentoEmprestimo > 20
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {novoComprometimentoEmprestimo}% da renda
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Novas parcelas totais: {formatCurrency(novaParcelaTotalEmprestimo)} / mês
                  </p>
                </div>
              </div>

              {/* Parecer IA da Saúde Financeira */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  novoComprometimentoEmprestimo > 30
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : novoComprometimentoEmprestimo > 20
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {novoComprometimentoEmprestimo > 30 ? (
                  <AlertTriangle className="h-6 w-6 shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed">
                  <strong className="block text-sm mb-1">
                    {novoComprometimentoEmprestimo > 30
                      ? '🔴 Alerta Vermelho: Risco Alto de Sufocamento Financeiro'
                      : novoComprometimentoEmprestimo > 20
                      ? '🟡 Atenção: Margem Orçamentária Apertada'
                      : '🟢 Nível Saudável: Empréstimo dentro dos limites seguros'}
                  </strong>
                  {novoComprometimentoEmprestimo > 30 ? (
                    <p>
                      Com este empréstimo, você comprometerá <strong>{novoComprometimentoEmprestimo}%</strong> da sua renda mensal total ({formatCurrency(totalRenda)}). Economistas recomendam não ultrapassar 25% a 30% em dívidas ativas. Caso ocorra qualquer imprevisto, o risco de superendividamento é elevado.
                    </p>
                  ) : novoComprometimentoEmprestimo > 20 ? (
                    <p>
                      Sua taxa de comprometimento subirá para <strong>{novoComprometimentoEmprestimo}%</strong>. O empréstimo cabe no seu orçamento, porém reduzirá drasticamente sua capacidade de guardar dinheiro e investir.
                    </p>
                  ) : (
                    <p>
                      Sua taxa de comprometimento será de apenas <strong>{novoComprometimentoEmprestimo}%</strong> da renda. A parcela cabe confortavelmente nas suas finanças sem afetar sua reserva.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
