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
import { AssinaturasService } from './assinaturas.service';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('assinaturas')
@UseGuards(SupabaseAuthGuard)
export class AssinaturasController {
  constructor(private readonly service: AssinaturasService) {}

  @Get()
  findAll(): Promise<AssinaturaEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AssinaturaEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<AssinaturaEntity>): Promise<AssinaturaEntity> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<AssinaturaEntity>,
  ): Promise<AssinaturaEntity | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
