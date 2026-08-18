import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AcademiaService } from './academia.service';
import { AcademiaEntity } from '../../entities/academia.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('academia')
@UseGuards(SupabaseAuthGuard)
export class AcademiaController {
  constructor(private readonly service: AcademiaService) {}

  @Get()
  getDashboard() {
    return this.service.getDashboardAcademia();
  }

  @Post()
  saveAcademia(@Body() dto: Partial<AcademiaEntity>): Promise<AcademiaEntity> {
    return this.service.saveAcademia(dto);
  }
}
