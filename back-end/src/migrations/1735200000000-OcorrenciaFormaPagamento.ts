import { MigrationInterface, QueryRunner } from 'typeorm';

/** Payment method on an occurrence (PIX / DINHEIRO), so cash payments
 *  don't require a receipt. */
export class OcorrenciaFormaPagamento1735200000000 implements MigrationInterface {
  name = 'OcorrenciaFormaPagamento1735200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE financeiro.tb_ocorrencia
      ADD COLUMN IF NOT EXISTS ds_forma_pagamento varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE financeiro.tb_ocorrencia
      DROP COLUMN IF EXISTS ds_forma_pagamento
    `);
  }
}
