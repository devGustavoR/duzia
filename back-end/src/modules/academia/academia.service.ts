import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademiaEntity } from '../../entities/academia.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { OcorrenciasService } from '../ocorrencias/ocorrencias.service';

@Injectable()
export class AcademiaService {
  constructor(
    @InjectRepository(AcademiaEntity)
    private readonly repo: Repository<AcademiaEntity>,
    @InjectRepository(OcorrenciaEntity)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEntity>,
    private readonly ocorrenciasService: OcorrenciasService,
  ) {}

  async getAcademia(): Promise<AcademiaEntity> {
    const list = await this.repo.find({
      where: { snAtivo: 'S' },
      order: { cdAcademia: 'DESC' },
    });

    if (list.length > 0) {
      if (list.length > 1) {
        for (let i = 1; i < list.length; i++) {
          await this.repo.update(list[i].cdAcademia, { snAtivo: 'N' });
        }
      }
      return list[0];
    }

    const defaultAcademia = this.repo.create({
      nmAcademia: 'Smart Fit',
      vlMensalidadeAcademia: 120,
      nrDiaVencimentoAcademia: 10,
      snAcademiaNamorada: 'S',
      nmTitularTerceiro: 'Namorada',
      vlAcademiaNamorada: 120,
      snAcademiaNamoradaReembolsado: 'S', // 100% Reembolsado via PIX por ela
      nmPersonal: 'Personal Trainer',
      vlPersonalUnitario: 400,
      nrQtdPessoas: 2, // Você + Namorada (100% pago por você)
      vlSuplementos: 200,
      nrDiaVencimentoPersonal: 10,
      nrDiasAviso: 3,
      snAvisoAtivo: 'S',
      snAtivo: 'S',
    });

    const saved = await this.repo.save(defaultAcademia);
    await this.ocorrenciasService.generateForAcademia(saved);
    return saved;
  }

  async saveAcademia(dto: Partial<AcademiaEntity>): Promise<AcademiaEntity> {
    const current = await this.getAcademia();
    const { cdAcademia, tsCriacao, tsAtualizacao, ...cleanDto } = dto as any;

    await this.repo.update(current.cdAcademia, cleanDto);
    const updated = await this.getAcademia();

    // Delete unpaid pending occurrences for ACADEMIA to clean old records
    await this.ocorrenciaRepo.delete({
      tpOrigem: 'ACADEMIA',
      snPago: 'N',
    });

    await this.ocorrenciasService.generateForAcademia(updated);
    return updated;
  }

  async getDashboardAcademia() {
    await this.ocorrenciasService.cleanUpDuplicates();
    const academia = await this.getAcademia();

    // Fetch occurrences for academia
    const rawOcorrencias = await this.ocorrenciaRepo.find({
      where: {
        tpOrigem: 'ACADEMIA',
        cdOrigem: academia.cdAcademia,
      },
      order: { dtVencimento: 'ASC' },
    });

    // In-memory deduplication by nmItem + dtVencimento
    const mapByKey = new Map<string, OcorrenciaEntity>();
    rawOcorrencias.forEach((item) => {
      const dateKey = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : item.dtVencimento;
      const key = `${item.nmItem}_${dateKey}`;
      if (!mapByKey.has(key)) {
        mapByKey.set(key, item);
      }
    });

    const ocorrencias = Array.from(mapByKey.values());

    const totalInvestidoSaude = ocorrencias
      .filter((o) => o.snPago === 'S')
      .reduce((acc, o) => acc + Number(o.vlPago || o.vlEsperado || 0), 0);

    // Custo Fitness Bolso Mensal:
    // Mensalidade Usuário (120) + Personal 2x 100% Bolso (800) + Suplementos (200) + (Academia Namorada se NAO reembolsado)
    const personalTotalBolso = Number(academia.vlPersonalUnitario || 0) * (academia.nrQtdPessoas || 2);
    const academiaNamoradaBolso = academia.snAcademiaNamorada === 'S' && academia.snAcademiaNamoradaReembolsado === 'S'
      ? 0
      : Number(academia.vlAcademiaNamorada || 0);

    const custoFitnessBolsoMensal = Number(academia.vlMensalidadeAcademia || 0) + personalTotalBolso + Number(academia.vlSuplementos || 0) + academiaNamoradaBolso;

    return {
      academia,
      ocorrencias,
      totalInvestidoSaude,
      custoFitnessBolsoMensal,
      qtdPagas: ocorrencias.filter((o) => o.snPago === 'S').length,
      qtdPendentes: ocorrencias.filter((o) => o.snPago === 'N').length,
    };
  }
}
