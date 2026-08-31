'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, PixParcelado, PixParceladoResumo } from '@/lib/api';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Plus,
  Landmark,
  CheckCircle2,
  Trash2,
  Pencil,
  TrendingUp,
  Wallet,
  CalendarClock,
  Upload,
  FileCheck,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

type EditingPix = Partial<PixParcelado> & { dsComprovanteBase64?: string | null };

export default function PixParceladoPage() {
  const [data, setData] = useState<PixParceladoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingPix | null>(null);
  const [comprovanteName, setComprovanteName] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<PixParceladoResumo>('/pix-parcelado/resumo');
      setData(res);
    } catch (err) {
      toast.error('Erro ao carregar compras via Pix Parcelado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNew = () => {
    setEditingItem({
      nrParcelasTotais: 12,
      nrParcelasPagas: 0,
      nrDiaVencimento: 10,
      taxaJurosMensal: 0,
    });
    setComprovanteName(null);
    setModalOpen(true);
  };

  const openEdit = (item: PixParcelado) => {
    setEditingItem({ ...item, dsComprovanteBase64: item.dsComprovanteUrl || null });
    setComprovanteName(item.dsComprovanteUrl ? 'Comprovante anexado' : null);
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O comprovante deve ter menos de 5MB.');
      return;
    }
    setComprovanteName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingItem((prev) =>
        prev ? { ...prev, dsComprovanteBase64: reader.result as string } : prev,
      );
      toast.success(`Comprovante "${file.name}" carregado!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nmDescricao || !editingItem?.vlTotalCompra) {
      toast.error('Preencha a descrição e o valor total da compra.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nmDescricao: editingItem.nmDescricao,
        dsEstabelecimento: editingItem.dsEstabelecimento || null,
        nmBanco: editingItem.nmBanco || null,
        vlTotalCompra: editingItem.vlTotalCompra || 0,
        vlParcela: editingItem.vlParcela || 0,
        taxaJurosMensal: editingItem.taxaJurosMensal || 0,
        vlTotalComJuros: editingItem.vlTotalComJuros || 0,
        nrParcelasTotais: editingItem.nrParcelasTotais || 1,
        nrParcelasPagas: editingItem.nrParcelasPagas || 0,
        nrDiaVencimento: editingItem.nrDiaVencimento || 10,
        dtPrimeiraParcela: editingItem.dtPrimeiraParcela || null,
        dsComprovanteUrl: editingItem.dsComprovanteBase64 || null,
      };

      if (editingItem.cdPixParcelado) {
        await fetchApi(`/pix-parcelado/${editingItem.cdPixParcelado}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Compra parcelada atualizada!');
      } else {
        await fetchApi('/pix-parcelado', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Compra parcelada cadastrada!');
      }
      setModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar compra parcelada.');
    } finally {
      setSaving(false);
    }
  };

  const handlePagarParcela = async (item: PixParcelado) => {
    try {
      await fetchApi(`/pix-parcelado/${item.cdPixParcelado}/pagar-parcela`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success(`Parcela de "${item.nmDescricao}" registrada como paga!`);
      loadData();
    } catch (err) {
      toast.error('Erro ao registrar parcela.');
    }
  };

  const handleEstornar = async (item: PixParcelado) => {
    try {
      await fetchApi(`/pix-parcelado/${item.cdPixParcelado}/estornar-parcela`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Parcela estornada.');
      loadData();
    } catch (err) {
      toast.error('Erro ao estornar parcela.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta compra parcelada?')) return;
    try {
      await fetchApi(`/pix-parcelado/${id}`, { method: 'DELETE' });
      toast.success('Compra parcelada excluída.');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir.');
    }
  };

  const resumo = data?.resumo;
  const compras = data?.compras || [];

  // Prévia da parcela calculada no modal (Tabela Price)
  const previewParcela = (() => {
    if (!editingItem) return 0;
    if (editingItem.vlParcela && editingItem.vlParcela > 0) return editingItem.vlParcela;
    const total = Number(editingItem.vlTotalCompra || 0);
    const n = Number(editingItem.nrParcelasTotais || 1);
    const taxa = Number(editingItem.taxaJurosMensal || 0) / 100;
    if (!total || !n) return 0;
    if (taxa > 0) {
      const fator = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
      return Math.round(total * fator * 100) / 100;
    }
    return Math.round((total / n) * 100) / 100;
  })();

  return (
    <div>
      <Header
        title="Pix Parcelado"
        subtitle="Controle das compras pagas via Pix Parcelado do banco, parcelas quitadas e juros embutidos"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-semibold uppercase text-[#94a3b8]">
            Total Parcelado (c/ juros)
          </span>
          <p className="text-xl sm:text-2xl font-black text-white mt-2">
            {formatCurrency(resumo?.vlTotalParcelado || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {resumo?.qtdComprasAtivas || 0} compras · {resumo?.qtdEmAberto || 0} em aberto
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-semibold uppercase text-[#94a3b8]">
            Restante a Pagar
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(resumo?.vlRestante || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Somatório das parcelas em aberto</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-semibold uppercase text-[#94a3b8] flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Parcela Mensal
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
            {formatCurrency(resumo?.vlParcelaMensal || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Impacto no orçamento deste mês</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/40 to-[#050505] flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-[#ea2a33] flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Juros Totais Pagos
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {formatCurrency(resumo?.vlJurosTotal || 0)}
            </p>
          </div>
          <button
            onClick={openNew}
            className="mt-3 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#ea2a33] hover:bg-[#d4222a] text-white text-xs font-bold shadow-md shadow-[#ea2a33]/25 transition-all"
          >
            <Plus className="h-4 w-4" /> Nova Compra
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-5">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#ea2a33]" />
            <h2 className="text-base font-bold text-white">Compras via Pix Parcelado</h2>
          </div>
          <span className="text-xs font-bold text-[#94a3b8]">
            {compras.length} registro{compras.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#94a3b8] text-sm animate-pulse">
            Carregando compras...
          </div>
        ) : compras.length === 0 ? (
          <div className="py-12 text-center text-[#94a3b8]">
            <Landmark className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <p className="font-bold text-white">Nenhuma compra via Pix Parcelado registrada.</p>
            <p className="text-xs mt-1">
              Cadastre uma compra para acompanhar as parcelas e os juros.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {compras.map((item) => {
              const restantes = Math.max(
                0,
                Number(item.nrParcelasTotais || 0) - Number(item.nrParcelasPagas || 0),
              );
              const pctPaga = Math.min(
                100,
                Math.round(
                  (Number(item.nrParcelasPagas || 0) /
                    Number(item.nrParcelasTotais || 1)) *
                    100,
                ),
              );

              return (
                <div
                  key={item.cdPixParcelado}
                  className={`glass-card glass-card-hover rounded-xl p-4 border ${
                    item.snQuitada === 'S'
                      ? 'border-emerald-500/30'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          item.snQuitada === 'S'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#ea2a33]/15 text-[#ea2a33] border border-[#ea2a33]/30'
                        }`}
                      >
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.nmDescricao}</h3>
                          {item.nmBanco && (
                            <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                              {item.nmBanco}
                            </span>
                          )}
                          {item.snQuitada === 'S' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Quitada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-1">
                          {item.dsEstabelecimento && `${item.dsEstabelecimento} · `}
                          Compra: <strong className="text-white">{formatCurrency(item.vlTotalCompra)}</strong>
                          {Number(item.taxaJurosMensal) > 0 && (
                            <>
                              {' '}· Juros: <strong className="text-rose-400">{item.taxaJurosMensal}% a.m.</strong>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Parcela <strong className="text-white">{formatCurrency(item.vlParcela)}</strong> · vence dia {item.nrDiaVencimento}
                          {item.dtPrimeiraParcela && ` · 1ª em ${formatDateBR(item.dtPrimeiraParcela)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.dsComprovanteUrl && (
                        <a
                          href={item.dsComprovanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" /> Comprovante
                        </a>
                      )}
                      {item.snQuitada !== 'S' && (
                        <button
                          onClick={() => handlePagarParcela(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          Pagar 1 Parcela
                        </button>
                      )}
                      {Number(item.nrParcelasPagas) > 0 && (
                        <button
                          onClick={() => handleEstornar(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                          title="Estornar 1 parcela"
                        >
                          <TrendingUp className="h-4 w-4 rotate-180" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.cdPixParcelado)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progresso */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>
                        {item.nrParcelasPagas}/{item.nrParcelasTotais} parcelas pagas
                        {restantes > 0 && ` · faltam ${restantes}`}
                      </span>
                      <span className="font-bold text-white">
                        Total c/ juros: {formatCurrency(item.vlTotalComJuros)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.snQuitada === 'S' ? 'bg-emerald-400' : 'bg-[#ea2a33]'
                        }`}
                        style={{ width: `${pctPaga}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && editingItem && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl p-5 sm:p-6 pb-safe border border-white/10 shadow-2xl overflow-y-auto overscroll-contain max-h-[92vh] animate-sheet-up md:animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#ea2a33]" />
              {editingItem.cdPixParcelado ? 'Editar Compra Parcelada' : 'Nova Compra via Pix Parcelado'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição da compra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notebook Dell, Geladeira"
                  value={editingItem.nmDescricao || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nmDescricao: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estabelecimento / Recebedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Magazine Luiza"
                    value={editingItem.dsEstabelecimento || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, dsEstabelecimento: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Banco do Pix Parcelado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú"
                    value={editingItem.nmBanco || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, nmBanco: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor total da compra (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3000.00"
                    value={editingItem.vlTotalCompra || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlTotalCompra: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa de juros mensal (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.99"
                    value={editingItem.taxaJurosMensal || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        taxaJurosMensal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nº parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.nrParcelasTotais || 1}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrParcelasTotais: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Já pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.nrParcelasPagas || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrParcelasPagas: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia venc.
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingItem.nrDiaVencimento || 10}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        nrDiaVencimento: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor da parcela (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Automático se vazio"
                    value={editingItem.vlParcela || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        vlParcela: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data da 1ª parcela
                  </label>
                  <input
                    type="date"
                    value={editingItem.dtPrimeiraParcela?.split('T')[0] || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, dtPrimeiraParcela: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                  />
                </div>
              </div>

              <div className="text-[11px] text-[#94a3b8] bg-white/5 p-2.5 rounded-xl border border-white/10">
                Parcela estimada:{' '}
                <strong className="text-white">{formatCurrency(previewParcela)}</strong> ×{' '}
                {editingItem.nrParcelasTotais || 1} ={' '}
                <strong className="text-white">
                  {formatCurrency(previewParcela * (editingItem.nrParcelasTotais || 1))}
                </strong>{' '}
                (deixe o valor da parcela vazio para usar a Tabela Price).
              </div>

              {/* Comprovante */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Anexar comprovante / contrato (opcional)</span>
                  <span className="text-[10px] font-normal text-slate-400">PDF, JPG, PNG (máx 5MB)</span>
                </label>
                <div className="relative border-2 border-dashed border-white/15 hover:border-[#ea2a33]/50 rounded-xl p-4 text-center bg-white/5 transition-all">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {editingItem.dsComprovanteBase64 ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileCheck className="h-7 w-7 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 truncate max-w-[250px]">
                        {comprovanteName || 'Comprovante anexado'}
                      </span>
                      <span className="text-[10px] text-slate-400">Clique para substituir</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-[#ea2a33] mb-1" />
                      <p className="text-xs font-bold text-slate-200">
                        Clique ou arraste o comprovante
                      </p>
                    </div>
                  )}
                </div>
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
                  {saving ? 'Salvando...' : 'Salvar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
