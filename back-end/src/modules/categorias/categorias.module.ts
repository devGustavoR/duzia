import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaEntity } from '../../entities/categoria.entity';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaEntity])],
  providers: [CategoriasService],
  controllers: [CategoriasController],
  exports: [CategoriasService, TypeOrmModule],
})
export class CategoriasModule {}
