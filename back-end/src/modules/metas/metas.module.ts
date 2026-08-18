import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MetaCompraEntity])],
  providers: [MetasService],
  controllers: [MetasController],
  exports: [MetasService],
})
export class MetasModule {}
