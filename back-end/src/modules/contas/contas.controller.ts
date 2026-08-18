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
import { ContasService } from './contas.service';
import { ContaEntity } from '../../entities/conta.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('contas')
@UseGuards(SupabaseAuthGuard)
export class ContasController {
  constructor(private readonly service: ContasService) {}

  @Get()
  findAll(): Promise<ContaEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ContaEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<ContaEntity>): Promise<ContaEntity> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<ContaEntity>,
  ): Promise<ContaEntity | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
