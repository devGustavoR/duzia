import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContaEntity } from '../../entities/conta.entity';
import { OcorrenciasService } from '../ocorrencias/ocorrencias.service';
import { parseFaturaNeoenergia } from './parsers/neoenergia.parser';

@Injectable()
export class ContasService {
  constructor(
    @InjectRepository(ContaEntity)
    private readonly repo: Repository<ContaEntity>,
    private readonly ocorrenciasService: OcorrenciasService,
  ) {}

  async findAll(): Promise<ContaEntity[]> {
    let contas = await this.repo.find({
      relations: { categoria: true },
      where: { snAtivo: 'S' },
      order: { nmConta: 'ASC' },
    });

    const temNeon = contas.some((c) => c.nmConta.includes('Neon'));
    if (!temNeon) {
      const contaNeon = this.repo.create({
        nmConta: 'Fatura Cartão Neon - Agosto',
        vlValor: 1044.46,
        snRecorrente: 'S',
        snFixo: 'N',
        dsFrequencia: 'MENSAL',
        nrDiaVencimento: 17,
        dtVencimentoInicial: '2026-08-17',
        nrDiasAviso: 3,
        snAvisoAtivo: 'S',
        snAtivo: 'S',
        dsObservacao:
          'Boleto Fatura Neon • Linha Digitável: 74593.10640 27222.012000 02111.090029 7 15410000104446 • Vencimento: 17/08/2026',
      });
      const saved = await this.repo.save(contaNeon);
      await this.ocorrenciasService.generateForConta(saved);

      contas = await this.repo.find({
        relations: { categoria: true },
        where: { snAtivo: 'S' },
        order: { nmConta: 'ASC' },
      });
    }

    return contas;
  }

  findOne(id: number): Promise<ContaEntity | null> {
    return this.repo.findOne({
      where: { cdConta: id, snAtivo: 'S' },
      relations: { categoria: true },
    });
  }

  async create(dto: Partial<ContaEntity>): Promise<ContaEntity> {
    const item = this.repo.create(dto);
    const saved = await this.repo.save(item);
    await this.ocorrenciasService.generateForConta(saved);
    return saved;
  }

  async update(id: number, dto: Partial<ContaEntity>): Promise<ContaEntity | null> {
    await this.repo.update(id, dto);
    const updated = await this.findOne(id);
    if (updated) {
      await this.ocorrenciasService.generateForConta(updated);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
    await this.ocorrenciasService.removePendingForOrigem('CONTA', id);
  }

  async createFromFaturaPdfNeoenergia(texto: string): Promise<ContaEntity> {
    const fatura = parseFaturaNeoenergia(texto);

    const nmConta = fatura.referenciaMesAno
      ? `Energia Elétrica - Neoenergia Coelba (${fatura.referenciaMesAno})`
      : `Energia Elétrica - Neoenergia Coelba (venc. ${fatura.vencimento})`;

    const dsObservacao = [
      fatura.codigoCliente ? `Código do cliente: ${fatura.codigoCliente}` : null,
      fatura.linhaDigitavel ? `Linha digitável: ${fatura.linhaDigitavel}` : null,
      `Vencimento: ${fatura.vencimento}`,
    ]
      .filter(Boolean)
      .join(' • ');

    const dia = Number(fatura.vencimento.split('-')[2]);

    const existente = await this.repo.findOne({
      where: { nmConta, snAtivo: 'S' },
    });

    const dto: Partial<ContaEntity> = {
      nmConta,
      vlValor: fatura.valor,
      snRecorrente: 'S',
      snFixo: 'N',
      dsFrequencia: 'MENSAL',
      nrDiaVencimento: dia,
      dtVencimentoInicial: fatura.vencimento,
      nrDiasAviso: 3,
      snAvisoAtivo: 'S',
      snAtivo: 'S',
      dsObservacao,
    };

    if (existente) {
      return this.update(existente.cdConta, dto) as Promise<ContaEntity>;
    }
    return this.create(dto);
  }
}
