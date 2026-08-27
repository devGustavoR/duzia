import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventoEntity } from './evento.entity';

@Entity({ name: 'tb_evento_item', schema: 'financeiro' })
export class EventoItemEntity {
  @PrimaryGeneratedColumn({ name: 'cd_item' })
  cdItem: number;

  @Column({ name: 'cd_evento', type: 'int' })
  cdEvento: number;

  @ManyToOne(() => EventoEntity, (evento) => evento.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cd_evento' })
  evento: EventoEntity;

  @Column({ name: 'ds_item', length: 100 })
  dsItem: string; // Ex: Flores, Unhas dela, Roupa

  @Column({ name: 'nm_categoria', type: 'varchar', length: 50, nullable: true })
  nmCategoria: string | null;

  @Column({ name: 'vl_estimado', type: 'numeric', precision: 12, scale: 2, default: 0 })
  vlEstimado: number;

  @Column({ name: 'vl_real', type: 'numeric', precision: 12, scale: 2, nullable: true })
  vlReal: number | null;

  @Column({ name: 'dt_prevista', type: 'date', nullable: true })
  dtPrevista: string | null;

  @Column({ name: 'sn_status', length: 20, default: 'PLANEJADO' })
  snStatus: string; // PLANEJADO | COMPRADO | PAGO

  @Column({ name: 'sn_reembolsavel', length: 1, default: 'N' })
  snReembolsavel: string; // 'S' se alguém te devolve esse valor

  @Column({ name: 'ds_comprovante_url', type: 'text', nullable: true })
  dsComprovanteUrl: string | null;

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
