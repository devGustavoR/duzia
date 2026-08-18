'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { fetchApi, AvisoPendente, AvisoHistorico } from '@/lib/api';
import { formatDateBR, formatCurrency } from '@/lib/utils';
import {
  Bell,
  MessageSquare,
  Key,
  CheckCircle2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AvisosPage() {
  const [pendentes, setPendentes] = useState<AvisoPendente[]>([]);
  const [historico, setHistorico] = useState<AvisoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('duzia-secret-api-key');

  const loadAvisosData = async () => {
    try {
      setLoading(true);
      const [pend, hist] = await Promise.all([
        fetchApi<AvisoPendente[]>(`/avisos/pendentes?apiKey=${apiKeyInput}`),
        fetchApi<AvisoHistorico[]>('/avisos/historico'),
      ]);
      setPendentes(pend);
      setHistorico(hist);
    } catch (err: any) {
      toast.error('Erro ao consultar pendências ou histórico de avisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvisosData();
  }, []);

  const handleSimularDisparo = async (item: AvisoPendente) => {
    try {
      await fetchApi('/avisos/confirmar', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKeyInput },
        body: JSON.stringify({
          cdOcorrencia: item.cdOcorrencia,
          dsTelefoneDestino: 'Simulação Web',
          dsStatus: 'ENVIADO',
        }),
      });
      toast.success(`Aviso de "${item.nmItem}" registrado como enviado!`);
      loadAvisosData();
    } catch (err) {
      toast.error('Erro ao confirmar envio.');
    }
  };

  return (
    <div>
      <Header
        title="Notificações WhatsApp"
        subtitle="Integração com n8n e Evolution API para lembretes automáticos"
      />

      {/* Integration Info Banner com g-hub Merlot & Red */}
      <div className="glass-card rounded-2xl p-6 mb-8 border border-[#ea2a33]/30 bg-gradient-to-r from-[#4a0404]/40 via-[#050505] to-[#050505]">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Como funciona o disparo de avisos
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              O n8n executa diariamente uma rotina que consulta a API do Duzia para obter as contas a vencer nos próximos N dias. Após enviar a mensagem via Evolution API no seu WhatsApp, o n8n chama o callback do backend garantindo a <strong>idempotência</strong> (o mesmo aviso não é enviado duas vezes).
            </p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-[#ea2a33] font-mono bg-white/5 p-2 rounded-lg border border-white/10 w-fit">
              <Key className="h-3.5 w-3.5" /> Header de Autenticação: X-API-KEY: {apiKeyInput}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avisos Prontos para Disparo Hoje */}
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#ea2a33]" />
              <h2 className="text-base font-bold text-white">
                Pendentes para Notificação Hoje
              </h2>
            </div>
            <button
              onClick={loadAvisosData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#94a3b8] text-sm animate-pulse">
              Verificando lembretes pendentes...
            </div>
          ) : pendentes.length === 0 ? (
            <div className="py-10 text-center text-[#94a3b8] text-xs">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              Nenhum aviso pendente para envio no momento!
            </div>
          ) : (
            <div className="space-y-4">
              {pendentes.map((item) => (
                <div
                  key={item.cdOcorrencia}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {item.nmItem}
                    </span>
                    <span className="text-xs font-black text-amber-400">
                      {formatCurrency(item.vlEsperado)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono bg-[#050505] p-2.5 rounded-lg border border-white/10">
                    {item.mensagemSugerida}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#94a3b8]">
                      Vence em: {formatDateBR(item.dtVencimento)} ({item.nrDiasAviso}d antes)
                    </span>
                    <button
                      onClick={() => handleSimularDisparo(item)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#ea2a33]/20 text-[#ea2a33] border border-[#ea2a33]/30 hover:bg-[#ea2a33] hover:text-white transition-all"
                    >
                      <Send className="h-3 w-3" /> Simular Envio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Avisos Disparados */}
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Histórico de Avisos Enviados
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#94a3b8] text-sm animate-pulse">
              Carregando histórico...
            </div>
          ) : historico.length === 0 ? (
            <div className="py-10 text-center text-[#94a3b8] text-xs">
              Nenhum aviso registrado no histórico até o momento.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {historico.map((h) => (
                <div
                  key={h.cdAviso}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">
                      {h.ocorrencia?.nmItem || `Ocorrência #${h.cdOcorrencia}`}
                    </p>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">
                      Referência: {formatDateBR(h.dtReferencia)} · Status: {h.dsStatus}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(h.tsEnvio).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
