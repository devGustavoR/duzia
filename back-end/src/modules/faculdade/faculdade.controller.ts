import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FaculdadeService } from './faculdade.service';
import { FaculdadeEntity } from '../../entities/faculdade.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('faculdade')
@UseGuards(SupabaseAuthGuard)
export class FaculdadeController {
  constructor(private readonly service: FaculdadeService) {}

  @Get()
  getDashboard() {
    return this.service.getDashboardFaculdade();
  }

  @Post()
  saveFaculdade(@Body() dto: Partial<FaculdadeEntity>): Promise<FaculdadeEntity> {
    return this.service.saveFaculdade(dto);
  }
}
