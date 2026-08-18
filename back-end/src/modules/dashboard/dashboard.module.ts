import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OcorrenciasModule } from '../ocorrencias/ocorrencias.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcorrenciaEntity, MetaCompraEntity]),
    OcorrenciasModule,
    AuthModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
