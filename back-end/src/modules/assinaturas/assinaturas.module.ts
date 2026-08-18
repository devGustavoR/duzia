import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';
import { OcorrenciasModule } from '../ocorrencias/ocorrencias.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssinaturaEntity]), OcorrenciasModule],
  providers: [AssinaturasService],
  controllers: [AssinaturasController],
  exports: [AssinaturasService],
})
export class AssinaturasModule {}
