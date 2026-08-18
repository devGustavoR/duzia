import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DividaEntity } from '../../entities/divida.entity';

@Injectable()
export class DividasService {
  constructor(
    @InjectRepository(DividaEntity)
    private readonly repo: Repository<DividaEntity>,
  ) {}

  findAll(): Promise<DividaEntity[]> {
    return this.repo.find({
      where: { snAtivo: 'S' },
      order: { snQuitada: 'ASC', taxaJurosMensal: 'DESC' },
    });
  }

  findOne(id: number): Promise<DividaEntity | null> {
    return this.repo.findOneBy({ cdDivida: id, snAtivo: 'S' });
  }

  create(dto: Partial<DividaEntity>): Promise<DividaEntity> {
    const item = this.repo.create({
      ...dto,
      vlSaldoDevedor: dto.vlSaldoDevedor ?? dto.vlTotalOriginal ?? 0,
      snQuitada: 'N',
      snAtivo: 'S',
    });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<DividaEntity>): Promise<DividaEntity | null> {
    await this.repo.update(id, dto);
    const updated = await this.findOne(id);
    if (updated && Number(updated.vlSaldoDevedor) <= 0) {
      updated.snQuitada = 'S';
      await this.repo.save(updated);
    }
    return updated;
  }

  async pagarParcela(id: number): Promise<DividaEntity> {
    const divida = await this.findOne(id);
    if (!divida) throw new NotFoundException('Dívida não encontrada');

    const novaQtdPaga = Number(divida.nrParcelasPagas || 0) + 1;
    const novoSaldo = Math.max(0, Number(divida.vlSaldoDevedor || 0) - Number(divida.vlParcela || 0));

    divida.nrParcelasPagas = novaQtdPaga;
    divida.vlSaldoDevedor = novoSaldo;
    if (novoSaldo <= 0 || novaQtdPaga >= divida.nrParcelasTotais) {
      divida.snQuitada = 'S';
    }

    return this.repo.save(divida);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
  }

  async getAnaliseQuitacao() {
    const ativas = await this.repo.find({
      where: { snAtivo: 'S', snQuitada: 'N' },
    });

    // Strategy 1: Avalanche (highest interest rate % a.m. first)
    const avalanche = [...ativas].sort(
      (a, b) => Number(b.taxaJurosMensal || 0) - Number(a.taxaJurosMensal || 0),
    );

    // Strategy 2: Snowball (lowest remaining balance first)
    const bolaDeNeve = [...ativas].sort(
      (a, b) => Number(a.vlSaldoDevedor || 0) - Number(b.vlSaldoDevedor || 0),
    );

    const totalSaldoDevedor = ativas.reduce(
      (acc, d) => acc + Number(d.vlSaldoDevedor || 0),
      0,
    );
    const totalParcelaMensal = ativas.reduce(
      (acc, d) => acc + Number(d.vlParcela || 0),
      0,
    );

    return {
      resumo: {
        totalDividasAtivas: ativas.length,
        totalSaldoDevedor,
        totalParcelaMensal,
      },
      estrategiaAvalanche: avalanche,
      estrategiaBolaDeNeve: bolaDeNeve,
      todasDividas: ativas,
    };
  }
}
