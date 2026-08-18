'use client';

import { useState, useEffect } from 'react';
import { fetchApi, Ocorrencia } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Upload,
  FileCheck,
  CheckCircle2,
  X,
  Eye,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface PagamentoModalProps {
  ocorrencia: Ocorrencia | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PagamentoModal({
  ocorrencia,
  isOpen,
  onClose,
  onSuccess,
}: PagamentoModalProps) {
  const [vlPago, setVlPago] = useState('');
  const [dtPagamento, setDtPagamento] = useState('');
  const [comprovanteBase64, setComprovanteBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ocorrencia) {
      setVlPago(String(ocorrencia.vlPago || ocorrencia.vlEsperado || ''));
      const today = new Date().toISOString().split('T')[0];
      setDtPagamento(ocorrencia.dtPagamento || today);
      setComprovanteBase64(ocorrencia.dsComprovanteUrl || null);
      setFileName(ocorrencia.dsComprovanteUrl ? 'Comprovante Anexado' : null);
    }
  }, [ocorrencia]);

  if (!isOpen || !ocorrencia) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo do comprovante deve ser menor que 5MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprovanteBase64(reader.result as string);
      toast.success(`Comprovante "${file.name}" carregado!`);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(vlPago);
    if (!valNum || valNum <= 0) {
      toast.error('Informe um valor pago válido.');
      return;
    }

    if (!comprovanteBase64) {
      toast.error('Por favor, anexe o comprovante de pagamento antes de confirmar.');
      return;
    }

    setLoading(true);
    try {
      await fetchApi(`/ocorrencias/${ocorrencia.cdOcorrencia}/pagar`, {
        method: 'POST',
        body: JSON.stringify({
          vlPago: valNum,
          dtPagamento,
          dsComprovanteUrl: comprovanteBase64,
        }),
      });

      toast.success(`Pagamento e comprovante de "${ocorrencia.nmItem}" salvos com sucesso!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative bg-[#050505]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Confirmar Pagamento</h2>
              <p className="text-xs text-[#94a3b8]">{ocorrencia.nmItem}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmarPagamento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Pago (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={vlPago}
                  onChange={(e) => setVlPago(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data do Pagamento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="date"
                  required
                  value={dtPagamento}
                  onChange={(e) => setDtPagamento(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#ea2a33]"
                />
              </div>
            </div>
          </div>

          {/* Helper de Desconto Flexivel */}
          <div className="text-[11px] text-[#94a3b8] bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>💡 Teve desconto este mês? Altere o valor pago livremente.</span>
            {parseFloat(vlPago) > 0 && parseFloat(vlPago) < Number(ocorrencia.vlEsperado || 0) && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                Desconto: {formatCurrency(Number(ocorrencia.vlEsperado) - parseFloat(vlPago))}
              </span>
            )}
          </div>

          {/* Area de Upload de Comprovante Obrigatorio */}
          <div>
            <label className="block text-xs font-bold text-rose-300 mb-1 flex items-center justify-between">
              <span>Anexar Comprovante de Compra/PIX *</span>
              <span className="text-[10px] font-normal text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
            </label>

            <div className="relative border-2 border-dashed border-white/15 hover:border-[#ea2a33]/50 rounded-xl p-4 text-center bg-white/5 transition-all">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {comprovanteBase64 ? (
                <div className="flex flex-col items-center gap-2">
                  <FileCheck className="h-8 w-8 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 truncate max-w-[250px]">
                    {fileName || 'Comprovante Anexado'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={comprovanteBase64}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ea2a33] hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> Visualizar Anexo
                    </a>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400">Clique para substituir</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-7 w-7 text-[#ea2a33] mb-1" />
                  <p className="text-xs font-bold text-slate-200">
                    Clique ou arraste o arquivo do comprovante aqui
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Comprovante de pagamento bancário, PIX ou recibo
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea2a33] hover:bg-[#d4222a] text-white shadow-lg shadow-[#ea2a33]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Confirmar e Anexar Comprovante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
