import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { AvisoEnviadoEntity } from '../../entities/aviso-enviado.entity';
import { AvisosService } from './avisos.service';
import { AvisosController } from './avisos.controller';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([OcorrenciaEntity, AvisoEnviadoEntity])],
  providers: [AvisosService, ApiKeyGuard],
  controllers: [AvisosController],
  exports: [AvisosService],
})
export class AvisosModule {}
