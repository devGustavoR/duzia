import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EventoItemEntity } from './evento-item.entity';

@Entity({ name: 'tb_evento', schema: 'financeiro' })
export class EventoEntity {
  @PrimaryGeneratedColumn({ name: 'cd_evento' })
  cdEvento: number;

  @Column({ name: 'nm_evento', length: 100 })
  nmEvento: string; // Ex: Aniversário da Namorada

  @Column({ name: 'dt_evento', type: 'date' })
  dtEvento: string; // Dia-alvo

  @Column({ name: 'ds_observacao', type: 'text', nullable: true })
  dsObservacao: string | null;

  @Column({ name: 'sn_ativo', length: 1, default: 'S' })
  snAtivo: string;

  @OneToMany(() => EventoItemEntity, (item) => item.evento)
  itens: EventoItemEntity[];

  @CreateDateColumn({ name: 'ts_criacao', type: 'timestamptz' })
  tsCriacao: Date;

  @UpdateDateColumn({ name: 'ts_atualizacao', type: 'timestamptz' })
  tsAtualizacao: Date;
}
