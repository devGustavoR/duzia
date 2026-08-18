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
import { DividasService } from './dividas.service';
import { DividaEntity } from '../../entities/divida.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('dividas')
@UseGuards(SupabaseAuthGuard)
export class DividasController {
  constructor(private readonly service: DividasService) {}

  @Get()
  findAll(): Promise<DividaEntity[]> {
    return this.service.findAll();
  }

  @Get('analise-quitacao')
  getAnaliseQuitacao() {
    return this.service.getAnaliseQuitacao();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DividaEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<DividaEntity>): Promise<DividaEntity> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<DividaEntity>,
  ): Promise<DividaEntity | null> {
    return this.service.update(id, dto);
  }

  @Post(':id/pagar-parcela')
  pagarParcela(@Param('id', ParseIntPipe) id: number): Promise<DividaEntity> {
    return this.service.pagarParcela(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
