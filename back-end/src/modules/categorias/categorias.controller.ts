import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CategoriaEntity } from '../../entities/categoria.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('categorias')
@UseGuards(SupabaseAuthGuard)
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Get()
  findAll(): Promise<CategoriaEntity[]> {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: Partial<CategoriaEntity>): Promise<CategoriaEntity> {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
