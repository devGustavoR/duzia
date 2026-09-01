import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { ContaEntity } from '../../entities/conta.entity';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { FaculdadeEntity } from '../../entities/faculdade.entity';
import { AcademiaEntity } from '../../entities/academia.entity';

@Injectable()
export class OcorrenciasService implements OnModuleInit {
  private readonly logger = new Logger(OcorrenciasService.name);

  constructor(
    @InjectRepository(OcorrenciaEntity)
    private readonly repo: Repository<OcorrenciaEntity>,
    @InjectRepository(ContaEntity)
    private readonly contaRepo: Repository<ContaEntity>,
    @InjectRepository(AssinaturaEntity)
    private readonly assinaturaRepo: Repository<AssinaturaEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log('Cleaning up duplicate occurrences if any exist...');
    await this.cleanUpDuplicates();
  }

  /**
   * Delete duplicate occurrences keeping the earliest created record, and remove pending occurrences for inactive items
   */
  async cleanUpDuplicates(): Promise<void> {
    try {
      // A true duplicate matches on nm_item too: ACADEMIA legitimately has
      // several rows on the same date (mensalidade, namorada, personal), and
      // dropping them by (tp_origem, cd_origem, dt_vencimento) alone was
      // deleting the personal/namorada rows — payments included — on load.
      await this.repo.query(`
        DELETE FROM financeiro.tb_ocorrencia o1
        USING financeiro.tb_ocorrencia o2
        WHERE o1.tp_origem = o2.tp_origem
          AND (o1.cd_origem = o2.cd_origem OR o1.tp_origem = 'FACULDADE')
          AND o1.dt_vencimento = o2.dt_vencimento
          AND o1.nm_item = o2.nm_item
          AND o1.cd_ocorrencia > o2.cd_ocorrencia;
      `);

      await this.repo.query(`
        DELETE FROM financeiro.tb_ocorrencia
        WHERE sn_pago = 'N'
          AND (
            (tp_origem = 'CONTA' AND cd_origem IN (SELECT cd_conta FROM financeiro.tb_conta WHERE sn_ativo = 'N'))
            OR
            (tp_origem = 'ASSINATURA' AND cd_origem IN (SELECT cd_assinatura FROM financeiro.tb_assinatura WHERE sn_ativo = 'N'))
          );
      `);
      this.logger.log('Duplicate & inactive item occurrence cleanup finished successfully.');
    } catch (err: any) {
      this.logger.warn(`Could not run occurrence cleanup: ${err.message}`);
    }
  }

  /**
   * Remove all unpaid pending occurrences for a deleted/inactive item
   */
  async removePendingForOrigem(tpOrigem: string, cdOrigem: number): Promise<void> {
    await this.repo.delete({
      tpOrigem,
      cdOrigem,
      snPago: 'N',
    });
  }

  /**
   * Helper to format a Date object as YYYY-MM-DD string
   */
  formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Compute actual valid date for month/year with target day (e.g. Feb 30 becomes Feb 28/29)
   */
  getValidDueDate(year: number, month: number, targetDay: number): string {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const actualDay = Math.min(targetDay, lastDayOfMonth);
    return `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
  }

  /**
   * Sync/generate occurrences for a specific Conta
   */
  async generateForConta(conta: ContaEntity, monthsAhead = 6): Promise<void> {
    if (conta.snAtivo === 'N') return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 to 12

    // Load existing occurrences for this conta into an in-memory Map
    const existingList = await this.repo.find({
      where: {
        tpOrigem: 'CONTA',
        cdOrigem: conta.cdConta,
      },
    });

    const existingMap = new Map<string, OcorrenciaEntity>();
    existingList.forEach((item) => {
      const dStr = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : this.formatDateISO(new Date(item.dtVencimento));
      existingMap.set(dStr, item);
    });

    let contaTitle = conta.nmConta;
    let contaVlEsperado = Number(conta.vlValor);

    if (conta.snTerceiros === 'S') {
      const titular = conta.nmTitularTerceiro || 'Terceiro';
      const statusPix = conta.snReembolsado === 'S' ? 'PIX Reembolsado' : 'Cobrar PIX';
      contaTitle = `${conta.nmConta} (Pago p/ ${titular} · ${statusPix})`;
      if (conta.snReembolsado === 'S') {
        contaVlEsperado = Number(conta.vlCotaPropria || 0);
      }
    } else if (conta.snDividida === 'S' && conta.dsAmigosDivididos) {
      contaTitle = `${conta.nmConta} (Sua parte · Dividido com ${conta.dsAmigosDivididos})`;
    }

    if (conta.snRecorrente === 'N') {
      const dtVenc = conta.dtVencimentoInicial || this.formatDateISO(now);
      const existing = existingMap.get(dtVenc) || existingList[0];

      if (!existing) {
        await this.repo.save({
          tpOrigem: 'CONTA',
          cdOrigem: conta.cdConta,
          nmItem: contaTitle,
          vlEsperado: contaVlEsperado,
          dtVencimento: dtVenc,
          nrDiasAviso: conta.nrDiasAviso,
          snAvisoAtivo: conta.snAvisoAtivo,
          snPago: 'N',
        });
      } else {
        existing.nmItem = contaTitle;
        existing.vlEsperado = contaVlEsperado;
        existing.dtVencimento = dtVenc;
        existing.nrDiasAviso = conta.nrDiasAviso;
        existing.snAvisoAtivo = conta.snAvisoAtivo;
        await this.repo.save(existing);
      }
      return;
    }

    // Recurring bill
    const targetDay = conta.nrDiaVencimento || 1;
    for (let i = -1; i <= monthsAhead; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const dtVenc = this.getValidDueDate(y, m, targetDay);
      const existing = existingMap.get(dtVenc);

      if (!existing) {
        await this.repo.save({
          tpOrigem: 'CONTA',
          cdOrigem: conta.cdConta,
          nmItem: contaTitle,
          vlEsperado: contaVlEsperado,
          dtVencimento: dtVenc,
          nrDiasAviso: conta.nrDiasAviso,
          snAvisoAtivo: conta.snAvisoAtivo,
          snPago: 'N',
        });
      } else {
        existing.nmItem = contaTitle;
        existing.nrDiasAviso = conta.nrDiasAviso;
        existing.snAvisoAtivo = conta.snAvisoAtivo;
        if (conta.snFixo === 'S' && existing.snPago === 'N') {
          existing.vlEsperado = contaVlEsperado;
        }
        await this.repo.save(existing);
      }
    }
  }

  /**
   * Sync/generate occurrences for a specific Assinatura
   */
  async generateForAssinatura(assinatura: AssinaturaEntity, monthsAhead = 6): Promise<void> {
    if (assinatura.snAtivo === 'N') return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const targetDay = assinatura.nrDiaVencimento || 1;

    let assinaturaTitle = assinatura.nmAssinatura;
    let assinaturaVlEsperado = Number(assinatura.vlMensalidade);

    if (assinatura.snTerceiros === 'S') {
      const titular = assinatura.nmTitularTerceiro || 'Terceiro';
      const statusPix = assinatura.snReembolsado === 'S' ? 'PIX Reembolsado' : 'Cobrar PIX';
      assinaturaTitle = `${assinatura.nmAssinatura} (Pago p/ ${titular} · ${statusPix})`;
      if (assinatura.snReembolsado === 'S') {
        assinaturaVlEsperado = Number(assinatura.vlCotaPropria || 0);
      }
    } else if (assinatura.snDividida === 'S' && assinatura.dsAmigosDivididos) {
      assinaturaTitle = `${assinatura.nmAssinatura} (Sua parte · Dividido com ${assinatura.dsAmigosDivididos})`;
    }

    // Load existing occurrences for this assinatura into an in-memory Map
    const existingList = await this.repo.find({
      where: {
        tpOrigem: 'ASSINATURA',
        cdOrigem: assinatura.cdAssinatura,
      },
    });

    const existingMap = new Map<string, OcorrenciaEntity>();
    existingList.forEach((item) => {
      const dStr = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : this.formatDateISO(new Date(item.dtVencimento));
      existingMap.set(dStr, item);
    });

    for (let i = -1; i <= monthsAhead; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      if (assinatura.dsCiclo === 'ANUAL') {
        const nextChargeDate = new Date(assinatura.dtProximaCobranca);
        if (nextChargeDate.getMonth() + 1 !== m) {
          continue;
        }
      }

      const dtVenc = this.getValidDueDate(y, m, targetDay);
      const existing = existingMap.get(dtVenc);

      if (!existing) {
        await this.repo.save({
          tpOrigem: 'ASSINATURA',
          cdOrigem: assinatura.cdAssinatura,
          nmItem: assinaturaTitle,
          vlEsperado: assinaturaVlEsperado,
          dtVencimento: dtVenc,
          nrDiasAviso: assinatura.nrDiasAviso,
          snAvisoAtivo: assinatura.snAvisoAtivo,
          snPago: 'N',
        });
      } else {
        existing.nmItem = assinaturaTitle;
        existing.nrDiasAviso = assinatura.nrDiasAviso;
        existing.snAvisoAtivo = assinatura.snAvisoAtivo;
        if (existing.snPago === 'N') {
          existing.vlEsperado = assinaturaVlEsperado;
        }
        await this.repo.save(existing);
      }
    }
  }

  /**
   * Sync/generate occurrences for Faculdade tuition payments
   */
  async generateForFaculdade(faculdade: FaculdadeEntity, monthsAhead = 6): Promise<void> {
    if (faculdade.snAtivo === 'N') return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const targetDay = faculdade.nrDiaVencimento || 5;

    const existingList = await this.repo.find({
      where: {
        tpOrigem: 'FACULDADE',
        cdOrigem: faculdade.cdFaculdade,
      },
    });

    const existingMap = new Map<string, OcorrenciaEntity>();
    existingList.forEach((item) => {
      const dStr = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : this.formatDateISO(new Date(item.dtVencimento));
      existingMap.set(dStr, item);
    });

    for (let i = -1; i <= monthsAhead; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const dtVenc = this.getValidDueDate(y, m, targetDay);
      const existing = existingMap.get(dtVenc);

      if (!existing) {
        await this.repo.save({
          tpOrigem: 'FACULDADE',
          cdOrigem: faculdade.cdFaculdade,
          nmItem: `Mensalidade ${faculdade.nmCurso} (${faculdade.nmInstituicao})`,
          vlEsperado: faculdade.vlMensalidade,
          dtVencimento: dtVenc,
          nrDiasAviso: faculdade.nrDiasAviso || 3,
          snAvisoAtivo: faculdade.snAvisoAtivo || 'S',
          snPago: 'N',
        });
      } else {
        existing.nmItem = `Mensalidade ${faculdade.nmCurso} (${faculdade.nmInstituicao})`;
        existing.nrDiasAviso = faculdade.nrDiasAviso || 3;
        existing.snAvisoAtivo = faculdade.snAvisoAtivo || 'S';
        if (existing.snPago === 'N') {
          existing.vlEsperado = faculdade.vlMensalidade;
        }
        await this.repo.save(existing);
      }
    }
  }

  /**
   * Sync/generate occurrences for Academia, Personal (2x) & Suplementos
   */
  async generateForAcademia(academia: AcademiaEntity, monthsAhead = 6): Promise<void> {
    if (academia.snAtivo === 'N') return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const existingList = await this.repo.find({
      where: {
        tpOrigem: 'ACADEMIA',
        cdOrigem: academia.cdAcademia,
      },
    });

    const existingMap = new Map<string, OcorrenciaEntity>();
    existingList.forEach((item) => {
      const dStr = typeof item.dtVencimento === 'string'
        ? item.dtVencimento.split('T')[0]
        : this.formatDateISO(new Date(item.dtVencimento));
      const key = `${item.nmItem}_${dStr}`;
      existingMap.set(key, item);
    });

    for (let i = -1; i <= monthsAhead; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      // 1. Mensalidade da Academia (Sua cota)
      const dtVencAcademia = this.getValidDueDate(y, m, academia.nrDiaVencimentoAcademia || 10);
      const titleAcademia = `Mensalidade ${academia.nmAcademia} (Sua cota)`;
      const keyAcademia = `${titleAcademia}_${dtVencAcademia}`;
      const existingAcademia = existingMap.get(keyAcademia);

      if (!existingAcademia) {
        await this.repo.save({
          tpOrigem: 'ACADEMIA',
          cdOrigem: academia.cdAcademia,
          nmItem: titleAcademia,
          vlEsperado: Number(academia.vlMensalidadeAcademia || 0),
          dtVencimento: dtVencAcademia,
          nrDiasAviso: academia.nrDiasAviso || 3,
          snAvisoAtivo: academia.snAvisoAtivo || 'S',
          snPago: 'N',
        });
      } else {
        existingAcademia.nmItem = titleAcademia;
        if (existingAcademia.snPago === 'N') {
          existingAcademia.vlEsperado = Number(academia.vlMensalidadeAcademia || 0);
        }
        await this.repo.save(existingAcademia);
      }

      // 2. Mensalidade da Academia da Namorada (Terceiros / Reembolso PIX)
      if (academia.snAcademiaNamorada === 'S') {
        const titular = academia.nmTitularTerceiro || 'Namorada';
        const isReembolsado = academia.snAcademiaNamoradaReembolsado === 'S';
        const titleAcademiaNamorada = `Mensalidade ${academia.nmAcademia} (${titular} · ${isReembolsado ? '100% Reembolsado PIX' : 'Cobrar PIX'})`;
        const keyAcademiaNamorada = `${titleAcademiaNamorada}_${dtVencAcademia}`;
        const existingAcademiaNamorada = existingMap.get(keyAcademiaNamorada);
        const vlBolsoNamorada = isReembolsado ? 0 : Number(academia.vlAcademiaNamorada || 0);

        if (!existingAcademiaNamorada) {
          await this.repo.save({
            tpOrigem: 'ACADEMIA',
            cdOrigem: academia.cdAcademia,
            nmItem: titleAcademiaNamorada,
            vlEsperado: vlBolsoNamorada,
            dtVencimento: dtVencAcademia,
            nrDiasAviso: academia.nrDiasAviso || 3,
            snAvisoAtivo: academia.snAvisoAtivo || 'S',
            snPago: 'N',
          });
        } else {
          existingAcademiaNamorada.nmItem = titleAcademiaNamorada;
          if (existingAcademiaNamorada.snPago === 'N') {
            existingAcademiaNamorada.vlEsperado = vlBolsoNamorada;
          }
          await this.repo.save(existingAcademiaNamorada);
        }
      }

      // 3. Personal Trainer (2x - Pago 100% pelo Usuário para Você & Namorada)
      const dtVencPersonal = this.getValidDueDate(y, m, academia.nrDiaVencimentoPersonal || 10);
      const totalPersonalBruto = Number(academia.vlPersonalUnitario || 0) * (academia.nrQtdPessoas || 2);
      const titular = academia.nmTitularTerceiro || 'Namorada';
      const titlePersonal = `${academia.nmPersonal} (${academia.nrQtdPessoas || 2}x - Você & ${titular})`;
      const keyPersonal = `${titlePersonal}_${dtVencPersonal}`;
      const existingPersonal = existingMap.get(keyPersonal);

      if (!existingPersonal) {
        await this.repo.save({
          tpOrigem: 'ACADEMIA',
          cdOrigem: academia.cdAcademia,
          nmItem: titlePersonal,
          vlEsperado: totalPersonalBruto,
          dtVencimento: dtVencPersonal,
          nrDiasAviso: academia.nrDiasAviso || 3,
          snAvisoAtivo: academia.snAvisoAtivo || 'S',
          snPago: 'N',
        });
      } else {
        existingPersonal.nmItem = titlePersonal;
        if (existingPersonal.snPago === 'N') {
          existingPersonal.vlEsperado = totalPersonalBruto;
        }
        await this.repo.save(existingPersonal);
      }
    }
  }

  /**
   * Daily Cron running at 00:00 to ensure future occurrences are generated & duplicates removed
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyOccurrenceGeneration() {
    this.logger.log('Starting daily occurrence generator job...');
    await this.cleanUpDuplicates();
    const contas = await this.contaRepo.find({ where: { snAtivo: 'S' } });
    for (const c of contas) {
      await this.generateForConta(c, 3);
    }
    const assinaturas = await this.assinaturaRepo.find({ where: { snAtivo: 'S' } });
    for (const a of assinaturas) {
      await this.generateForAssinatura(a, 3);
    }
    this.logger.log('Daily occurrence generator job completed.');
  }

  /**
   * List occurrences for a given month and year (or all months if month === 0)
   */
  async findByMonth(month: number, year: number) {
    await this.cleanUpDuplicates();

    if (month === 0) {
      return this.repo.find({
        order: {
          dtVencimento: 'ASC',
          cdOcorrencia: 'ASC',
        },
      });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return this.repo.find({
      where: {
        dtVencimento: Between(startDate, endDate),
      },
      order: {
        dtVencimento: 'ASC',
        cdOcorrencia: 'ASC',
      },
    });
  }

  /**
   * List only paid occurrences (snPago = 'S'), matching payment date or due date
   */
  async findPagas(month?: number, year?: number) {
    await this.cleanUpDuplicates();

    if (month === 0 || !month || !year) {
      return this.repo.find({
        where: { snPago: 'S' },
        order: {
          dtPagamento: 'DESC',
          dtVencimento: 'DESC',
        },
      });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return this.repo.find({
      where: [
        { snPago: 'S', dtVencimento: Between(startDate, endDate) },
        { snPago: 'S', dtPagamento: Between(startDate, endDate) },
      ],
      order: {
        dtPagamento: 'DESC',
        dtVencimento: 'DESC',
      },
    });
  }

  /**
   * Toggle paid status for an occurrence with optional receipt attachment
   */
  async togglePago(
    id: number,
    vlPago?: number,
    dtPagamento?: string,
    dsComprovanteUrl?: string,
  ) {
    const oc = await this.repo.findOneByOrFail({ cdOcorrencia: id });
    if (oc.snPago === 'S' && !dsComprovanteUrl && vlPago === undefined) {
      oc.snPago = 'N';
      oc.vlPago = null;
      oc.dtPagamento = null;
      oc.dsComprovanteUrl = null;
    } else {
      oc.snPago = 'S';
      oc.vlPago = vlPago !== undefined ? vlPago : oc.vlEsperado;
      oc.dtPagamento = dtPagamento || this.formatDateISO(new Date());
      if (dsComprovanteUrl) {
        oc.dsComprovanteUrl = dsComprovanteUrl;
      }
    }
    return this.repo.save(oc);
  }

  /**
   * Update occurrence details (e.g. variable amount)
   */
  async update(id: number, dto: Partial<OcorrenciaEntity>) {
    await this.repo.update(id, dto);
    return this.repo.findOneBy({ cdOcorrencia: id });
  }

  /**
   * Remove occurrence
   */
  async remove(id: number) {
    await this.repo.delete(id);
  }
}
