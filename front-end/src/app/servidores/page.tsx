'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, CartaoCredito, Servidor } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Server,
  Plus,
  Copy,
  Check,
  Search,
  Cpu,
  HardDrive,
  Activity,
  CreditCard,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  Terminal,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

// Default initial servers for demonstration / initial load (Real Contabo Server from User)
const DEFAULT_SERVERS: Servidor[] = [
  {
    cdServidor: 1,
    nmServidor: 'Contabo Cloud VPS 4 (vmi3504804)',
    nmProvedor: 'Contabo',
    dsIpHost: '86.48.21.97',
    dsProjeto: 'Servidor Principal (US-east)',
    nrCpu: 4,
    nrRamGb: 8,
    nrDiscoGb: 100,
    dsSo: 'Linux (US-east)',
    vlPreco: 45.73, // US$ 8.50 convertido em R$ 45,73 na fatura
    dsCiclo: 'MENSAL',
    nrDiaVencimento: 12,
    dtProximaCobranca: '2026-09-12',
    nmCartaoVinculado: 'Nubank (Mastercard)',
    snAtivo: 'S',
    dsObservacao: 'Servidor Contabo Cloud VPS 4 • Criado em 12/08/2026 • 4 vCPU, 8 GB RAM, 100 GB SSD • Usuário: root • US$ 8.50 (R$ 45,73 no Nubank)',
  },
];

const PROVIDER_OPTIONS = [
  'Hetzner',
  'AWS',
  'DigitalOcean',
  'Vultr',
  'Contabo',
  'Supabase',
  'Cloudflare',
  'Oracle Cloud',
  'OVH',
  'Google Cloud',
  'Linode / Akamai',
  'Outro',
];

export default function ServidoresPage() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Filters & Tabs
  const [selectedTab, setSelectedTab] = useState<'todos' | 'cartao_visao'>('todos');
  const [selectedProvider, setSelectedProvider] = useState<string>('TODOS');
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Partial<Servidor> | null>(null);
  const [saving, setSaving] = useState(false);

  // Load data from localStorage / default mock & API cartoes
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      // Load Credit Cards from API
      try {
        const cardsRes = await fetchApi<CartaoCredito[]>('/cartao-credito');
        setCartoes(cardsRes || []);
      } catch (err) {
        console.warn('Não foi possível carregar cartões de crédito da API:', err);
      }

      // Load Servidores from localStorage or fallback to default
      try {
        const saved = localStorage.getItem('duzia_servidores_v2');
        if (saved) {
          setServidores(JSON.parse(saved));
        } else {
          setServidores(DEFAULT_SERVERS);
          localStorage.setItem('duzia_servidores_v2', JSON.stringify(DEFAULT_SERVERS));
        }
      } catch (err) {
        setServidores(DEFAULT_SERVERS);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Save servers array to state & localStorage
  const updateServidoresState = (newList: Servidor[]) => {
    setServidores(newList);
    try {
      localStorage.setItem('duzia_servidores_v2', JSON.stringify(newList));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  };

  // Copy IP handler
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success(`IP / Host ${ip} copiado para a área de transferência!`);
    setTimeout(() => setCopiedIp(null), 2500);
  };

  // Modal Open
  const handleOpenAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingServer({
      nmServidor: '',
      nmProvedor: 'Hetzner',
      dsIpHost: '',
      dsProjeto: '',
      nrCpu: 2,
      nrRamGb: 4,
      nrDiscoGb: 40,
      dsSo: 'Ubuntu 24.04 LTS',
      vlPreco: 0,
      dsCiclo: 'MENSAL',
      nrDiaVencimento: 10,
      dtProximaCobranca: today,
      nmCartaoVinculado: cartoes[0] ? `${cartoes[0].nmCartao} (${cartoes[0].nmBanco})` : 'Cartão de Crédito',
      snAtivo: 'S',
      dsObservacao: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (srv: Servidor) => {
    setEditingServer(srv);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServer?.nmServidor || !editingServer?.vlPreco) {
      toast.error('Preencha o nome do servidor e o valor pago.');
      return;
    }

    setSaving(true);
    try {
      if (editingServer.cdServidor) {
        // Edit existing
        const updated = servidores.map((s) =>
          s.cdServidor === editingServer.cdServidor ? ({ ...s, ...editingServer } as Servidor) : s,
        );
        updateServidoresState(updated);
        toast.success('Servidor atualizado com sucesso!');
      } else {
        // Create new
        const newServer: Servidor = {
          ...(editingServer as Servidor),
          cdServidor: Date.now(),
          snAtivo: editingServer.snAtivo || 'S',
          dsCiclo: editingServer.dsCiclo || 'MENSAL',
          nrDiaVencimento: editingServer.nrDiaVencimento || 10,
        };
        updateServidoresState([newServer, ...servidores]);
        toast.success('Servidor cadastrado com sucesso!');
      }
      setModalOpen(false);
      setEditingServer(null);
    } catch (err) {
      toast.error('Erro ao salvar informações do servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('Deseja realmente remover este servidor da lista?')) return;
    const updated = servidores.filter((s) => s.cdServidor !== id);
    updateServidoresState(updated);
    toast.success('Servidor removido.');
  };

  const toggleStatus = (srv: Servidor) => {
    const newStatus = srv.snAtivo === 'S' ? 'N' : 'S';
    const updated = servidores.map((s) =>
      s.cdServidor === srv.cdServidor ? { ...s, snAtivo: newStatus as 'S' | 'N' } : s,
    );
    updateServidoresState(updated);
    toast.success(newStatus === 'S' ? 'Servidor ativado.' : 'Servidor pausado.');
  };

  // Calculations
  const calcMensalValue = (srv: Servidor) => {
    const val = Number(srv.vlPreco || 0);
    if (srv.dsCiclo === 'ANUAL') return val / 12;
    if (srv.dsCiclo === 'HORA') return val * 24 * 30; // aprox 720h
    return val;
  };

  const totalInfraMensal = servidores
    .filter((s) => s.snAtivo === 'S')
    .reduce((acc, s) => acc + calcMensalValue(s), 0);

  const servidoresAtivosCount = servidores.filter((s) => s.snAtivo === 'S').length;
  const servidoresComCartao = servidores.filter((s) => s.nmCartaoVinculado && s.nmCartaoVinculado !== 'Nenhum');

  // Provider badge colors helper
  const getProviderColor = (provedor: string) => {
    const p = provedor.toLowerCase();
    if (p.includes('hetzner')) return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (p.includes('aws') || p.includes('amazon')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (p.includes('digitalocean')) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    if (p.includes('vultr')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (p.includes('supabase')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (p.includes('cloudflare')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (p.includes('oracle')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (p.includes('contabo')) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  // Filtered List
  const filteredServidores = servidores.filter((srv) => {
    const matchesSearch =
      srv.nmServidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.dsIpHost && srv.dsIpHost.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (srv.dsProjeto && srv.dsProjeto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      srv.nmProvedor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider = selectedProvider === 'TODOS' || srv.nmProvedor === selectedProvider;
    const matchesCard =
      selectedCardFilter === 'TODOS' ||
      (srv.nmCartaoVinculado && srv.nmCartaoVinculado.includes(selectedCardFilter));

    return matchesSearch && matchesProvider && matchesCard;
  });

  // Group by Card for "Visão Unificada no Cartão"
  const cardSummaryMap = cartoes.map((card) => {
    const serversOnCard = servidores.filter(
      (s) => s.nmCartaoVinculado && s.nmCartaoVinculado.toLowerCase().includes(card.nmCartao.toLowerCase()),
    );
    const totalSpent = serversOnCard.reduce((acc, s) => acc + calcMensalValue(s), 0);

    return {
      card,
      servers: serversOnCard,
      totalSpent,
    };
  });

  return (
    <div>
      <Header
        title="Servidores & Cloud Infrastructure"
        subtitle="Gerenciamento unificado de VPS, cloud, banco de dados e contas pagas no cartão"
      />

      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Mensal em Infra */}
        <div className="glass-card rounded-2xl p-5 border border-[#ea2a33]/30 bg-gradient-to-br from-[#4a0404]/40 via-[#050505] to-[#050505] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Custo de Infra / mês</span>
            <div className="p-2.5 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">
            {formatCurrency(totalInfraMensal)}
            <span className="text-xs font-medium text-[#94a3b8]"> /mês</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#94a3b8]">
            <Sparkles className="h-3.5 w-3.5 text-[#ea2a33]" />
            <span>Valor convertido mensalmente</span>
          </div>
        </div>

        {/* Servidores Ativos */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-[#050505]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Servidores Ativos</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">
            {servidoresAtivosCount}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">/ {servidores.length} totais</span>
          </p>
          <p className="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {servidoresAtivosCount} rodando perfeitamente
          </p>
        </div>

        {/* Pagos no Cartão de Crédito */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-[#050505]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cartão de Crédito</span>
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">{servidoresComCartao.length}</p>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {cartoes.length > 0 ? `${cartoes.length} cartão(ões) cadastrados` : 'Pronto para vincular cartões'}
          </p>
        </div>

        {/* Ação Novo Servidor */}
        <div className="glass-card rounded-2xl p-5 border border-[#ea2a33]/40 bg-gradient-to-br from-[#ea2a33]/10 to-transparent flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#ea2a33] uppercase tracking-wider">Novo Servidor</span>
            <p className="text-xs text-slate-300 mt-1">Adicione VPS, Cloud ou servidor dedicado</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/25 transition-all mt-4"
          >
            <Plus className="h-4 w-4" /> Cadastrar Servidor
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Todos os Servidores vs Visão no Cartão */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setSelectedTab('todos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedTab === 'todos'
              ? 'bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/40 shadow-sm'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="h-4 w-4" /> Todos os Servidores ({servidores.length})
        </button>

        <button
          onClick={() => setSelectedTab('cartao_visao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedTab === 'cartao_visao'
              ? 'bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/40 shadow-sm'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Visão Unificada no Cartão de Crédito
        </button>
      </div>

      {/* TAB 1: TODOS OS SERVIDORES */}
      {selectedTab === 'todos' && (
        <>
          {/* Controls Bar: Search & Provider Filters */}
          <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-white/10 bg-[#050505]/90">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Buscar por nome, IP, hostname ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Provider */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[#94a3b8]" />
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#ea2a33]/50"
                >
                  <option value="TODOS">Todos os Provedores</option>
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Card */}
              {cartoes.length > 0 && (
                <select
                  value={selectedCardFilter}
                  onChange={(e) => setSelectedCardFilter(e.target.value)}
                  className="bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#ea2a33]/50"
                >
                  <option value="TODOS">Todos os Cartões</option>
                  {cartoes.map((c) => (
                    <option key={c.cdCartaoCredito} value={c.nmCartao}>
                      {c.nmCartao} ({c.nmBanco})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Grid of Servers */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
              <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
              <div className="h-56 bg-white/5 rounded-2xl border border-white/10"></div>
            </div>
          ) : filteredServidores.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
              <Server className="h-12 w-12 text-[#94a3b8] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-white mb-1">Nenhum servidor encontrado</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto mb-6">
                Você ainda não cadastrou nenhum servidor com esses filtros. Adicione suas máquinas da Hetzner, AWS,
                DigitalOcean, etc.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea2a33] text-white text-xs font-bold hover:bg-[#d4222a] transition-all"
              >
                <Plus className="h-4 w-4" /> Cadastrar Meu Primeiro Servidor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServidores.map((srv) => {
                const provBadgeClass = getProviderColor(srv.nmProvedor);
                const isCopied = copiedIp === srv.dsIpHost;
                const monthlyVal = calcMensalValue(srv);

                return (
                  <div
                    key={srv.cdServidor}
                    className={`glass-card rounded-2xl p-5 border transition-all duration-200 hover:border-white/20 flex flex-col justify-between relative group ${
                      srv.snAtivo === 'S'
                        ? 'border-white/10 bg-[#050505]/90'
                        : 'border-white/5 bg-[#050505]/40 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${provBadgeClass}`}
                          >
                            {srv.nmProvedor}
                          </span>
                          {srv.snAtivo === 'S' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              <Clock className="h-3 w-3" />
                              Pausado
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleStatus(srv)}
                            title={srv.snAtivo === 'S' ? 'Pausar Servidor' : 'Ativar Servidor'}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(srv)}
                            title="Editar Servidor"
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(srv.cdServidor)}
                            title="Excluir Servidor"
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Server Name & Project */}
                      <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                        {srv.nmServidor}
                      </h3>

                      {srv.dsProjeto && (
                        <p className="text-[11px] font-medium text-rose-300/80 mt-0.5 flex items-center gap-1">
                          <Layers className="h-3 w-3 shrink-0" />
                          <span className="truncate">{srv.dsProjeto}</span>
                        </p>
                      )}

                      {/* IP / Host Copy Box */}
                      {srv.dsIpHost && (
                        <div className="mt-3 bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono text-slate-300">
                          <div className="flex items-center gap-2 truncate">
                            <Terminal className="h-3.5 w-3.5 text-[#ea2a33] shrink-0" />
                            <span className="truncate font-semibold">{srv.dsIpHost}</span>
                          </div>
                          <button
                            onClick={() => handleCopyIp(srv.dsIpHost!)}
                            className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            title="Copiar IP/Host"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Hardware Specs Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-[#94a3b8]">
                        {srv.nrCpu && (
                          <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300">
                            <Cpu className="h-3 w-3 text-cyan-400" />
                            {srv.nrCpu} vCPU
                          </span>
                        )}
                        {srv.nrRamGb && (
                          <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300">
                            <Layers className="h-3 w-3 text-purple-400" />
                            {srv.nrRamGb} GB RAM
                          </span>
                        )}
                        {srv.nrDiscoGb && (
                          <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300">
                            <HardDrive className="h-3 w-3 text-amber-400" />
                            {srv.nrDiscoGb} GB SSD
                          </span>
                        )}
                        {srv.dsSo && (
                          <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-400 truncate max-w-[120px]">
                            {srv.dsSo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Billing Info */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider block">
                          Cobrança ({srv.dsCiclo.toLowerCase()})
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-white">{formatCurrency(monthlyVal)}</span>
                          <span className="text-[10px] text-[#94a3b8]">/mês</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#94a3b8] block">Pagamento em</span>
                        <div className="inline-flex items-center gap-1 text-[11px] text-rose-300 font-medium">
                          <CreditCard className="h-3 w-3" />
                          <span className="max-w-[110px] truncate">{srv.nmCartaoVinculado || 'Sem Cartão'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: VISÃO UNIFICADA NO CARTÃO DE CRÉDITO */}
      {selectedTab === 'cartao_visao' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/30 via-[#050505] to-[#050505]">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#ea2a33]" />
              Resumo de Servidores & Infraestrutura por Cartão de Crédito
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1">
              Veja o impacto financeiro exato de cada um dos seus servidores na fatura dos seus cartões de crédito.
            </p>
          </div>

          {cartoes.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-white/10">
              <CreditCard className="h-10 w-10 text-[#94a3b8] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-white">Nenhum cartão de crédito cadastrado</p>
              <p className="text-xs text-[#94a3b8] mt-1">
                Cadastre seus cartões na tela de Cartões de Crédito para ter o agrupamento automático de faturas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cardSummaryMap.map(({ card, servers, totalSpent }) => (
                <div
                  key={card.cdCartaoCredito}
                  className="glass-card rounded-2xl p-5 border border-white/10 bg-[#050505]/90 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{card.nmCartao}</h4>
                          <span className="text-xs text-[#94a3b8]">
                            {card.nmBanco} • Vence dia {card.nrDiaVencimento}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Total Infra</span>
                        <p className="text-base font-black text-rose-400">{formatCurrency(totalSpent)}/mês</p>
                      </div>
                    </div>

                    {/* Servers list on this card */}
                    {servers.length === 0 ? (
                      <p className="text-xs text-[#94a3b8] italic py-2">
                        Nenhum servidor vinculado a este cartão no momento.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {servers.map((srv) => (
                          <div
                            key={srv.cdServidor}
                            className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{srv.nmServidor}</p>
                              <span className="text-[10px] text-slate-400">
                                {srv.nmProvedor} • IP: {srv.dsIpHost || 'N/A'}
                              </span>
                            </div>
                            <span className="font-bold text-white">{formatCurrency(calcMensalValue(srv))}/mês</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>Qtd. de Serviços: {servers.length}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Cobrança Recorrente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ADICIONAR / EDITAR SERVIDOR */}
      {modalOpen && editingServer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-white/15 bg-[#0a0a0a] w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingServer.cdServidor ? 'Editar Servidor' : 'Novo Servidor & Cloud'}
                  </h3>
                  <p className="text-xs text-[#94a3b8]">Cadastre informações técnicas e dados de pagamento</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#94a3b8] hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome do Servidor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Servidor / Instância *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hetzner CX22 - API Backend"
                  value={editingServer.nmServidor || ''}
                  onChange={(e) => setEditingServer({ ...editingServer, nmServidor: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              {/* Provedor e Projeto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Provedor *</label>
                  <select
                    value={editingServer.nmProvedor || 'Hetzner'}
                    onChange={(e) => setEditingServer({ ...editingServer, nmProvedor: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Projeto / Aplicação</label>
                  <input
                    type="text"
                    placeholder="Ex: Duzia App Production"
                    value={editingServer.dsProjeto || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, dsProjeto: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              {/* IP / Host e Sistema Operacional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">IP Publico ou Hostname</label>
                  <input
                    type="text"
                    placeholder="Ex: 135.181.84.120"
                    value={editingServer.dsIpHost || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, dsIpHost: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sistema Operacional / Stack</label>
                  <input
                    type="text"
                    placeholder="Ex: Ubuntu 24.04 / Docker"
                    value={editingServer.dsSo || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, dsSo: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              {/* Specs Hardware: CPU, RAM, DISK */}
              <div className="grid grid-cols-3 gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">vCPUs</label>
                  <input
                    type="number"
                    min="1"
                    value={editingServer.nrCpu || 2}
                    onChange={(e) => setEditingServer({ ...editingServer, nrCpu: Number(e.target.value) })}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingServer.nrRamGb || 4}
                    onChange={(e) => setEditingServer({ ...editingServer, nrRamGb: Number(e.target.value) })}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">SSD (GB)</label>
                  <input
                    type="number"
                    min="5"
                    value={editingServer.nrDiscoGb || 40}
                    onChange={(e) => setEditingServer({ ...editingServer, nrDiscoGb: Number(e.target.value) })}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Preço, Ciclo e Dia Vencimento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Pago (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="30.00"
                    value={editingServer.vlPreco || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, vlPreco: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ciclo de Cobrança</label>
                  <select
                    value={editingServer.dsCiclo || 'MENSAL'}
                    onChange={(e) =>
                      setEditingServer({
                        ...editingServer,
                        dsCiclo: e.target.value as 'MENSAL' | 'ANUAL' | 'HORA',
                      })
                    }
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                    <option value="HORA">Por Hora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingServer.nrDiaVencimento || 10}
                    onChange={(e) =>
                      setEditingServer({ ...editingServer, nrDiaVencimento: Number(e.target.value) || 10 })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              {/* Cartão de Crédito Responsável */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cartão de Crédito Utilizado para Pagamento
                </label>
                <select
                  value={editingServer.nmCartaoVinculado || ''}
                  onChange={(e) => setEditingServer({ ...editingServer, nmCartaoVinculado: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ea2a33]"
                >
                  <option value="Nenhum (Boleto / Pix / Outro)">Nenhum (Boleto / Pix / Outro)</option>
                  {cartoes.length > 0 ? (
                    cartoes.map((c) => (
                      <option key={c.cdCartaoCredito} value={`${c.nmCartao} (${c.nmBanco})`}>
                        {c.nmCartao} - {c.nmBanco}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Nubank (Mastercard)">Nubank (Mastercard)</option>
                      <option value="Itaú Card">Itaú Card</option>
                      <option value="XP Visa Infinite">XP Visa Infinite</option>
                    </>
                  )}
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Anotações adicionais (ex: chave SSH utilizada, backups, etc.)"
                  value={editingServer.dsObservacao || ''}
                  onChange={(e) => setEditingServer({ ...editingServer, dsObservacao: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 py-2 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ea2a33]"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-lg shadow-[#ea2a33]/25 transition-all flex items-center gap-2"
                >
                  {saving ? 'Salva...' : editingServer.cdServidor ? 'Salvar Alterações' : 'Cadastrar Servidor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
