import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_meta_compra', schema: 'financeiro' })
export class MetaCompraEntity {
  @PrimaryGeneratedColumn({ name: 'cd_meta' })
  cdMeta: number;

  @Column({ name: 'nm_meta', length: 100 })
  nmMeta: string;

  @Column({ name: 'ds_observacao', type: 'text', nullable: true })
  dsObservacao: string;

  @Column({ name: 'vl_alvo', type: 'numeric', precision: 12, scale: 2 })
  vlAlvo: number;

  @Column({ name: 'vl_poupado', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlPoupado: number;

  @Column({ name: 'dt_prazo', type: 'date', nullable: true })
  dtPrazo: string;

  @Column({ name: 'sn_concluida', length: 1, default: 'N' })
  snConcluida: string; // 'S' ou 'N'

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
