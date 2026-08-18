import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { OcorrenciasService } from '../ocorrencias/ocorrencias.service';

@Injectable()
export class AssinaturasService {
  constructor(
    @InjectRepository(AssinaturaEntity)
    private readonly repo: Repository<AssinaturaEntity>,
    private readonly ocorrenciasService: OcorrenciasService,
  ) {}

  async findAll(): Promise<AssinaturaEntity[]> {
    let assinaturas = await this.repo.find({
      relations: { categoria: true },
      where: { snAtivo: 'S' },
      order: { nmAssinatura: 'ASC' },
    });

    const temClaude = assinaturas.some((a) => a.nmAssinatura.toLowerCase().includes('claude'));
    if (!temClaude) {
      const todayISO = new Date().toISOString().split('T')[0];
      const subClaude = this.repo.create({
        nmAssinatura: 'Anthropic* Claude Sub',
        vlMensalidade: 118.00,
        dsCiclo: 'MENSAL',
        snDividida: 'N',
        nrDiaVencimento: 28,
        dtProximaCobranca: '2026-08-28',
        nrDiasAviso: 3,
        snAvisoAtivo: 'S',
        snAtivo: 'S',
        nmCartaoVinculado: 'Neon (Visa)',
        dsObservacao: 'Assinatura Claude AI cobrada mensalmente no Cartão Neon.',
      });
      const saved = await this.repo.save(subClaude);
      await this.ocorrenciasService.generateForAssinatura(saved);

      assinaturas = await this.repo.find({
        relations: { categoria: true },
        where: { snAtivo: 'S' },
        order: { nmAssinatura: 'ASC' },
      });
    }

    return assinaturas;
  }

  findOne(id: number): Promise<AssinaturaEntity | null> {
    return this.repo.findOne({
      where: { cdAssinatura: id, snAtivo: 'S' },
      relations: { categoria: true },
    });
  }

  async create(dto: Partial<AssinaturaEntity>): Promise<AssinaturaEntity> {
    const item = this.repo.create(dto);
    const saved = await this.repo.save(item);
    await this.ocorrenciasService.generateForAssinatura(saved);
    return saved;
  }

  async update(id: number, dto: Partial<AssinaturaEntity>): Promise<AssinaturaEntity | null> {
    await this.repo.update(id, dto);
    const updated = await this.findOne(id);
    if (updated) {
      await this.ocorrenciasService.generateForAssinatura(updated);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
    await this.ocorrenciasService.removePendingForOrigem('ASSINATURA', id);
  }
}
