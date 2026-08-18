import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_ocorrencia', schema: 'financeiro' })
export class OcorrenciaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_ocorrencia' })
  cdOcorrencia: number;

  @Column({ name: 'tp_origem', length: 20 })
  tpOrigem: string; // 'CONTA' ou 'ASSINATURA'

  @Column({ name: 'cd_origem', type: 'int' })
  cdOrigem: number; // cdConta ou cdAssinatura

  @Column({ name: 'nm_item', length: 100 })
  nmItem: string;

  @Column({ name: 'vl_esperado', type: 'numeric', precision: 12, scale: 2 })
  vlEsperado: number;

  @Column({ name: 'vl_pago', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlPago: number | null;

  @Column({ name: 'dt_vencimento', type: 'date' })
  dtVencimento: string;

  @Column({ name: 'dt_pagamento', type: 'date', nullable: true })
  dtPagamento: string | null;

  @Column({ name: 'ds_comprovante_url', type: 'text', nullable: true })
  dsComprovanteUrl: string | null;

  @Column({ name: 'sn_pago', length: 1, default: 'N' })
  snPago: string; // 'S' ou 'N'

  @Column({ name: 'nr_dias_aviso', type: 'int', default: 3 })
  nrDiasAviso: number;

  @Column({ name: 'sn_aviso_ativo', length: 1, default: 'S' })
  snAvisoAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
