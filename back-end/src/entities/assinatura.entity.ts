import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoriaEntity } from './categoria.entity';

@Entity({ name: 'tb_assinatura', schema: 'financeiro' })
export class AssinaturaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_assinatura' })
  cdAssinatura: number;

  @Column({ name: 'nm_assinatura', length: 100 })
  nmAssinatura: string;

  @Column({ name: 'ds_observacao', type: 'text', nullable: true })
  dsObservacao: string;

  @Column({ name: 'cd_categoria', nullable: true })
  cdCategoria: number;

  @ManyToOne(() => CategoriaEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cd_categoria' })
  categoria: CategoriaEntity;

  @Column({ name: 'vl_mensalidade', type: 'numeric', precision: 12, scale: 2 })
  vlMensalidade: number;

  @Column({ name: 'ds_ciclo', length: 20, default: 'MENSAL' })
  dsCiclo: string;

  // Campos de Assinatura Dividida com Amigos/Familiares
  @Column({ name: 'sn_dividida', length: 1, default: 'N' })
  snDividida: string;

  @Column({ name: 'vl_total_servico', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlTotalServico: number | null;

  @Column({ name: 'ds_amigos_divididos', type: 'varchar', length: 200, nullable: true })
  dsAmigosDivididos: string | null;

  @Column({ name: 'vl_cota_amigo', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlCotaAmigo: number | null;

  // Campos de Conta de Terceiros / Reembolsável (ex: Assinatura paga p/ Avô/Mãe)
  @Column({ name: 'sn_terceiros', length: 1, default: 'N' })
  snTerceiros: string;

  @Column({ name: 'nm_titular_terceiro', type: 'varchar', length: 100, nullable: true })
  nmTitularTerceiro: string | null;

  @Column({ name: 'sn_reembolsado', length: 1, default: 'S' })
  snReembolsado: string;

  @Column({ name: 'vl_cota_propria', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlCotaPropria: number;

  @Column({ name: 'nr_dia_vencimento', type: 'int' })
  nrDiaVencimento: number;

  @Column({ name: 'dt_proxima_cobranca', type: 'date' })
  dtProximaCobranca: string;

  @Column({ name: 'nr_dias_aviso', type: 'int', default: 3 })
  nrDiasAviso: number;

  @Column({ name: 'sn_aviso_ativo', length: 1, default: 'S' })
  snAvisoAtivo: string;

  @Column({ name: 'cd_cartao_credito', type: 'int', nullable: true })
  cdCartaoCredito: number | null;

  @Column({ name: 'nm_cartao_vinculado', type: 'varchar', length: 100, nullable: true })
  nmCartaoVinculado: string | null;

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
