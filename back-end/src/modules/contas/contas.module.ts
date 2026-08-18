import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContaEntity } from '../../entities/conta.entity';
import { ContasService } from './contas.service';
import { ContasController } from './contas.controller';
import { OcorrenciasModule } from '../ocorrencias/ocorrencias.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContaEntity]), OcorrenciasModule],
  providers: [ContasService],
  controllers: [ContasController],
  exports: [ContasService],
})
export class ContasModule {}
