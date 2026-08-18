import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { ApiKeyGuard } from './api-key.guard';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly service: AvisosService) {}

  @Get('pendentes')
  @UseGuards(ApiKeyGuard)
  getPendentes() {
    return this.service.getAvisosPendentes();
  }

  @Post('confirmar')
  @UseGuards(ApiKeyGuard)
  confirmarEnvio(
    @Body('cdOcorrencia') cdOcorrencia: number,
    @Body('dsTelefoneDestino') dsTelefoneDestino?: string,
    @Body('dsStatus') dsStatus?: string,
  ) {
    return this.service.confirmarEnvio(cdOcorrencia, dsTelefoneDestino, dsStatus);
  }

  @Get('historico')
  getHistorico() {
    return this.service.getHistorico();
  }
}
