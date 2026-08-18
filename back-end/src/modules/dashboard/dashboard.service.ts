import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';
import { OcorrenciasService } from '../ocorrencias/ocorrencias.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(OcorrenciaEntity)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEntity>,
    @InjectRepository(MetaCompraEntity)
    private readonly metaRepo: Repository<MetaCompraEntity>,
    private readonly ocorrenciasService: OcorrenciasService,
  ) {}

  async getDashboardData(month?: number, year?: number) {
    // Run automatic duplicate cleanup
    await this.ocorrenciasService.cleanUpDuplicates();

    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const rawOcorrenciasMes = await this.ocorrenciaRepo.find({
      where: {
        dtVencimento: Between(startDate, endDate),
      },
      order: { dtVencimento: 'ASC' },
    });

    // In-memory deduplication fallback by (tpOrigem, cdOrigem, dtVencimento)
    const uniqueMap = new Map<string, OcorrenciaEntity>();
    rawOcorrenciasMes.forEach((item) => {
      const key = `${item.tpOrigem}_${item.cdOrigem}_${item.dtVencimento}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    const ocorrenciasMes = Array.from(uniqueMap.values());

    let totalEsperado = 0;
    let totalPago = 0;
    let qtdPago = 0;
    let qtdPendente = 0;

    ocorrenciasMes.forEach((item) => {
      const val = Number(item.vlEsperado || 0);
      totalEsperado += val;
      if (item.snPago === 'S') {
        totalPago += Number(item.vlPago || item.vlEsperado || 0);
        qtdPago++;
      } else {
        qtdPendente++;
      }
    });

    const totalPendente = Math.max(0, totalEsperado - totalPago);
    const percentualPago =
      totalEsperado > 0 ? Math.round((totalPago / totalEsperado) * 100) : 0;

    // Fetch top 5 upcoming unpaid occurrences starting from today or current month
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const rawProximos = await this.ocorrenciaRepo
      .createQueryBuilder('o')
      .where('o.sn_pago = :pago', { pago: 'N' })
      .andWhere('o.dt_vencimento >= :today', { today: todayStr })
      .orderBy('o.dt_vencimento', 'ASC')
      .getMany();

    const proximosMap = new Map<string, OcorrenciaEntity>();
    rawProximos.forEach((item) => {
      const key = `${item.tpOrigem}_${item.cdOrigem}_${item.dtVencimento}`;
      if (!proximosMap.has(key)) {
        proximosMap.set(key, item);
      }
    });
    const proximosVencimentos = Array.from(proximosMap.values()).slice(0, 5);

    // Fetch purchase goals
    const metas = await this.metaRepo.find({
      where: { snAtivo: 'S' },
      order: { snConcluida: 'ASC', dtPrazo: 'ASC' },
      take: 4,
    });

    return {
      mes: m,
      ano: y,
      resumoMes: {
        totalEsperado,
        totalPago,
        totalPendente,
        percentualPago,
        qtdPago,
        qtdPendente,
        totalItens: ocorrenciasMes.length,
      },
      proximosVencimentos,
      metas,
      todasOcorrenciasMes: ocorrenciasMes,
    };
  }
}
