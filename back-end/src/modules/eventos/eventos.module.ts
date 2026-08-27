import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from '../../entities/evento.entity';
import { EventoItemEntity } from '../../entities/evento-item.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';
import { DividaEntity } from '../../entities/divida.entity';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventoEntity,
      EventoItemEntity,
      OcorrenciaEntity,
      PerfilFinanceiroEntity,
      PixParceladoEntity,
      DividaEntity,
    ]),
    AuthModule,
  ],
  providers: [EventosService],
  controllers: [EventosController],
  exports: [EventosService],
})
export class EventosModule {}
