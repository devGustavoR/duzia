import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_pix_parcelado', schema: 'financeiro' })
export class PixParceladoEntity {
  @PrimaryGeneratedColumn({ name: 'cd_pix_parcelado' })
  cdPixParcelado: number;

  @Column({ name: 'nm_descricao', length: 100 })
  nmDescricao: string; // O que foi comprado

  @Column({ name: 'ds_estabelecimento', length: 100, nullable: true })
  dsEstabelecimento: string; // Loja / recebedor do PIX

  @Column({ name: 'nm_banco', length: 60, nullable: true })
  nmBanco: string; // Banco que ofereceu o PIX Parcelado

  @Column({ name: 'vl_total_compra', type: 'numeric', precision: 12, scale: 2 })
  vlTotalCompra: number; // Valor da compra sem juros

  @Column({ name: 'vl_parcela', type: 'numeric', precision: 12, scale: 2 })
  vlParcela: number;

  @Column({ name: 'taxa_juros_mensal', type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxaJurosMensal: number; // % ao mês

  @Column({ name: 'vl_total_com_juros', type: 'numeric', precision: 12, scale: 2 })
  vlTotalComJuros: number; // vlParcela * nrParcelasTotais

  @Column({ name: 'nr_parcelas_totais', type: 'int', default: 1 })
  nrParcelasTotais: number;

  @Column({ name: 'nr_parcelas_pagas', type: 'int', default: 0 })
  nrParcelasPagas: number;

  @Column({ name: 'nr_dia_vencimento', type: 'int', default: 10 })
  nrDiaVencimento: number;

  @Column({ name: 'dt_primeira_parcela', type: 'date', nullable: true })
  dtPrimeiraParcela: string;

  @Column({ name: 'ds_comprovante_url', type: 'text', nullable: true })
  dsComprovanteUrl: string | null; // Comprovante do PIX / contrato

  @Column({ name: 'sn_quitada', length: 1, default: 'N' })
  snQuitada: string; // 'S' ou 'N'

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
