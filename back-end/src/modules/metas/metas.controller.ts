import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('metas')
@UseGuards(SupabaseAuthGuard)
export class MetasController {
  constructor(private readonly service: MetasService) {}

  @Get()
  findAll(): Promise<MetaCompraEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MetaCompraEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<MetaCompraEntity>): Promise<MetaCompraEntity> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<MetaCompraEntity>,
  ): Promise<MetaCompraEntity | null> {
    return this.service.update(id, dto);
  }

  @Post(':id/aportar')
  aportar(
    @Param('id', ParseIntPipe) id: number,
    @Body('valor') valor: number,
  ): Promise<MetaCompraEntity> {
    return this.service.aportar(id, valor);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
