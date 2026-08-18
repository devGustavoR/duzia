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
import { CartaoCreditoService } from './cartao-credito.service';
import { CartaoCreditoEntity } from '../../entities/cartao-credito.entity';
import { CartaoCreditoCompraEntity } from '../../entities/cartao-credito-compra.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('cartao-credito')
@UseGuards(SupabaseAuthGuard)
export class CartaoCreditoController {
  constructor(private readonly service: CartaoCreditoService) {}

  @Get()
  listarCartoesCredito() {
    return this.service.listarCartoesCredito();
  }

  @Get(':id')
  obterCartaoCreditoPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obterCartaoCreditoPorId(id);
  }

  @Post()
  salvarCartaoCredito(@Body() dto: Partial<CartaoCreditoEntity>) {
    return this.service.salvarCartaoCredito(dto);
  }

  @Delete(':id')
  excluirCartaoCredito(@Param('id', ParseIntPipe) id: number) {
    return this.service.excluirCartaoCredito(id);
  }

  @Post(':id/compra')
  adicionarCompra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CartaoCreditoCompraEntity>,
  ) {
    return this.service.adicionarCompra(id, dto);
  }

  @Delete('compra/:cdCompra')
  removerCompra(@Param('cdCompra', ParseIntPipe) cdCompra: number) {
    return this.service.removerCompra(cdCompra);
  }
}
