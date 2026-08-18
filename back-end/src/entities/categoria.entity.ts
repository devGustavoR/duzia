import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'tb_categoria', schema: 'financeiro' })
export class CategoriaEntity {
  @PrimaryGeneratedColumn({ name: 'cd_categoria' })
  cdCategoria: number;

  @Column({ name: 'nm_categoria', length: 50 })
  nmCategoria: string;

  @Column({ name: 'ds_icone', length: 50, nullable: true })
  dsIcone: string;

  @Column({ name: 'ds_cor', length: 20, nullable: true, default: '#6366f1' })
  dsCor: string;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;
}
