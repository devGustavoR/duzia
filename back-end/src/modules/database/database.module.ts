import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { CategoriaEntity } from '../../entities/categoria.entity';
import { ContaEntity } from '../../entities/conta.entity';
import { AssinaturaEntity } from '../../entities/assinatura.entity';
import { MetaCompraEntity } from '../../entities/meta-compra.entity';
import { OcorrenciaEntity } from '../../entities/ocorrencia.entity';
import { AvisoEnviadoEntity } from '../../entities/aviso-enviado.entity';
import { DividaEntity } from '../../entities/divida.entity';
import { PerfilFinanceiroEntity } from '../../entities/perfil-financeiro.entity';
import { FaculdadeEntity } from '../../entities/faculdade.entity';
import { AcademiaEntity } from '../../entities/academia.entity';
import { CartaoEntity } from '../../entities/cartao.entity';
import { CartaoCreditoEntity } from '../../entities/cartao-credito.entity';
import { CartaoCreditoCompraEntity } from '../../entities/cartao-credito-compra.entity';
import { PixParceladoEntity } from '../../entities/pix-parcelado.entity';

async function ensureDatabaseExists(configService: ConfigService) {
  const dbUrl = configService.get<string>('DATABASE_URL');
  if (dbUrl) {
    // If using remote cloud db like Supabase, target database 'postgres' already exists
    if (dbUrl.includes('supabase.co')) return;

    try {
      const urlObj = new URL(dbUrl);
      const targetDb = urlObj.pathname.replace('/', '') || 'duzia';
      urlObj.pathname = '/postgres';
      const client = new Client({ connectionString: urlObj.toString() });
      await client.connect();
      const res = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [targetDb],
      );
      if (res.rowCount === 0) {
        await client.query(`CREATE DATABASE "${targetDb}";`);
        console.log(`✅ Banco de dados "${targetDb}" criado com sucesso via DATABASE_URL!`);
      }
      await client.end();
    } catch (e) {
      // Continue if fallback
    }
    return;
  }

  const dbName = configService.get<string>('DB_NAME', 'duzia');
  const host = configService.get<string>('DB_HOST', 'localhost');
  const port = configService.get<number>('DB_PORT', 5432);
  const user = configService.get<string>('DB_USER', 'postgres');
  const password = configService.get<string>('DB_PASSWORD', 'postgres');

  try {
    const client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Banco de dados "${dbName}" criado com sucesso!`);
    }
    await client.end();
  } catch (e) {
    console.warn(`⚠️ Não foi possível autocriar o banco "${dbName}": ${e.message}`);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        await ensureDatabaseExists(configService);

        const dbUrl = configService.get<string>('DATABASE_URL');
        if (dbUrl) {
          const isSupabase = dbUrl.includes('supabase.co');
          return {
            type: 'postgres',
            url: dbUrl,
            ssl: isSupabase ? { rejectUnauthorized: false } : false,
            entities: [
              CategoriaEntity,
              ContaEntity,
              AssinaturaEntity,
              MetaCompraEntity,
              OcorrenciaEntity,
              AvisoEnviadoEntity,
              DividaEntity,
              PerfilFinanceiroEntity,
              FaculdadeEntity,
              AcademiaEntity,
              CartaoEntity,
              CartaoCreditoEntity,
              CartaoCreditoCompraEntity,
              PixParceladoEntity,
            ],
            synchronize: true,
            logging: false,
          };
        }
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'duzia'),
          entities: [
            CategoriaEntity,
            ContaEntity,
            AssinaturaEntity,
            MetaCompraEntity,
            OcorrenciaEntity,
            AvisoEnviadoEntity,
            DividaEntity,
            PerfilFinanceiroEntity,
            FaculdadeEntity,
            AcademiaEntity,
            CartaoEntity,
            CartaoCreditoEntity,
            CartaoCreditoCompraEntity,
          ],
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS financeiro;`);
    } catch (err) {
      console.warn('Schema setup warning:', err.message);
    }
  }
}
