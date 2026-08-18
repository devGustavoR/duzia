import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CartaoCreditoCompraEntity } from './cartao-credito-compra.entity';

@Entity({ name: 'tb_cartao_credito', schema: 'financeiro' })
export class CartaoCreditoEntity {
  @PrimaryGeneratedColumn({ name: 'cd_cartao_credito' })
  cdCartaoCredito: number;

  @Column({ name: 'nm_cartao', length: 100 })
  nmCartao: string;

  @Column({ name: 'nm_banco', length: 50, default: 'Outro' })
  nmBanco: string;

  @Column({ name: 'nm_bandeira', length: 50, default: 'Mastercard' })
  nmBandeira: string;

  @Column({ name: 'nr_ultimos_digitos', length: 4, nullable: true })
  nrUltimosDigitos: string;

  @Column({ name: 'vl_limite_total', type: 'numeric', precision: 12, scale: 2, default: 5000 })
  vlLimiteTotal: number;

  @Column({ name: 'vl_limite_usado', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlLimiteUsado: number;

  @Column({ name: 'nr_dia_fechamento', type: 'int', default: 5 })
  nrDiaFechamento: number;

  @Column({ name: 'nr_dia_vencimento', type: 'int', default: 12 })
  nrDiaVencimento: number;

  @Column({ name: 'ds_cor_card', length: 100, default: 'from-purple-900 via-purple-700 to-indigo-950' })
  dsCorCard: string;

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @OneToMany(() => CartaoCreditoCompraEntity, (compra) => compra.cartaoCredito, {
    cascade: true,
  })
  compras: CartaoCreditoCompraEntity[];

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
