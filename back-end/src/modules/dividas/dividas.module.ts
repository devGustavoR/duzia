import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DividaEntity } from '../../entities/divida.entity';
import { DividasService } from './dividas.service';
import { DividasController } from './dividas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DividaEntity]), AuthModule],
  providers: [DividasService],
  controllers: [DividasController],
  exports: [DividasService],
})
export class DividasModule {}
