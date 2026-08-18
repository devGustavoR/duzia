import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartaoCreditoEntity } from '../../entities/cartao-credito.entity';
import { CartaoCreditoCompraEntity } from '../../entities/cartao-credito-compra.entity';

@Injectable()
export class CartaoCreditoService {
  private readonly logger = new Logger(CartaoCreditoService.name);

  constructor(
    @InjectRepository(CartaoCreditoEntity)
    private readonly cartaoCreditoRepo: Repository<CartaoCreditoEntity>,
    @InjectRepository(CartaoCreditoCompraEntity)
    private readonly compraRepo: Repository<CartaoCreditoCompraEntity>,
  ) {}

  async listarCartoesCredito(): Promise<CartaoCreditoEntity[]> {
    let cartoes = await this.cartaoCreditoRepo.find({
      where: { snAtivo: 'S' },
      relations: { compras: true },
      order: { cdCartaoCredito: 'ASC' },
    });

    const temNeon = cartoes.some((c) => c.nmBanco === 'Neon');
    const temNubank = cartoes.some((c) => c.nmBanco === 'Nubank');
    const temDuplicadosOuFakes =
      !temNeon ||
      !temNubank ||
      cartoes.length !== 2 ||
      cartoes.some((c) => c.nmBanco === 'Itaú' || c.nmCartao.includes('Roxinho'));

    if (temDuplicadosOuFakes) {
      await this.compraRepo.createQueryBuilder().delete().execute();
      await this.cartaoCreditoRepo.createQueryBuilder().delete().execute();

      // 1. Cartão Nubank Real
      const nubank = this.cartaoCreditoRepo.create({
        nmCartao: 'Nubank',
        nmBanco: 'Nubank',
        nmBandeira: 'Mastercard',
        nrUltimosDigitos: '6814',
        vlLimiteTotal: 68.14,
        vlLimiteUsado: 45.73,
        nrDiaFechamento: 12,
        nrDiaVencimento: 19,
        dsCorCard: 'from-purple-950 via-purple-800 to-indigo-950',
        snAtivo: 'S',
      });

      // 2. Cartão Neon Real (PDF Boleto Fatura)
      const neon = this.cartaoCreditoRepo.create({
        nmCartao: 'Neon',
        nmBanco: 'Neon',
        nmBandeira: 'Visa',
        nrUltimosDigitos: '3248',
        vlLimiteTotal: 1180.00,
        vlLimiteUsado: 1044.46,
        nrDiaFechamento: 31,
        nrDiaVencimento: 5,
        dsCorCard: 'from-cyan-700 via-teal-800 to-slate-950',
        snAtivo: 'S',
      });

      await this.cartaoCreditoRepo.save([nubank, neon]);

      // Compra do Servidor Contabo no Nubank
      const compraContabo = this.compraRepo.create({
        cdCartaoCredito: nubank.cdCartaoCredito,
        dsCompra: 'Contabo Cloud VPS 4 (vmi3504804)',
        vlTotal: 45.73,
        nrParcelas: 1,
        nrParcelaAtual: 1,
        vlParcela: 45.73,
        dtCompra: new Date().toISOString().split('T')[0],
        nmCategoria: 'Servidores & Cloud',
      });

      // Compra Anthropic Claude Sub no Neon (PDF)
      const compraClaude = this.compraRepo.create({
        cdCartaoCredito: neon.cdCartaoCredito,
        dsCompra: 'Anthropic* Claude Sub',
        vlTotal: 118.00,
        nrParcelas: 1,
        nrParcelaAtual: 1,
        vlParcela: 118.00,
        dtCompra: '2026-07-28',
        nmCategoria: 'Assinaturas & SaaS',
      });

      await this.compraRepo.save([compraContabo, compraClaude]);

      cartoes = await this.cartaoCreditoRepo.find({
        where: { snAtivo: 'S' },
        relations: { compras: true },
        order: { cdCartaoCredito: 'ASC' },
      });
    }

    return cartoes;
  }

  async obterCartaoCreditoPorId(cdCartaoCredito: number): Promise<CartaoCreditoEntity> {
    const cartao = await this.cartaoCreditoRepo.findOne({
      where: { cdCartaoCredito, snAtivo: 'S' },
      relations: { compras: true },
    });

    if (!cartao) {
      throw new NotFoundException(`Cartão de Crédito ID ${cdCartaoCredito} não encontrado.`);
    }

    return cartao;
  }

  async salvarCartaoCredito(dto: Partial<CartaoCreditoEntity>): Promise<CartaoCreditoEntity> {
    let cartao: CartaoCreditoEntity;

    if (dto.cdCartaoCredito) {
      cartao = await this.obterCartaoCreditoPorId(dto.cdCartaoCredito);
    } else {
      cartao = this.cartaoCreditoRepo.create({
        snAtivo: 'S',
        nmBanco: 'Outro',
        nmBandeira: 'Mastercard',
        dsCorCard: 'from-slate-900 to-black',
      });
    }

    if (dto.nmCartao) cartao.nmCartao = dto.nmCartao.trim();
    if (dto.nmBanco) cartao.nmBanco = dto.nmBanco.trim();
    if (dto.nmBandeira) cartao.nmBandeira = dto.nmBandeira.trim();
    if (dto.nrUltimosDigitos) cartao.nrUltimosDigitos = dto.nrUltimosDigitos.trim();
    if (dto.vlLimiteTotal !== undefined) cartao.vlLimiteTotal = Number(dto.vlLimiteTotal);
    if (dto.vlLimiteUsado !== undefined) cartao.vlLimiteUsado = Number(dto.vlLimiteUsado);
    if (dto.nrDiaFechamento !== undefined) cartao.nrDiaFechamento = Number(dto.nrDiaFechamento);
    if (dto.nrDiaVencimento !== undefined) cartao.nrDiaVencimento = Number(dto.nrDiaVencimento);
    if (dto.dsCorCard) cartao.dsCorCard = dto.dsCorCard;

    return this.cartaoCreditoRepo.save(cartao);
  }

  async excluirCartaoCredito(cdCartaoCredito: number): Promise<void> {
    const cartao = await this.obterCartaoCreditoPorId(cdCartaoCredito);
    cartao.snAtivo = 'N';
    await this.cartaoCreditoRepo.save(cartao);
  }

  async adicionarCompra(
    cdCartaoCredito: number,
    dto: Partial<CartaoCreditoCompraEntity>,
  ): Promise<CartaoCreditoCompraEntity> {
    const cartao = await this.obterCartaoCreditoPorId(cdCartaoCredito);

    const vlTotal = Number(dto.vlTotal || 0);
    const nrParcelas = Number(dto.nrParcelas || 1);
    const vlParcela = Number((vlTotal / nrParcelas).toFixed(2));

    const compra = this.compraRepo.create({
      cdCartaoCredito,
      dsCompra: dto.dsCompra?.trim() || 'Nova Compra',
      vlTotal,
      nrParcelas,
      nrParcelaAtual: dto.nrParcelaAtual || 1,
      vlParcela,
      dtCompra: dto.dtCompra || new Date().toISOString().split('T')[0],
      nmCategoria: dto.nmCategoria?.trim() || 'Geral',
    });

    const savedCompra = await this.compraRepo.save(compra);

    // Recalcula limite usado do cartão
    const comprasAtivas = await this.compraRepo.find({ where: { cdCartaoCredito } });
    const novoUsado = comprasAtivas.reduce((acc, c) => acc + Number(c.vlTotal), 0);
    cartao.vlLimiteUsado = Number(novoUsado.toFixed(2));
    await this.cartaoCreditoRepo.save(cartao);

    return savedCompra;
  }

  async removerCompra(cdCompra: number): Promise<void> {
    const compra = await this.compraRepo.findOne({ where: { cdCompra } });
    if (!compra) return;

    const cdCartaoCredito = compra.cdCartaoCredito;
    await this.compraRepo.remove(compra);

    // Recalcula limite usado
    const cartao = await this.obterCartaoCreditoPorId(cdCartaoCredito);
    const comprasRestantes = await this.compraRepo.find({ where: { cdCartaoCredito } });
    const novoUsado = comprasRestantes.reduce((acc, c) => acc + Number(c.vlTotal), 0);
    cartao.vlLimiteUsado = Number(novoUsado.toFixed(2));
    await this.cartaoCreditoRepo.save(cartao);
  }
}
