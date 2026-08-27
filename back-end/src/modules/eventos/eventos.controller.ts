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
import { EventosService } from './eventos.service';
import { EventoEntity } from '../../entities/evento.entity';
import { EventoItemEntity } from '../../entities/evento-item.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('eventos')
@UseGuards(SupabaseAuthGuard)
export class EventosController {
  constructor(private readonly service: EventosService) {}

  // --- Itens (rotas específicas antes das rotas com :id) ---

  @Put('itens/:itemId')
  updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: Partial<EventoItemEntity>,
  ): Promise<EventoItemEntity | null> {
    return this.service.updateItem(itemId, dto);
  }

  @Delete('itens/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number): Promise<void> {
    return this.service.removeItem(itemId);
  }

  // --- Eventos ---

  @Get()
  findAll(): Promise<EventoEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventoEntity | null> {
    return this.service.findOne(id);
  }

  @Get(':id/projecao')
  getProjecao(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProjecao(id);
  }

  @Post()
  create(@Body() dto: Partial<EventoEntity>): Promise<EventoEntity> {
    return this.service.create(dto);
  }

  @Post(':id/itens')
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<EventoItemEntity>,
  ): Promise<EventoItemEntity> {
    return this.service.addItem(id, dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<EventoEntity>,
  ): Promise<EventoEntity | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
