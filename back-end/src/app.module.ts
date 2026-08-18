import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './common/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { ContasModule } from './modules/contas/contas.module';
import { AssinaturasModule } from './modules/assinaturas/assinaturas.module';
import { MetasModule } from './modules/metas/metas.module';
import { OcorrenciasModule } from './modules/ocorrencias/ocorrencias.module';
import { AvisosModule } from './modules/avisos/avisos.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DividasModule } from './modules/dividas/dividas.module';
import { PerfilModule } from './modules/perfil/perfil.module';
import { FaculdadeModule } from './modules/faculdade/faculdade.module';
import { AcademiaModule } from './modules/academia/academia.module';
import { CartaoModule } from './modules/cartao/cartao.module';
import { CartaoCreditoModule } from './modules/cartao-credito/cartao-credito.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    DatabaseModule,
    AuthModule,
    CategoriasModule,
    ContasModule,
    AssinaturasModule,
    MetasModule,
    OcorrenciasModule,
    AvisosModule,
    DashboardModule,
    DividasModule,
    PerfilModule,
    FaculdadeModule,
    AcademiaModule,
    CartaoModule,
    CartaoCreditoModule,
  ],
})
export class AppModule {}
