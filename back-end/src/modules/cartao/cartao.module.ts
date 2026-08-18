import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartaoEntity } from '../../entities/cartao.entity';
import { CartaoService } from './cartao.service';
import { CartaoController } from './cartao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CartaoEntity])],
  controllers: [CartaoController],
  providers: [CartaoService],
  exports: [CartaoService],
})
export class CartaoModule {}
