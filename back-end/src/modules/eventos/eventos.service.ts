import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventoEntity } from '../../entities/evento.entity';
import { EventoItemEntity } from '../../entities/evento-item.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';
import { DividaEntity } from '../../entities/divida.entity';

const MS_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(EventoEntity)
    private readonly repo: Repository<EventoEntity>,
    @InjectRepository(EventoItemEntity)
    private readonly itemRepo: Repository<EventoItemEntity>,
    @InjectRepository(OcorrenciaEntity)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEntity>,
    @InjectRepository(PerfilFinanceiroEntity)
    private readonly perfilRepo: Repository<PerfilFinanceiroEntity>,
    @InjectRepository(PixParceladoEntity)
    private readonly pixRepo: Repository<PixParceladoEntity>,
    @InjectRepository(DividaEntity)
    private readonly dividaRepo: Repository<DividaEntity>,
  ) {}

  private toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }

  private dateOnly(v: string | Date | null | undefined): string | null {
    if (!v) return null;
    return typeof v === 'string' ? v.split('T')[0] : this.toISO(v);
  }

  findAll(): Promise<EventoEntity[]> {
    return this.repo.find({
      where: { snAtivo: 'S' },
      order: { dtEvento: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EventoEntity | null> {
    return this.repo.findOne({
      where: { cdEvento: id, snAtivo: 'S' },
      relations: { itens: true },
      order: { itens: { dtPrevista: 'ASC', cdItem: 'ASC' } },
    });
  }

  create(dto: Partial<EventoEntity>): Promise<EventoEntity> {
    const evento = this.repo.create({ ...dto, snAtivo: 'S' });
    return this.repo.save(evento);
  }

  async update(id: number, dto: Partial<EventoEntity>): Promise<EventoEntity | null> {
    const { cdEvento, itens, tsCriacao, tsAtualizacao, ...clean } = dto as any;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { snAtivo: 'N' });
  }

  // --- Itens ---

  async addItem(
    cdEvento: number,
    dto: Partial<EventoItemEntity>,
  ): Promise<EventoItemEntity> {
    const evento = await this.repo.findOneBy({ cdEvento, snAtivo: 'S' });
    if (!evento) throw new NotFoundException('Evento não encontrado');
    const item = this.itemRepo.create({
      ...dto,
      cdEvento,
      snStatus: dto.snStatus || 'PLANEJADO',
    });
    return this.itemRepo.save(item);
  }

  async updateItem(
    cdItem: number,
    dto: Partial<EventoItemEntity>,
  ): Promise<EventoItemEntity | null> {
    const { cdItem: _i, cdEvento, evento, tsCriacao, tsAtualizacao, ...clean } =
      dto as any;
    await this.itemRepo.update(cdItem, clean);
    return this.itemRepo.findOneBy({ cdItem });
  }

  async removeItem(cdItem: number): Promise<void> {
    await this.itemRepo.delete(cdItem);
  }

  // --- Projeção ---

  async getProjecao(id: number) {
    const evento = await this.findOne(id);
    if (!evento) throw new NotFoundException('Evento não encontrado');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = this.toISO(hoje);

    const dtEvento = new Date(`${this.dateOnly(evento.dtEvento)}T00:00:00`);
    const diasRestantes = Math.max(
      0,
      Math.ceil((dtEvento.getTime() - hoje.getTime()) / MS_DAY),
    );

    // Renda mensal estimada
    const perfil = await this.perfilRepo.find({ order: { cdPerfil: 'DESC' } });
    const p = perfil[0];
    const rendaMensalEstimada =
      Number(p?.vlSalarioLiquido || 0) +
      Number(p?.vlRendaVariavel || 0) +
      Number(p?.vlOutrasRendas || 0);

    // Gastos fixos do mês de referência (mês atual)
    const m = hoje.getMonth() + 1;
    const y = hoje.getFullYear();
    const startMes = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endMes = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const ocorrenciasMesRaw = await this.ocorrenciaRepo.find({
      where: { dtVencimento: Between(startMes, endMes) },
      order: { dtVencimento: 'ASC' },
    });
    const dedup = new Map<string, OcorrenciaEntity>();
    ocorrenciasMesRaw.forEach((o) => {
      const key = `${o.tpOrigem}_${o.cdOrigem}_${this.dateOnly(o.dtVencimento)}`;
      if (!dedup.has(key)) dedup.set(key, o);
    });
    const ocorrenciasMes = Array.from(dedup.values());
    const gastosFixosMes = ocorrenciasMes.reduce(
      (acc, o) => acc + Number(o.vlEsperado || 0),
      0,
    );

    // Parcelas do mês (Pix Parcelado em aberto + Dívidas ativas)
    const pixAbertos = await this.pixRepo.find({
      where: { snAtivo: 'S', snQuitada: 'N' },
    });
    const dividasAtivas = await this.dividaRepo.find({
      where: { snAtivo: 'S', snQuitada: 'N' },
    });
    const parcelasPix = pixAbertos.reduce(
      (acc, x) => acc + Number(x.vlParcela || 0),
      0,
    );
    const parcelasDividas = dividasAtivas.reduce(
      (acc, x) => acc + Number(x.vlParcela || 0),
      0,
    );
    const parcelasMes = parcelasPix + parcelasDividas;

    // Custo do evento
    const itens = evento.itens || [];
    const valorItem = (i: EventoItemEntity) =>
      Number(i.vlReal != null ? i.vlReal : i.vlEstimado || 0);
    const custoEventoTotal = itens.reduce((acc, i) => acc + valorItem(i), 0);
    const custoEventoPago = itens
      .filter((i) => i.snStatus === 'PAGO')
      .reduce((acc, i) => acc + valorItem(i), 0);
    const custoEventoRestante = custoEventoTotal - custoEventoPago;
    const reembolsavelPendente = itens
      .filter((i) => i.snReembolsavel === 'S' && i.snStatus !== 'PAGO')
      .reduce((acc, i) => acc + valorItem(i), 0);

    // Sobra da renda do mês e folga após o evento
    const sobraDoMes = rendaMensalEstimada - gastosFixosMes - parcelasMes;
    const folgaAposEvento = sobraDoMes - custoEventoRestante;

    // Gastos entre hoje e o dia do evento
    const dtEventoStr = this.dateOnly(evento.dtEvento)!;
    const ocorrenciasAteEvento = ocorrenciasMesRaw
      .filter(
        (o) =>
          o.snPago === 'N' &&
          this.dateOnly(o.dtVencimento)! >= hojeStr &&
          this.dateOnly(o.dtVencimento)! <= dtEventoStr,
      )
      .reduce((acc, o) => acc + Number(o.vlEsperado || 0), 0);
    const itensAteEvento = itens
      .filter((i) => {
        if (i.snStatus === 'PAGO') return false;
        const dp = this.dateOnly(i.dtPrevista);
        return !dp || dp <= dtEventoStr;
      })
      .reduce((acc, i) => acc + valorItem(i), 0);
    const gastosAntesDoEvento = ocorrenciasAteEvento + itensAteEvento;

    // Timeline dia a dia (limitado a 92 dias)
    const timeline: Array<{
      data: string;
      gastoEvento: number;
      gastoContas: number;
      total: number;
      acumulado: number;
    }> = [];
    const limiteDias = Math.min(diasRestantes, 92);
    let acumulado = 0;
    for (let k = 0; k <= limiteDias; k++) {
      const d = new Date(hoje.getTime() + k * MS_DAY);
      const ds = this.toISO(d);
      const gastoEvento = itens
        .filter((i) => this.dateOnly(i.dtPrevista) === ds && i.snStatus !== 'PAGO')
        .reduce((acc, i) => acc + valorItem(i), 0);
      const gastoContas = ocorrenciasMesRaw
        .filter(
          (o) => o.snPago === 'N' && this.dateOnly(o.dtVencimento) === ds,
        )
        .reduce((acc, o) => acc + Number(o.vlEsperado || 0), 0);
      const total = gastoEvento + gastoContas;
      if (total === 0 && k !== 0 && k !== limiteDias) continue;
      acumulado += total;
      timeline.push({ data: ds, gastoEvento, gastoContas, total, acumulado });
    }

    return {
      evento,
      diasRestantes,
      referenciaMes: { mes: m, ano: y },
      rendaMensalEstimada,
      gastosFixosMes,
      parcelasMes,
      parcelasPix,
      parcelasDividas,
      sobraDoMes,
      custoEventoTotal,
      custoEventoPago,
      custoEventoRestante,
      reembolsavelPendente,
      folgaAposEvento,
      gastosAntesDoEvento,
      timeline,
      premissas:
        'Sem saldo bancário: a folga é estimada como (renda mensal − contas do mês − parcelas) − custo restante do evento.',
    };
  }
}
