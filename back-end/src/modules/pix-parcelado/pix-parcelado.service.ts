import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';

@Injectable()
export class PixParceladoService {
  constructor(
    @InjectRepository(PixParceladoEntity)
    private readonly repo: Repository<PixParceladoEntity>,
  ) {}

  findAll(): Promise<PixParceladoEntity[]> {
    return this.repo.find({
      where: { snAtivo: 'S' },
      order: { snQuitada: 'ASC', tsCriacao: 'DESC' },
    });
  }

  findOne(id: number): Promise<PixParceladoEntity | null> {
    return this.repo.findOneBy({ cdPixParcelado: id, snAtivo: 'S' });
  }

  private computeDerived(dto: Partial<PixParceladoEntity>) {
    const nrParcelas = Number(dto.nrParcelasTotais || 1);
    const vlTotalCompra = Number(dto.vlTotalCompra || 0);

    let vlParcela = Number(dto.vlParcela || 0);
    if (!vlParcela || vlParcela <= 0) {
      const taxa = Number(dto.taxaJurosMensal || 0) / 100;
      if (taxa > 0) {
        // Tabela Price
        const fator =
          (taxa * Math.pow(1 + taxa, nrParcelas)) /
          (Math.pow(1 + taxa, nrParcelas) - 1);
        vlParcela = Math.round(vlTotalCompra * fator * 100) / 100;
      } else {
        vlParcela = Math.round((vlTotalCompra / nrParcelas) * 100) / 100;
      }
    }

    const vlTotalComJuros =
      Number(dto.vlTotalComJuros || 0) > 0
        ? Number(dto.vlTotalComJuros)
        : Math.round(vlParcela * nrParcelas * 100) / 100;

    return { vlParcela, vlTotalComJuros };
  }

  create(dto: Partial<PixParceladoEntity>): Promise<PixParceladoEntity> {
    const { vlParcela, vlTotalComJuros } = this.computeDerived(dto);
    const item = this.repo.create({
      ...dto,
      vlParcela,
      vlTotalComJuros,
      nrParcelasPagas: dto.nrParcelasPagas ?? 0,
      snQuitada: 'N',
      snAtivo: 'S',
    });
    return this.repo.save(item);
  }

  async update(
    id: number,
    dto: Partial<PixParceladoEntity>,
  ): Promise<PixParceladoEntity | null> {
    const current = await this.findOne(id);
    if (!current) throw new NotFoundException('Compra parcelada não encontrada');

    const merged = { ...current, ...dto };
    const { vlParcela, vlTotalComJuros } = this.computeDerived(merged);
    merged.vlParcela = vlParcela;
    merged.vlTotalComJuros = vlTotalComJuros;

    if (merged.nrParcelasPagas >= merged.nrParcelasTotais) {
      merged.snQuitada = 'S';
    } else {
      merged.snQuitada = 'N';
    }

    await this.repo.save(merged);
    return this.findOne(id);
  }

  async pagarParcela(
    id: number,
    dsComprovanteUrl?: string,
  ): Promise<PixParceladoEntity> {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException('Compra parcelada não encontrada');

    const novaQtdPaga = Math.min(
      Number(item.nrParcelasTotais),
      Number(item.nrParcelasPagas || 0) + 1,
    );
    item.nrParcelasPagas = novaQtdPaga;
    if (dsComprovanteUrl) item.dsComprovanteUrl = dsComprovanteUrl;
    if (novaQtdPaga >= Number(item.nrParcelasTotais)) {
      item.snQuitada = 'S';
    }

    return this.repo.save(item);
  }

  async estornarParcela(id: number): Promise<PixParceladoEntity> {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException('Compra parcelada não encontrada');

    item.nrParcelasPagas = Math.max(0, Number(item.nrParcelasPagas || 0) - 1);
    if (item.nrParcelasPagas < Number(item.nrParcelasTotais)) {
      item.snQuitada = 'N';
    }
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
  }

  async getResumo() {
    const ativas = await this.repo.find({ where: { snAtivo: 'S' } });
    const emAberto = ativas.filter((p) => p.snQuitada === 'N');

    const vlTotalParcelado = ativas.reduce(
      (acc, p) => acc + Number(p.vlTotalComJuros || 0),
      0,
    );
    const vlRestante = emAberto.reduce(
      (acc, p) =>
        acc +
        Number(p.vlParcela || 0) *
          Math.max(
            0,
            Number(p.nrParcelasTotais || 0) - Number(p.nrParcelasPagas || 0),
          ),
      0,
    );
    const vlParcelaMensal = emAberto.reduce(
      (acc, p) => acc + Number(p.vlParcela || 0),
      0,
    );
    const vlJurosTotal = ativas.reduce(
      (acc, p) =>
        acc +
        (Number(p.vlTotalComJuros || 0) - Number(p.vlTotalCompra || 0)),
      0,
    );

    return {
      resumo: {
        qtdComprasAtivas: ativas.length,
        qtdEmAberto: emAberto.length,
        vlTotalParcelado,
        vlRestante,
        vlParcelaMensal,
        vlJurosTotal,
      },
      compras: ativas.sort((a, b) => {
        if (a.snQuitada !== b.snQuitada) return a.snQuitada === 'N' ? -1 : 1;
        return b.tsCriacao.getTime() - a.tsCriacao.getTime();
      }),
    };
  }
}
