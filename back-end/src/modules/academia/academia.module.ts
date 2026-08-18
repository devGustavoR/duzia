import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademiaEntity } from '../../entities/academia.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { AcademiaService } from './academia.service';
import { AcademiaController } from './academia.controller';
import { OcorrenciasModule } from '../ocorrencias/ocorrencias.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademiaEntity, OcorrenciaEntity]),
    OcorrenciasModule,
    AuthModule,
  ],
  providers: [AcademiaService],
  controllers: [AcademiaController],
  exports: [AcademiaService],
})
export class AcademiaModule {}
