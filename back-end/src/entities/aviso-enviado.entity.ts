import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OcorrenciaEntity } from './ocorrencia.entity';

@Entity({ name: 'tb_aviso_enviado', schema: 'financeiro' })
export class AvisoEnviadoEntity {
  @PrimaryGeneratedColumn({ name: 'cd_aviso' })
  cdAviso: number;

  @Column({ name: 'cd_ocorrencia' })
  cdOcorrencia: number;

  @ManyToOne(() => OcorrenciaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cd_ocorrencia' })
  ocorrencia: OcorrenciaEntity;

  @Column({ name: 'dt_referencia', type: 'date' })
  dtReferencia: string;

  @Column({ name: 'ds_telefone_destino', length: 30, nullable: true })
  dsTelefoneDestino: string;

  @Column({ name: 'ds_status', length: 30, default: 'ENVIADO' })
  dsStatus: string; // 'ENVIADO', 'FALHA'

  @CreateDateColumn({ name: 'ts_envio', type: 'timestamptz' })
  tsEnvio: Date;
}
