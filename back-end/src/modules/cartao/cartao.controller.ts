import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CartaoService } from './cartao.service';
import { CartaoEntity } from '../../entities/cartao.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('cartao')
@UseGuards(SupabaseAuthGuard)
export class CartaoController {
  constructor(private readonly service: CartaoService) {}

  @Get()
  listarCartoes() {
    return this.service.listarCartoes();
  }

  @Get(':id')
  obterCartaoDetalhes(@Param('id', ParseIntPipe) id: number) {
    return this.service.consultarSaldoEExtrato(id);
  }

  @Post()
  salvarCartao(@Body() dto: Partial<CartaoEntity>) {
    return this.service.salvarCartao(dto);
  }

  @Post(':id/refresh')
  refreshCartao(@Param('id', ParseIntPipe) id: number) {
    return this.service.consultarSaldoEExtrato(id);
  }

  @Delete(':id')
  excluirCartao(@Param('id', ParseIntPipe) id: number) {
    return this.service.excluirCartao(id);
  }
}
