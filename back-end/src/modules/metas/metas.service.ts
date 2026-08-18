import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';

@Injectable()
export class MetasService {
  constructor(
    @InjectRepository(MetaCompraEntity)
    private readonly repo: Repository<MetaCompraEntity>,
  ) {}

  findAll(): Promise<MetaCompraEntity[]> {
    return this.repo.find({
      where: { snAtivo: 'S' },
      order: { snConcluida: 'ASC', dtPrazo: 'ASC' },
    });
  }

  findOne(id: number): Promise<MetaCompraEntity | null> {
    return this.repo.findOneBy({ cdMeta: id, snAtivo: 'S' });
  }

  create(dto: Partial<MetaCompraEntity>): Promise<MetaCompraEntity> {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<MetaCompraEntity>): Promise<MetaCompraEntity | null> {
    await this.repo.update(id, dto);
    const updated = await this.findOne(id);
    if (updated && Number(updated.vlPoupado) >= Number(updated.vlAlvo)) {
      updated.snConcluida = 'S';
      await this.repo.save(updated);
    }
    return updated;
  }

  async aportar(id: number, valor: number): Promise<MetaCompraEntity> {
    const meta = await this.findOne(id);
    if (!meta) throw new NotFoundException('Meta não encontrada');

    meta.vlPoupado = Number(meta.vlPoupado || 0) + Number(valor);
    if (Number(meta.vlPoupado) >= Number(meta.vlAlvo)) {
      meta.snConcluida = 'S';
    }
    return this.repo.save(meta);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
  }
}
