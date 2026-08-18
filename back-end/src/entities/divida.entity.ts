import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_divida', schema: 'financeiro' })
export class DividaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_divida' })
  cdDivida: number;

  @Column({ name: 'nm_divida', length: 100 })
  nmDivida: string;

  @Column({ name: 'ds_credor', length: 100, nullable: true })
  dsCredor: string;

  @Column({ name: 'vl_total_original', type: 'numeric', precision: 12, scale: 2 })
  vlTotalOriginal: number;

  @Column({ name: 'vl_saldo_devedor', type: 'numeric', precision: 12, scale: 2 })
  vlSaldoDevedor: number;

  @Column({ name: 'vl_parcela', type: 'numeric', precision: 12, scale: 2 })
  vlParcela: number;

  @Column({ name: 'taxa_juros_mensal', type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxaJurosMensal: number; // % ao mês

  @Column({ name: 'nr_parcelas_totais', type: 'int', default: 1 })
  nrParcelasTotais: number;

  @Column({ name: 'nr_parcelas_pagas', type: 'int', default: 0 })
  nrParcelasPagas: number;

  @Column({ name: 'dt_vencimento_parcela', type: 'date', nullable: true })
  dtVencimentoParcela: string;

  @Column({ name: 'sn_quitada', length: 1, default: 'N' })
  snQuitada: string; // 'S' ou 'N'

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
