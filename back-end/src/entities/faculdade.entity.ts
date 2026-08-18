import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_faculdade', schema: 'financeiro' })
export class FaculdadeEntity {
  @PrimaryGeneratedColumn({ name: 'cd_faculdade' })
  cdFaculdade: number;

  @Column({ name: 'nm_curso', length: 100 })
  nmCurso: string;

  @Column({ name: 'nm_instituicao', length: 100 })
  nmInstituicao: string;

  @Column({ name: 'ds_semestre', length: 50, default: '1º Semestre' })
  dsSemestre: string;

  @Column({ name: 'vl_mensalidade', type: 'numeric', precision: 12, scale: 2 })
  vlMensalidade: number;

  @Column({ name: 'nr_dia_vencimento', type: 'int', default: 5 })
  nrDiaVencimento: number;

  // Campos de Matrícula
  @Column({ name: 'vl_matricula', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlMatricula: number | null;

  @Column({ name: 'dt_pagamento_matricula', type: 'date', nullable: true })
  dtPagamentoMatricula: string | null;

  @Column({ name: 'ds_comprovante_matricula', type: 'text', nullable: true })
  dsComprovanteMatricula: string | null;

  @Column({ name: 'nr_dias_aviso', type: 'int', default: 3 })
  nrDiasAviso: number;

  @Column({ name: 'sn_aviso_ativo', length: 1, default: 'S' })
  snAvisoAtivo: string;

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
