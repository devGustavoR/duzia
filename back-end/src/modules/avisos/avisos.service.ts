import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { AvisoEnviadoEntity } from '../../entities/aviso-enviado.entity';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(OcorrenciaEntity)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEntity>,
    @InjectRepository(AvisoEnviadoEntity)
    private readonly avisoRepo: Repository<AvisoEnviadoEntity>,
  ) {}

  formatDateISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Returns occurrences that are pending, alert active, due within N days, and not yet notified today
   */
  async getAvisosPendentes() {
    const todayStr = this.formatDateISO(new Date());

    // Fetch occurrences due in next 15 days that are unpaid and alert-active
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 15);
    const maxFutureStr = this.formatDateISO(maxFutureDate);

    const candidates = await this.ocorrenciaRepo.createQueryBuilder('o')
      .where('o.sn_aviso_ativo = :ativo', { ativo: 'S' })
      .andWhere('o.sn_pago = :pago', { pago: 'N' })
      .andWhere('o.dt_vencimento >= :today', { today: todayStr })
      .andWhere('o.dt_vencimento <= :maxFuture', { maxFuture: maxFutureStr })
      .getMany();

    // Filter by nrDiasAviso logic: dtVencimento - Today <= nrDiasAviso
    const todayDate = new Date(todayStr);

    const filtered = candidates.filter((item) => {
      const vencDate = new Date(item.dtVencimento);
      const diffMs = vencDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= item.nrDiasAviso;
    });

    if (filtered.length === 0) return [];

    // Filter out occurrences already notified today or for this reference date
    const ocorrenciaIds = filtered.map((f) => f.cdOcorrencia);
    const avisosEnviados = await this.avisoRepo.find({
      where: {
        cdOcorrencia: In(ocorrenciaIds),
        dtReferencia: todayStr,
      },
    });

    const jaEnviadosMap = new Set(avisosEnviados.map((a) => a.cdOcorrencia));

    return filtered
      .filter((item) => !jaEnviadosMap.has(item.cdOcorrencia))
      .map((item) => {
        const [year, month, day] = item.dtVencimento.split('-');
        const valFormatted = Number(item.vlEsperado).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        return {
          cdOcorrencia: item.cdOcorrencia,
          tpOrigem: item.tpOrigem,
          cdOrigem: item.cdOrigem,
          nmItem: item.nmItem,
          vlEsperado: item.vlEsperado,
          dtVencimento: item.dtVencimento,
          nrDiasAviso: item.nrDiasAviso,
          mensagemSugerida: `🔔 *Lembrete Duzia*: O item "${item.nmItem}" no valor de *${valFormatted}* vence em *${day}/${month}/${year}*.`,
        };
      });
  }

  /**
   * Callback to record a successful alert dispatch
   */
  async confirmarEnvio(cdOcorrencia: number, dsTelefoneDestino?: string, dsStatus = 'ENVIADO') {
    const todayStr = this.formatDateISO(new Date());

    const registro = this.avisoRepo.create({
      cdOcorrencia,
      dtReferencia: todayStr,
      dsTelefoneDestino,
      dsStatus,
    });

    return this.avisoRepo.save(registro);
  }

  /**
   * Get history of sent notifications
   */
  getHistorico() {
    return this.avisoRepo.find({
      relations: { ocorrencia: true },
      order: { tsEnvio: 'DESC' },
      take: 50,
    });
  }
}
