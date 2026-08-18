import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_perfil_financeiro', schema: 'financeiro' })
export class PerfilFinanceiroEntity {
  @PrimaryGeneratedColumn({ name: 'cd_perfil' })
  cdPerfil: number;

  @Column({ name: 'vl_salario_liquido', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlSalarioLiquido: number;

  @Column({ name: 'vl_renda_variavel', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlRendaVariavel: number;

  @Column({ name: 'vl_outras_rendas', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlOutrasRendas: number;

  @Column({ name: 'ds_perfil_risco', length: 50, default: 'MODERADO' })
  dsPerfilRisco: string;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
