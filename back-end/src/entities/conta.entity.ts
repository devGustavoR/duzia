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

@Entity({ name: 'tb_conta', schema: 'financeiro' })
export class ContaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_conta' })
  cdConta: number;

  @Column({ name: 'nm_conta', length: 100 })
  nmConta: string;

  @Column({ name: 'ds_observacao', type: 'text', nullable: true })
  dsObservacao: string;

  @Column({ name: 'cd_categoria', nullable: true })
  cdCategoria: number;

  @ManyToOne(() => CategoriaEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cd_categoria' })
  categoria: CategoriaEntity;

  @Column({ name: 'vl_valor', type: 'numeric', precision: 12, scale: 2 })
  vlValor: number;

  @Column({ name: 'sn_recorrente', length: 1, default: 'S' })
  snRecorrente: string; // 'S' ou 'N'

  @Column({ name: 'sn_fixo', length: 1, default: 'S' })
  snFixo: string; // 'S' (valor fixo) ou 'N' (valor variável)

  @Column({ name: 'ds_frequencia', length: 20, default: 'MENSAL' })
  dsFrequencia: string; // 'MENSAL', 'ANUAL', 'UNICA'

  // Campos de Conta Dividida
  @Column({ name: 'sn_dividida', length: 1, default: 'N' })
  snDividida: string; // 'S' ou 'N'

  @Column({ name: 'vl_total_servico', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlTotalServico: number | null;

  @Column({ name: 'ds_amigos_divididos', type: 'varchar', length: 200, nullable: true })
  dsAmigosDivididos: string | null;

  @Column({ name: 'vl_cota_amigo', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlCotaAmigo: number | null;

  // Campos de Conta de Terceiros / Reembolsável (ex: Pagamento Claro p/ Avô)
  @Column({ name: 'sn_terceiros', length: 1, default: 'N' })
  snTerceiros: string; // 'S' ou 'N'

  @Column({ name: 'nm_titular_terceiro', type: 'varchar', length: 100, nullable: true })
  nmTitularTerceiro: string | null; // ex: "Vovô", "Mãe", "Pedro"

  @Column({ name: 'sn_reembolsado', length: 1, default: 'S' })
  snReembolsado: string; // 'S' = 100% reembolsado via PIX, 'N' = pendente de reembolso

  @Column({ name: 'vl_cota_propria', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlCotaPropria: number; // valor do bolso do usuario (default 0 para 100% reembolsado)

  @Column({ name: 'nr_dia_vencimento', type: 'int', nullable: true })
  nrDiaVencimento: number;

  @Column({ name: 'dt_vencimento_inicial', type: 'date', nullable: true })
  dtVencimentoInicial: string;

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
