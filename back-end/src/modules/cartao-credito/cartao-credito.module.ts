import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartaoCreditoEntity } from '../../entities/cartao-credito.entity';
import { CartaoCreditoCompraEntity } from '../../entities/cartao-credito-compra.entity';
import { CartaoCreditoService } from './cartao-credito.service';
import { CartaoCreditoController } from './cartao-credito.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartaoCreditoEntity, CartaoCreditoCompraEntity]),
  ],
  controllers: [CartaoCreditoController],
  providers: [CartaoCreditoService],
  exports: [CartaoCreditoService],
})
export class CartaoCreditoModule {}
