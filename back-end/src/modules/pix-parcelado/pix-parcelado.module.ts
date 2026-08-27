import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';
import { PixParceladoService } from './pix-parcelado.service';
import { PixParceladoController } from './pix-parcelado.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PixParceladoEntity]), AuthModule],
  providers: [PixParceladoService],
  controllers: [PixParceladoController],
  exports: [PixParceladoService],
})
export class PixParceladoModule {}
