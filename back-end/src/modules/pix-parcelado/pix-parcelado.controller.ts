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
import { PixParceladoService } from './pix-parcelado.service';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('pix-parcelado')
@UseGuards(SupabaseAuthGuard)
export class PixParceladoController {
  constructor(private readonly service: PixParceladoService) {}

  @Get()
  findAll(): Promise<PixParceladoEntity[]> {
    return this.service.findAll();
  }

  @Get('resumo')
  getResumo() {
    return this.service.getResumo();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PixParceladoEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() dto: Partial<PixParceladoEntity>,
  ): Promise<PixParceladoEntity> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<PixParceladoEntity>,
  ): Promise<PixParceladoEntity | null> {
    return this.service.update(id, dto);
  }

  @Post(':id/pagar-parcela')
  pagarParcela(
    @Param('id', ParseIntPipe) id: number,
    @Body('dsComprovanteUrl') dsComprovanteUrl?: string,
  ): Promise<PixParceladoEntity> {
    return this.service.pagarParcela(id, dsComprovanteUrl);
  }

  @Post(':id/estornar-parcela')
  estornarParcela(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PixParceladoEntity> {
    return this.service.estornarParcela(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
