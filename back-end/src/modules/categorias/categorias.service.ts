import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaEntity } from '../../entities/categoria.entity';

@Injectable()
export class CategoriasService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly repo: Repository<CategoriaEntity>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.repo.count();
    if (count === 0) {
      const defaults = [
        { nmCategoria: 'Moradia', dsIcone: 'home', dsCor: '#3b82f6' },
        { nmCategoria: 'Alimentação', dsIcone: 'utensils', dsCor: '#10b981' },
        { nmCategoria: 'Serviços & Contas', dsIcone: 'zap', dsCor: '#f59e0b' },
        { nmCategoria: 'Transporte', dsIcone: 'car', dsCor: '#8b5cf6' },
        { nmCategoria: 'Saúde', dsIcone: 'heart-pulse', dsCor: '#ef4444' },
        { nmCategoria: 'Lazer & Assinaturas', dsIcone: 'tv', dsCor: '#ec4899' },
        { nmCategoria: 'Outros', dsIcone: 'tag', dsCor: '#6b7280' },
      ];
      await this.repo.save(defaults);
    }
  }

  findAll(): Promise<CategoriaEntity[]> {
    return this.repo.find({ order: { nmCategoria: 'ASC' } });
  }

  create(dto: Partial<CategoriaEntity>): Promise<CategoriaEntity> {
    const cat = this.repo.create(dto);
    return this.repo.save(cat);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
