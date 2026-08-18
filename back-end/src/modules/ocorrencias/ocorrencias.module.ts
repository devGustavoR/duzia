import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { ContaEntity } from '../../entities/conta.entity';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { OcorrenciasService } from './ocorrencias.service';
import { OcorrenciasController } from './ocorrencias.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcorrenciaEntity, ContaEntity, AssinaturaEntity]),
  ],
  providers: [OcorrenciasService],
  controllers: [OcorrenciasController],
  exports: [OcorrenciasService, TypeOrmModule],
})
export class OcorrenciasModule {}
