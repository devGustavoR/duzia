import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('dashboard')
@UseGuards(SupabaseAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboardData(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const m = mes ? parseInt(mes, 10) : undefined;
    const a = ano ? parseInt(ano, 10) : undefined;
    return this.service.getDashboardData(m, a);
  }
}
