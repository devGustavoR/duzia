import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('perfil-financeiro')
@UseGuards(SupabaseAuthGuard)
export class PerfilController {
  constructor(private readonly service: PerfilService) {}

  @Get()
  getPerfil(): Promise<PerfilFinanceiroEntity> {
    return this.service.getPerfil();
  }

  @Post()
  savePerfil(@Body() dto: Partial<PerfilFinanceiroEntity>): Promise<PerfilFinanceiroEntity> {
    return this.service.savePerfil(dto);
  }
}
