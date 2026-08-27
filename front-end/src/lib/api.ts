import { createClient } from '@/lib/supabase/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authHeaders: Record<string, string> = {};
  if (session?.access_token) {
    authHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    cache: 'no-store',
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorBody}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function uploadFaturaNeoenergia(file: File): Promise<Conta> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authHeaders: Record<string, string> = {};
  if (session?.access_token) {
    authHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  const formData = new FormData();
  formData.append('arquivo', file);

  const res = await fetch(`${API_BASE_URL}/contas/upload-fatura/neoenergia`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorBody}`);
  }

  return res.json() as Promise<Conta>;
}

// Data Interfaces
export interface Categoria {
  cdCategoria: number;
  nmCategoria: string;
  dsIcone?: string;
  dsCor?: string;
}

export interface Conta {
  cdConta: number;
  nmConta: string;
  dsObservacao?: string;
  cdCategoria?: number;
  categoria?: Categoria;
  vlValor: number;
  snRecorrente: 'S' | 'N';
  snFixo: 'S' | 'N';
  dsFrequencia: string;
  snDividida?: 'S' | 'N';
  vlTotalServico?: number;
  dsAmigosDivididos?: string;
  vlCotaAmigo?: number;
  snTerceiros?: 'S' | 'N';
  nmTitularTerceiro?: string;
  snReembolsado?: 'S' | 'N';
  vlCotaPropria?: number;
  nrDiaVencimento?: number;
  dtVencimentoInicial?: string;
  nrDiasAviso: number;
  snAvisoAtivo: 'S' | 'N';
  snAtivo: 'S' | 'N';
}

export interface Assinatura {
  cdAssinatura: number;
  nmAssinatura: string;
  dsObservacao?: string;
  cdCategoria?: number;
  categoria?: Categoria;
  vlMensalidade: number;
  dsCiclo: 'MENSAL' | 'ANUAL';
  snDividida?: 'S' | 'N';
  vlTotalServico?: number;
  dsAmigosDivididos?: string;
  vlCotaAmigo?: number;
  snTerceiros?: 'S' | 'N';
  nmTitularTerceiro?: string;
  snReembolsado?: 'S' | 'N';
  vlCotaPropria?: number;
  nrDiaVencimento: number;
  dtProximaCobranca: string;
  nrDiasAviso: number;
  snAvisoAtivo: 'S' | 'N';
  cdCartaoCredito?: number;
  nmCartaoVinculado?: string;
  snAtivo: 'S' | 'N';
}

export interface Servidor {
  cdServidor: number;
  nmServidor: string;
  nmProvedor: string;
  dsIpHost?: string;
  dsProjeto?: string;
  nrCpu?: number;
  nrRamGb?: number;
  nrDiscoGb?: number;
  dsSo?: string;
  vlPreco: number;
  dsCiclo: 'MENSAL' | 'ANUAL' | 'HORA';
  nrDiaVencimento: number;
  dtProximaCobranca?: string;
  cdCartaoCredito?: number;
  nmCartaoVinculado?: string;
  snAtivo: 'S' | 'N';
  dsObservacao?: string;
}

export interface MetaCompra {
  cdMeta: number;
  nmMeta: string;
  dsObservacao?: string;
  vlAlvo: number;
  vlPoupado: number;
  dtPrazo?: string;
  snConcluida: 'S' | 'N';
  snAtivo: 'S' | 'N';
}

export interface Ocorrencia {
  cdOcorrencia: number;
  tpOrigem: 'CONTA' | 'ASSINATURA' | 'FACULDADE' | 'ACADEMIA';
  cdOrigem: number;
  nmItem: string;
  vlEsperado: number;
  vlPago?: number;
  dtVencimento: string;
  dtPagamento?: string;
  dsComprovanteUrl?: string;
  snPago: 'S' | 'N';
  nrDiasAviso: number;
  snAvisoAtivo: 'S' | 'N';
}

export interface Divida {
  cdDivida: number;
  nmDivida: string;
  dsCredor?: string;
  vlTotalOriginal: number;
  vlSaldoDevedor: number;
  vlParcela: number;
  taxaJurosMensal: number;
  nrParcelasTotais: number;
  nrParcelasPagas: number;
  dtVencimentoParcela?: string;
  snQuitada: 'S' | 'N';
  snAtivo: 'S' | 'N';
}

export interface PerfilFinanceiro {
  cdPerfil: number;
  vlSalarioLiquido: number;
  vlRendaVariavel: number;
  vlOutrasRendas: number;
  dsPerfilRisco: string;
}

export interface Faculdade {
  cdFaculdade: number;
  nmCurso: string;
  nmInstituicao: string;
  dsSemestre: string;
  vlMensalidade: number;
  nrDiaVencimento: number;
  vlMatricula?: number;
  dtPagamentoMatricula?: string;
  dsComprovanteMatricula?: string;
  nrDiasAviso: number;
  snAvisoAtivo: string;
  snAtivo: string;
}

export interface DashboardFaculdade {
  faculdade: Faculdade;
  ocorrencias: Ocorrencia[];
  totalInvestido: number;
  qtdPagas: number;
  qtdPendentes: number;
}

export interface Academia {
  cdAcademia: number;
  nmAcademia: string;
  vlMensalidadeAcademia: number;
  nrDiaVencimentoAcademia: number;
  snAcademiaNamorada: string;
  nmTitularTerceiro: string;
  vlAcademiaNamorada: number;
  snAcademiaNamoradaReembolsado: string;
  nmPersonal: string;
  vlPersonalUnitario: number;
  nrQtdPessoas: number;
  vlSuplementos: number;
  nrDiaVencimentoPersonal: number;
  nrDiasAviso: number;
  snAvisoAtivo: string;
  snAtivo: string;
}

export interface DashboardAcademia {
  academia: Academia;
  ocorrencias: Ocorrencia[];
  totalInvestidoSaude: number;
  custoFitnessBolsoMensal: number;
  qtdPagas: number;
  qtdPendentes: number;
}

export interface AnaliseQuitacao {
  resumo: {
    totalDividasAtivas: number;
    totalSaldoDevedor: number;
    totalParcelaMensal: number;
  };
  estrategiaAvalanche: Divida[];
  estrategiaBolaDeNeve: Divida[];
  todasDividas: Divida[];
}

export interface PixParcelado {
  cdPixParcelado: number;
  nmDescricao: string;
  dsEstabelecimento?: string;
  nmBanco?: string;
  vlTotalCompra: number;
  vlParcela: number;
  taxaJurosMensal: number;
  vlTotalComJuros: number;
  nrParcelasTotais: number;
  nrParcelasPagas: number;
  nrDiaVencimento: number;
  dtPrimeiraParcela?: string;
  dsComprovanteUrl?: string;
  snQuitada: 'S' | 'N';
  snAtivo: 'S' | 'N';
}

export interface PixParceladoResumo {
  resumo: {
    qtdComprasAtivas: number;
    qtdEmAberto: number;
    vlTotalParcelado: number;
    vlRestante: number;
    vlParcelaMensal: number;
    vlJurosTotal: number;
  };
  compras: PixParcelado[];
}

export interface DashboardData {
  mes: number;
  ano: number;
  resumoMes: {
    totalEsperado: number;
    totalPago: number;
    totalPendente: number;
    percentualPago: number;
    qtdPago: number;
    qtdPendente: number;
    totalItens: number;
  };
  proximosVencimentos: Ocorrencia[];
  metas: MetaCompra[];
  todasOcorrenciasMes: Ocorrencia[];
}

export interface AvisoPendente {
  cdOcorrencia: number;
  tpOrigem: string;
  cdOrigem: number;
  nmItem: string;
  vlEsperado: number;
  dtVencimento: string;
  nrDiasAviso: number;
  mensagemSugerida: string;
}

export interface AvisoHistorico {
  cdAviso: number;
  cdOcorrencia: number;
  dtReferencia: string;
  dsTelefoneDestino?: string;
  dsStatus: string;
  tsEnvio: string;
  ocorrencia?: Ocorrencia;
}

export interface CartaoConfig {
  cdCartao: number;
  numeroCartao: string;
  idOperadora: number;
  nmCartao: string;
  tokenKim?: string;
  vlSaldoMinimo: number;
  vlSaldoAtual?: number;
  dsUltimaLinha?: string;
  dtUltimaUtilizacao?: string;
  dsCorCard?: string;
  snAtivo?: string;
}

export interface ExtratoItem {
  numeroCartao: string;
  linhaOnibusUtilizada: string;
  dataUtilizacao: string;
  valorDebitado: number;
  saldoBanco: number;
  descTipoUtilizacao: string;
  operadoraDto?: { id: number };
  id?: { codIdentifExt: string; codIdentifCarga: number; dataUso: string };
}

export interface DashboardCartao {
  config: CartaoConfig;
  extrato: ExtratoItem[];
  resumo: {
    saldoAtual: number;
    ultimaLinha: string;
    dataUltimaUtilizacao?: string;
    valorDebitado: number;
    tipoCartao: string;
  };
  erro?: string;
}

export interface CartaoCreditoCompra {
  cdCompra: number;
  cdCartaoCredito: number;
  dsCompra: string;
  vlTotal: number;
  nrParcelas: number;
  nrParcelaAtual: number;
  vlParcela: number;
  dtCompra: string;
  nmCategoria: string;
}

export interface CartaoCredito {
  cdCartaoCredito: number;
  nmCartao: string;
  nmBanco: string;
  nmBandeira: string;
  nrUltimosDigitos?: string;
  vlLimiteTotal: number;
  vlLimiteUsado: number;
  nrDiaFechamento: number;
  nrDiaVencimento: number;
  dsCorCard: string;
  snAtivo: string;
  compras?: CartaoCreditoCompra[];
}


