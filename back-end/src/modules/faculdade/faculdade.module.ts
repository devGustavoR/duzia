import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaculdadeEntity } from '../../entities/faculdade.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { FaculdadeService } from './faculdade.service';
import { FaculdadeController } from './faculdade.controller';
import { OcorrenciasModule } from '../ocorrencias/ocorrencias.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FaculdadeEntity, OcorrenciaEntity]),
    OcorrenciasModule,
    AuthModule,
  ],
  providers: [FaculdadeService],
  controllers: [FaculdadeController],
  exports: [FaculdadeService],
})
export class FaculdadeModule {}
