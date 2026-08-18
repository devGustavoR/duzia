import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcorrenciasService } from './ocorrencias.service';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { ContaEntity } from '../../entities/conta.entity';
import { AssinaturaEntity } from '../../entities/assinatura.entity';

describe('OcorrenciasService', () => {
  let service: OcorrenciasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcorrenciasService,
        {
          provide: getRepositoryToken(OcorrenciaEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContaEntity),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(AssinaturaEntity),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OcorrenciasService>(OcorrenciasService);
  });

  it('deve formatar data ISO corretamente', () => {
    const d = new Date(2026, 7, 15); // Month 7 is August (0-indexed)
    expect(service.formatDateISO(d)).toBe('2026-08-15');
  });

  it('deve ajustar o último dia de meses com menos dias', () => {
    // Feb 31, 2026 -> Feb 28, 2026
    const dt = service.getValidDueDate(2026, 2, 31);
    expect(dt).toBe('2026-02-28');
  });

  it('deve calcular vencimento correto em meses regulares', () => {
    const dt = service.getValidDueDate(2026, 8, 15);
    expect(dt).toBe('2026-08-15');
  });
});
