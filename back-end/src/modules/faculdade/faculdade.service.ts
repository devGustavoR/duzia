import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaculdadeEntity } from '../../entities/faculdade.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { OcorrenciasService } from '../ocorrencias/ocorrencias.service';

@Injectable()
export class FaculdadeService {
  constructor(
    @InjectRepository(FaculdadeEntity)
    private readonly repo: Repository<FaculdadeEntity>,
    @InjectRepository(OcorrenciaEntity)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEntity>,
    private readonly ocorrenciasService: OcorrenciasService,
  ) {}

  async getFaculdade(): Promise<FaculdadeEntity> {
    const list = await this.repo.find({
      where: { snAtivo: 'S' },
      order: { cdFaculdade: 'DESC' },
    });

    if (list.length > 0) {
      if (list.length > 1) {
        for (let i = 1; i < list.length; i++) {
          await this.repo.update(list[i].cdFaculdade, { snAtivo: 'N' });
        }
      }
      return list[0];
    }

    const defaultFaculdade = this.repo.create({
      nmCurso: 'Engenharia de Software',
      nmInstituicao: 'UNIFACS',
      dsSemestre: '5º Semestre',
      vlMensalidade: 1200,
      nrDiaVencimento: 5,
      nrDiasAviso: 3,
      snAvisoAtivo: 'S',
      snAtivo: 'S',
    });
    const saved = await this.repo.save(defaultFaculdade);
    await this.ocorrenciasService.generateForFaculdade(saved);
    return saved;
  }

  async saveFaculdade(dto: Partial<FaculdadeEntity>): Promise<FaculdadeEntity> {
    const current = await this.getFaculdade();
    const { cdFaculdade, tsCriacao, tsAtualizacao, ...cleanDto } = dto as any;

    await this.repo.update(current.cdFaculdade, cleanDto);
    const updated = await this.getFaculdade();

    // Delete old unpaid pending occurrences to clear previous institution (e.g. FIAP leftovers)
    await this.ocorrenciaRepo.delete({
      tpOrigem: 'FACULDADE',
      snPago: 'N',
    });

    // Update names of existing occurrences to match new course / institution
    const oldOccs = await this.ocorrenciaRepo.find({
      where: { tpOrigem: 'FACULDADE' },
    });
    for (const oc of oldOccs) {
      oc.nmItem = `Mensalidade ${updated.nmCurso} (${updated.nmInstituicao})`;
      await this.ocorrenciaRepo.save(oc);
    }

    // Re-generate clean occurrences
    await this.ocorrenciasService.generateForFaculdade(updated);
    return updated;
  }

  async getDashboardFaculdade() {
    await this.ocorrenciasService.cleanUpDuplicates();
    const faculdade = await this.getFaculdade();

    // Keep upcoming tuition occurrences in sync on every load (the daily
    // cron only covers contas + assinaturas).
    await this.ocorrenciasService.generateForFaculdade(faculdade);

    // Fetch occurrences for faculdade
    const rawOcorrencias = await this.ocorrenciaRepo.find({
      where: {
        tpOrigem: 'FACULDADE',
        cdOrigem: faculdade.cdFaculdade,
      },
      order: { dtVencimento: 'ASC' },
    });

    // In-memory deduplication by dtVencimento
    const mapByDate = new Map<string, OcorrenciaEntity>();
    rawOcorrencias.forEach((item) => {
      const dateKey = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : item.dtVencimento;
      if (!mapByDate.has(dateKey)) {
        mapByDate.set(dateKey, item);
      }
    });

    const ocorrencias = Array.from(mapByDate.values());

    let totalInvestido = ocorrencias
      .filter((o) => o.snPago === 'S')
      .reduce((acc, o) => acc + Number(o.vlPago || o.vlEsperado || 0), 0);

    // Add matricula if paid
    if (faculdade.vlMatricula && faculdade.dtPagamentoMatricula) {
      totalInvestido += Number(faculdade.vlMatricula);
    }

    return {
      faculdade,
      ocorrencias,
      totalInvestido,
      qtdPagas: ocorrencias.filter((o) => o.snPago === 'S').length,
      qtdPendentes: ocorrencias.filter((o) => o.snPago === 'N').length,
    };
  }
}
