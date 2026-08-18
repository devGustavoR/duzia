import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OcorrenciasService } from './ocorrencias.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('ocorrencias')
@UseGuards(SupabaseAuthGuard)
export class OcorrenciasController {
  constructor(private readonly service: OcorrenciasService) {}

  @Get()
  findByMonth(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const now = new Date();
    const m = mes !== undefined ? parseInt(mes, 10) : now.getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : now.getFullYear();
    return this.service.findByMonth(m, a);
  }

  @Get('pagas')
  findPagas(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const m = mes !== undefined ? parseInt(mes, 10) : undefined;
    const a = ano ? parseInt(ano, 10) : undefined;
    return this.service.findPagas(m, a);
  }

  @Post(':id/pagar')
  togglePago(
    @Param('id', ParseIntPipe) id: number,
    @Body('vlPago') vlPago?: number,
    @Body('dtPagamento') dtPagamento?: string,
    @Body('dsComprovanteUrl') dsComprovanteUrl?: string,
  ) {
    return this.service.togglePago(id, vlPago, dtPagamento, dsComprovanteUrl);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
