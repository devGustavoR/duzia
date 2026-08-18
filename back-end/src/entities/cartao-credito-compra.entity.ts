import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CartaoCreditoEntity } from './cartao-credito.entity';

@Entity({ name: 'tb_cartao_credito_compra', schema: 'financeiro' })
export class CartaoCreditoCompraEntity {
  @PrimaryGeneratedColumn({ name: 'cd_compra' })
  cdCompra: number;

  @Column({ name: 'cd_cartao_credito' })
  cdCartaoCredito: number;

  @ManyToOne(() => CartaoCreditoEntity, (cartao) => cartao.compras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cd_cartao_credito' })
  cartaoCredito: CartaoCreditoEntity;

  @Column({ name: 'ds_compra', length: 150 })
  dsCompra: string;

  @Column({ name: 'vl_total', type: 'numeric', precision: 12, scale: 2 })
  vlTotal: number;

  @Column({ name: 'nr_parcelas', type: 'int', default: 1 })
  nrParcelas: number;

  @Column({ name: 'nr_parcela_atual', type: 'int', default: 1 })
  nrParcelaAtual: number;

  @Column({ name: 'vl_parcela', type: 'numeric', precision: 12, scale: 2 })
  vlParcela: number;

  @Column({ name: 'dt_compra', type: 'date' })
  dtCompra: string;

  @Column({ name: 'nm_categoria', length: 50, default: 'Geral' })
  nmCategoria: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
