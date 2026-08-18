import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartaoEntity } from '../../entities/cartao.entity';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_STORE_PATH = path.join(process.cwd(), '.kim-tokens.json');

@Injectable()
export class CartaoService {
  private readonly logger = new Logger(CartaoService.name);

  constructor(
    @InjectRepository(CartaoEntity)
    private readonly cartaoRepo: Repository<CartaoEntity>,
  ) {}

  /**
   * Garante que existe pelo menos 1 cartão cadastrado e lê tokens locais
   */
  async listarCartoes(): Promise<CartaoEntity[]> {
    let cartoes = await this.cartaoRepo.find({
      where: { snAtivo: 'S' },
      order: { cdCartao: 'ASC' },
    });

    if (cartoes.length === 0) {
      const padrao = this.cartaoRepo.create({
        numeroCartao: '036500336819453',
        idOperadora: 1,
        nmCartao: 'SalvadorCARD Estudante',
        vlSaldoMinimo: 15.0,
        dsCorCard: 'from-[#ea2a33] to-[#4a0404]',
        snAtivo: 'S',
      });

      if (fs.existsSync(TOKEN_STORE_PATH)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(TOKEN_STORE_PATH, 'utf-8'));
          padrao.tokenKim = fileData.id_token || fileData.idToken || fileData.access_token;
        } catch (e) {}
      }

      await this.cartaoRepo.save(padrao);
      cartoes = [padrao];
    } else {
      // Garante que o primeiro cartão receba o token do .kim-tokens.json se estiver sem token
      const primeiroSemToken = cartoes.find((c) => !c.tokenKim);
      if (primeiroSemToken && fs.existsSync(TOKEN_STORE_PATH)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(TOKEN_STORE_PATH, 'utf-8'));
          const tk = fileData.id_token || fileData.idToken || fileData.access_token;
          if (tk) {
            primeiroSemToken.tokenKim = tk;
            await this.cartaoRepo.save(primeiroSemToken);
          }
        } catch (e) {}
      }
    }

    // Tenta atualizar ao vivo o saldo de todos os cartões ativos que possuem token KIM
    for (const c of cartoes) {
      if (c.tokenKim) {
        try {
          await this.consultarSaldoEExtrato(c.cdCartao);
        } catch (e) {}
      }
    }

    // Recarrega lista atualizada com saldos atualizados
    return await this.cartaoRepo.find({
      where: { snAtivo: 'S' },
      order: { cdCartao: 'ASC' },
    });
  }

  async obterCartaoPorId(cdCartao: number): Promise<CartaoEntity> {
    const cartao = await this.cartaoRepo.findOne({
      where: { cdCartao, snAtivo: 'S' },
    });

    if (!cartao) {
      throw new NotFoundException(`Cartão de ID ${cdCartao} não encontrado.`);
    }

    // Se estiver sem token e existir token no arquivo local, injeta
    if (!cartao.tokenKim && fs.existsSync(TOKEN_STORE_PATH)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(TOKEN_STORE_PATH, 'utf-8'));
        const tk = fileData.id_token || fileData.idToken || fileData.access_token;
        if (tk) {
          cartao.tokenKim = tk;
          await this.cartaoRepo.save(cartao);
        }
      } catch (e) {}
    }

    return cartao;
  }

  async salvarCartao(dto: Partial<CartaoEntity>): Promise<CartaoEntity> {
    let cartao: CartaoEntity;

    if (dto.cdCartao) {
      cartao = await this.obterCartaoPorId(dto.cdCartao);
    } else {
      cartao = this.cartaoRepo.create({
        snAtivo: 'S',
        idOperadora: 1,
        dsCorCard: 'from-[#ea2a33] to-[#4a0404]',
      });
    }

    if (dto.numeroCartao) cartao.numeroCartao = dto.numeroCartao.trim();
    if (dto.idOperadora !== undefined) cartao.idOperadora = Number(dto.idOperadora);
    if (dto.nmCartao) cartao.nmCartao = dto.nmCartao.trim();
    if (dto.tokenKim !== undefined) cartao.tokenKim = dto.tokenKim ? dto.tokenKim.trim() : '';
    if (dto.vlSaldoMinimo !== undefined) cartao.vlSaldoMinimo = Number(dto.vlSaldoMinimo);
    if (dto.dsCorCard) cartao.dsCorCard = dto.dsCorCard;

    const saved = await this.cartaoRepo.save(cartao);

    // Se um token KIM foi fornecido, persiste também no arquivo local
    if (dto.tokenKim) {
      try {
        const updatedFile = { id_token: dto.tokenKim, access_token: dto.tokenKim };
        fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(updatedFile, null, 2));
      } catch (e) {}
    }

    return saved;
  }

  async excluirCartao(cdCartao: number): Promise<void> {
    const cartao = await this.obterCartaoPorId(cdCartao);
    cartao.snAtivo = 'N';
    await this.cartaoRepo.save(cartao);
  }

  async consultarSaldoEExtrato(cdCartao?: number) {
    let cartao: CartaoEntity;
    if (cdCartao) {
      cartao = await this.obterCartaoPorId(cdCartao);
    } else {
      const cartoes = await this.listarCartoes();
      cartao = cartoes[0];
    }

    const token = cartao.tokenKim;

    if (!token) {
      return {
        config: cartao,
        extrato: [],
        resumo: {
          saldoAtual: Number(cartao.vlSaldoAtual || 0),
          ultimaLinha: cartao.dsUltimaLinha || 'N/A',
          dataUltimaUtilizacao: cartao.dtUltimaUtilizacao,
          valorDebitado: 0,
          tipoCartao: cartao.nmCartao,
        },
        erro: 'Nenhum token KIM cadastrado para este cartão. Cole o token nas configurações.',
      };
    }

    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const url = new URL('https://kim.prd.usekim.com.br/cartao/api/v1/cartao/extrato');
    url.searchParams.set('numeroCartao', cartao.numeroCartao);
    url.searchParams.set('idOperadora', String(cartao.idOperadora));
    url.searchParams.set('dataUsoInicial', '2000-01-01');
    url.searchParams.set('dataUsoFinal', amanha);
    url.searchParams.set('codigoCargaInicial', '1');
    url.searchParams.set('codigoCargaFinal', '9999');

    try {
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'https://app.usekim.com.br',
          Referer: 'https://app.usekim.com.br/',
        },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        if (resp.status === 401) {
          return {
            config: cartao,
            extrato: [],
            resumo: {
              saldoAtual: Number(cartao.vlSaldoAtual || 0),
              ultimaLinha: cartao.dsUltimaLinha || 'N/A',
              dataUltimaUtilizacao: cartao.dtUltimaUtilizacao,
              valorDebitado: 0,
              tipoCartao: cartao.nmCartao,
            },
            erro: 'Token KIM expirado (401). Cole um token atualizado nas configurações do cartão.',
          };
        }

        if (resp.status === 400) {
          let msg = 'Cartão não encontrado na API do KIM (HTTP 400).';
          if (errText.includes('não foi encontrado')) {
            msg = 'Este cartão não está vinculado à conta KIM conectada no aplicativo ou o ID da Operadora está incorreto. Adicione o cartão no app.usekim.com.br ou verifique as configurações.';
          }
          return {
            config: cartao,
            extrato: [],
            resumo: {
              saldoAtual: Number(cartao.vlSaldoAtual || 0),
              ultimaLinha: cartao.dsUltimaLinha || 'N/A',
              dataUltimaUtilizacao: cartao.dtUltimaUtilizacao,
              valorDebitado: 0,
              tipoCartao: cartao.nmCartao,
            },
            erro: msg,
          };
        }
        throw new Error(`API KIM [HTTP ${resp.status}]: ${errText}`);
      }

      const extrato = await resp.json();

      if (!Array.isArray(extrato) || extrato.length === 0) {
        cartao.vlSaldoAtual = 0;
        await this.cartaoRepo.save(cartao);

        return {
          config: cartao,
          extrato: [],
          resumo: {
            saldoAtual: 0,
            ultimaLinha: cartao.dsUltimaLinha || 'N/A',
            dataUltimaUtilizacao: cartao.dtUltimaUtilizacao,
            valorDebitado: 0,
            tipoCartao: cartao.nmCartao,
          },
        };
      }

      const ordenado = [...extrato].sort(
        (a, b) => new Date(b.dataUtilizacao).getTime() - new Date(a.dataUtilizacao).getTime(),
      );

      const maisRecente = ordenado[0];

      cartao.vlSaldoAtual = Number(maisRecente.saldoBanco || 0);
      cartao.dsUltimaLinha = maisRecente.linhaOnibusUtilizada || 'Desconhecida';
      cartao.dtUltimaUtilizacao = new Date(maisRecente.dataUtilizacao);
      await this.cartaoRepo.save(cartao);

      return {
        config: cartao,
        extrato: ordenado,
        resumo: {
          saldoAtual: Number(maisRecente.saldoBanco || 0),
          ultimaLinha: maisRecente.linhaOnibusUtilizada || 'Desconhecida',
          dataUltimaUtilizacao: maisRecente.dataUtilizacao,
          valorDebitado: Number(maisRecente.valorDebitado || 0),
          tipoCartao: maisRecente.descTipoUtilizacao || cartao.nmCartao,
        },
      };
    } catch (e) {
      return {
        config: cartao,
        extrato: [],
        resumo: {
          saldoAtual: Number(cartao.vlSaldoAtual || 0),
          ultimaLinha: cartao.dsUltimaLinha || 'N/A',
          dataUltimaUtilizacao: cartao.dtUltimaUtilizacao,
          valorDebitado: 0,
          tipoCartao: cartao.nmCartao,
        },
        erro: e.message,
      };
    }
  }
}
