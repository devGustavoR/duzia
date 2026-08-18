import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_cartao_transporte', schema: 'financeiro' })
export class CartaoEntity {
  @PrimaryGeneratedColumn({ name: 'cd_cartao' })
  cdCartao: number;

  @Column({ name: 'numero_cartao', length: 50, default: '036500336819453' })
  numeroCartao: string;

  @Column({ name: 'id_operadora', type: 'int', default: 1 })
  idOperadora: number;

  @Column({ name: 'nm_cartao', length: 100, default: 'SalvadorCARD Estudante' })
  nmCartao: string;

  @Column({ name: 'token_kim', type: 'text', nullable: true })
  tokenKim: string;

  @Column({ name: 'vl_saldo_minimo', type: 'numeric', precision: 12, scale: 2, default: 15.0 })
  vlSaldoMinimo: number;

  @Column({ name: 'vl_saldo_atual', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlSaldoAtual: number;

  @Column({ name: 'ds_ultima_linha', length: 100, nullable: true })
  dsUltimaLinha: string;

  @Column({ name: 'dt_ultima_utilizacao', type: 'timestamptz', nullable: true })
  dtUltimaUtilizacao: Date;

  @Column({ name: 'ds_cor_card', length: 100, default: 'from-[#ea2a33] to-[#4a0404]' })
  dsCorCard: string;

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
