import { CategoriaEntity } from './categoria.entity';
import { ContaEntity } from './conta.entity';
import { AssinaturaEntity } from './assinatura.entity';
import { MetaCompraEntity } from './meta-compra.entity';
import { OcorrenciaEntity } from './ocorrencia.entity';
import { AvisoEnviadoEntity } from './aviso-enviado.entity';
import { DividaEntity } from './divida.entity';
import { PerfilFinanceiroEntity } from './perfil-financeiro.entity';
import { FaculdadeEntity } from './faculdade.entity';
import { AcademiaEntity } from './academia.entity';
import { CartaoEntity } from './cartao.entity';
import { CartaoCreditoEntity } from './cartao-credito.entity';
import { CartaoCreditoCompraEntity } from './cartao-credito-compra.entity';
import { PixParceladoEntity } from './pix-parcelado.entity';
import { EventoEntity } from './evento.entity';
import { EventoItemEntity } from './evento-item.entity';

/**
 * Single source of truth for the entity list.
 * Used by both the Nest TypeORM config and the standalone migration DataSource.
 */
export const entities = [
  CategoriaEntity,
  ContaEntity,
  AssinaturaEntity,
  MetaCompraEntity,
  OcorrenciaEntity,
  AvisoEnviadoEntity,
  DividaEntity,
  PerfilFinanceiroEntity,
  FaculdadeEntity,
  AcademiaEntity,
  CartaoEntity,
  CartaoCreditoEntity,
  CartaoCreditoCompraEntity,
  PixParceladoEntity,
  EventoEntity,
  EventoItemEntity,
];
