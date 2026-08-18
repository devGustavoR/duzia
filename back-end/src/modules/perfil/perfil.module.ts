import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilFinanceiroEntity]), AuthModule],
  providers: [PerfilService],
  controllers: [PerfilController],
  exports: [PerfilService],
})
export class PerfilModule {}
