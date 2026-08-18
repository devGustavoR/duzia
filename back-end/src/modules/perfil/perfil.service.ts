import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(PerfilFinanceiroEntity)
    private readonly repo: Repository<PerfilFinanceiroEntity>,
  ) {}

  async getPerfil(): Promise<PerfilFinanceiroEntity> {
    const list = await this.repo.find({ take: 1, order: { cdPerfil: 'DESC' } });
    if (list.length > 0) return list[0];

    // Create default profile if none exists
    const newPerfil = this.repo.create({
      vlSalarioLiquido: 5000,
      vlRendaVariavel: 0,
      vlOutrasRendas: 0,
      dsPerfilRisco: 'MODERADO',
    });
    return this.repo.save(newPerfil);
  }

  async savePerfil(dto: Partial<PerfilFinanceiroEntity>): Promise<PerfilFinanceiroEntity> {
    const current = await this.getPerfil();
    await this.repo.update(current.cdPerfil, dto);
    return this.getPerfil();
  }
}
