'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { fetchApi, DashboardCartao, CartaoConfig } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Bus,
  CreditCard,
  RefreshCw,
  Settings,
  Search,
  ArrowLeft,
  AlertTriangle,
  Clock,
  TrendingDown,
  ShieldAlert,
  Key,
  Hash,
  Palette,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const COLOR_OPTIONS = [
  { label: 'Vermelho SalvadorCARD', value: 'from-[#ea2a33] to-[#4a0404]' },
  { label: 'Azul Metropolitano', value: 'from-blue-600 to-indigo-950' },
  { label: 'Verde Vale Transporte', value: 'from-emerald-600 to-teal-950' },
  { label: 'Roxo Estudantil', value: 'from-purple-600 to-slate-950' },
  { label: 'Dourado Premium', value: 'from-amber-500 to-stone-900' },
];

export default function CartaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const cardId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<DashboardCartao | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<CartaoConfig>>({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<DashboardCartao>(`/cartao/${cardId}`);
      setData(res);
      if (res.config) {
        setEditingConfig(res.config);
      }
      if (res.erro) {
        toast.warning(res.erro);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar detalhes do cartão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await fetchApi<DashboardCartao>(`/cartao/${cardId}/refresh`, {
        method: 'POST',
      });
      setData(res);
      if (res.erro) {
        toast.error(res.erro);
      } else {
        toast.success('Saldo e extrato sincronizados com sucesso!');
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar saldo: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig.numeroCartao) {
      toast.error('Informe o número do cartão.');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/cartao', {
        method: 'POST',
        body: JSON.stringify({ ...editingConfig, cdCartao: Number(cardId) }),
      });
      toast.success('Cartão atualizado!');
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao salvar cartão.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Deseja realmente remover este cartão?')) return;
    try {
      await fetchApi(`/cartao/${cardId}`, { method: 'DELETE' });
      toast.success('Cartão removido.');
      router.push('/cartoes');
    } catch (err: any) {
      toast.error('Erro ao remover cartão.');
    }
  };

  useEffect(() => {
    loadData();
  }, [cardId]);

  const config = data?.config;
  const resumo = data?.resumo;
  const extrato = data?.extrato || [];

  const saldo = resumo?.saldoAtual ?? Number(config?.vlSaldoAtual || 0);
  const saldoMinimo = Number(config?.vlSaldoMinimo || 15);
  const isSaldoBaixo = saldo < saldoMinimo;
  const bgGradient = config?.dsCorCard || 'from-[#ea2a33] to-[#4a0404]';

  const extratoFiltrado = extrato.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.linhaOnibusUtilizada.toLowerCase().includes(term) ||
      item.descTipoUtilizacao.toLowerCase().includes(term) ||
      item.dataUtilizacao.includes(term)
    );
  });

  const totalGastoExtrato = extrato.reduce((acc, curr) => acc + Number(curr.valorDebitado || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Voltar */}
      <div>
        <Link
          href="/cartoes"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#94a3b8] hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Meus Cartões
        </Link>
        <Header
          title={config?.nmCartao || 'Detalhes do Cartão'}
          subtitle={`Cartão #${config?.numeroCartao || cardId} · Extrato individual e gerenciamento`}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      ) : (
        <>
          {/* Alerta de erro de Token (se houver) */}
          {data?.erro && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Status da Conexão KIM</h4>
                  <p className="text-xs text-amber-200 mt-0.5">{data.erro}</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shrink-0 transition-all shadow-md"
              >
                Atualizar Token
              </button>
            </div>
          )}

          {/* Top Grid: Digital Card Preview & Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Digital Card Preview */}
            <div className={`lg:col-span-1 glass-card rounded-2xl p-6 border border-white/20 bg-gradient-to-tr ${bgGradient} relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[220px]`}>
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                      <Bus className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-extrabold tracking-wider text-white uppercase truncate max-w-[160px]">
                      {resumo?.tipoCartao || config?.nmCartao}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isSaldoBaixo
                        ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                    }`}
                  >
                    {isSaldoBaixo ? 'Saldo Baixo' : 'Ativo'}
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest block">
                    Número do Cartão
                  </span>
                  <span className="text-lg font-mono font-bold tracking-widest text-white mt-0.5 block">
                    {config?.numeroCartao}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block font-medium">
                    Saldo no Cartão
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrency(saldo)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all"
                  >
                    <Settings className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={handleDeleteCard}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition-colors"
                    title="Excluir Cartão"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Saldo Atual */}
              <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-[#ea2a33]" /> Saldo Atual
                    </span>
                    {isSaldoBaixo && (
                      <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
                    )}
                  </div>
                  <p className="text-3xl font-black text-white mt-3">
                    {formatCurrency(saldo)}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Alerta para saldos menores que: <strong className="text-white">{formatCurrency(saldoMinimo)}</strong>
                </p>
              </div>

              {/* Última Linha Pegada */}
              <div className="glass-card p-5 rounded-2xl border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/30 to-[#050505] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5">
                    <Bus className="h-4 w-4 text-[#ea2a33]" /> Última Linha Utilizada
                  </span>
                  <p className="text-2xl font-black text-white mt-2">
                    {resumo?.ultimaLinha || config?.dsUltimaLinha || 'N/A'}
                  </p>
                  {resumo?.valorDebitado !== undefined && (
                    <span className="text-xs font-bold text-rose-400 mt-1 inline-block">
                      Debitado: -{formatCurrency(resumo.valorDebitado)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {resumo?.dataUltimaUtilizacao
                    ? new Date(resumo.dataUltimaUtilizacao).toLocaleString('pt-BR')
                    : 'Sem registro'}
                </p>
              </div>

              {/* Viagens no Extrato */}
              <div className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-[#ea2a33]" /> Viagens no Extrato
                  </span>
                  <p className="text-3xl font-black text-white mt-3">
                    {extrato.length} <span className="text-xs font-normal text-slate-400">registros</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total debitado: <strong className="text-white">{formatCurrency(totalGastoExtrato)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Tabela do Extrato Completo */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Extrato de Passagens deste Cartão</h2>
                  <p className="text-xs text-slate-400">
                    Histórico ao vivo do cartão #{config?.numeroCartao}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por linha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ea2a33] w-48 sm:w-64"
                  />
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold transition-all shadow-md shadow-[#ea2a33]/20 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Sincronizando...' : 'Atualizar Saldo Live'}
                </button>
              </div>
            </div>

            {extratoFiltrado.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Bus className="h-10 w-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">Nenhum lançamento no extrato.</p>
                <p className="text-xs text-slate-500">
                  Clique em "Atualizar Saldo Live" para carregar as passagens do KIM.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Linha do Ônibus</th>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4 text-right">Debitado</th>
                      <th className="py-3 px-4 text-right">Saldo Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {extratoFiltrado.map((item, index) => {
                      const isZero = Number(item.valorDebitado || 0) === 0;
                      return (
                        <tr
                          key={index}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#ea2a33] group-hover:border-[#ea2a33]/40 transition-colors">
                                <Bus className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-extrabold text-white text-sm block">
                                  Linha {item.linhaOnibusUtilizada}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            {new Date(item.dataUtilizacao).toLocaleString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10 font-medium text-[11px]">
                              {item.descTipoUtilizacao}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isZero ? (
                              <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                Integração (R$ 0,00)
                              </span>
                            ) : (
                              <span className="font-black text-rose-400 text-sm">
                                -{formatCurrency(item.valorDebitado)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-black text-white text-sm">
                              {formatCurrency(item.saldoBanco)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Editar Cartão Específico */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#ea2a33]" /> Editar Configurações do Cartão
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SalvadorCARD Estudante"
                  value={editingConfig.nmCartao || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, nmCartao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 036500336819453"
                  value={editingConfig.numeroCartao || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, numeroCartao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ID Operadora
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={editingConfig.idOperadora || 1}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        idOperadora: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saldo Mínimo (Alerta R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={editingConfig.vlSaldoMinimo || 15}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        vlSaldoMinimo: parseFloat(e.target.value) || 15,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ea2a33]" /> Estilo Visual do Cartão
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setEditingConfig({ ...editingConfig, dsCorCard: c.value })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        (editingConfig.dsCorCard || COLOR_OPTIONS[0].value) === c.value
                          ? 'border-white bg-white/15 text-white font-bold'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-gradient-to-r ${c.value} shrink-0`}></div>
                      <span className="text-xs truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-[#ea2a33]" /> KIM Token
                </label>
                <textarea
                  rows={2}
                  placeholder="Cole aqui o token do KIM..."
                  value={editingConfig.tokenKim || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, tokenKim: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#ea2a33]"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ea2a33] text-white hover:bg-[#d4222a] shadow-md shadow-[#ea2a33]/30 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
