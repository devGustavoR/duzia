import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_academia', schema: 'financeiro' })
export class AcademiaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_academia' })
  cdAcademia: number;

  // Mensalidade da Academia do Usuário
  @Column({ name: 'nm_academia', length: 100, default: 'Smart Fit' })
  nmAcademia: string;

  @Column({ name: 'vl_mensalidade_academia', type: 'numeric', precision: 12, scale: 2, default: 120 })
  vlMensalidadeAcademia: number;

  @Column({ name: 'nr_dia_vencimento_academia', type: 'int', default: 10 })
  nrDiaVencimentoAcademia: number;

  // Mensalidade da Academia da Namorada (Terceiros / Reembolsado via PIX)
  @Column({ name: 'sn_academia_namorada', type: 'varchar', length: 1, default: 'S' })
  snAcademiaNamorada: string; // 'S' se paga a academia da namorada

  @Column({ name: 'nm_titular_terceiro', type: 'varchar', length: 100, default: 'Namorada' })
  nmTitularTerceiro: string;

  @Column({ name: 'vl_academia_namorada', type: 'numeric', precision: 12, scale: 2, default: 120 })
  vlAcademiaNamorada: number;

  @Column({ name: 'sn_academia_namorada_reembolsado', type: 'varchar', length: 1, default: 'S' })
  snAcademiaNamoradaReembolsado: string; // 'S' = 100% Reembolsado por ela via PIX

  // Personal Trainer (2x - Pago 100% pelo Usuário)
  @Column({ name: 'nm_personal', length: 100, default: 'Personal Trainer' })
  nmPersonal: string;

  @Column({ name: 'vl_personal_unitario', type: 'numeric', precision: 12, scale: 2, default: 400 })
  vlPersonalUnitario: number;

  @Column({ name: 'nr_qtd_pessoas', type: 'int', default: 2 })
  nrQtdPessoas: number; // 2x (Ele + Namorada)

  @Column({ name: 'nr_dia_vencimento_personal', type: 'int', default: 10 })
  nrDiaVencimentoPersonal: number;

  // Suplementos / Nutrição
  @Column({ name: 'vl_suplementos', type: 'numeric', precision: 12, scale: 2, default: 200 })
  vlSuplementos: number;

  @Column({ name: 'nr_dias_aviso', type: 'int', default: 3 })
  nrDiasAviso: number;

  @Column({ name: 'sn_aviso_ativo', type: 'varchar', length: 1, default: 'S' })
  snAvisoAtivo: string;

  @Column({ name: 'sn_ativo', type: 'varchar', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
