import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema.
 *
 * Every statement is idempotent (CREATE ... IF NOT EXISTS), so running this
 * against the existing production database is a no-op that only records the
 * migration as applied. Against a fresh database it builds the whole schema.
 */
export class Baseline1735000000000 implements MigrationInterface {
  name = 'Baseline1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS financeiro`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_categoria (
        cd_categoria SERIAL PRIMARY KEY,
        nm_categoria varchar(50) NOT NULL,
        ds_icone varchar(50),
        ds_cor varchar(20) DEFAULT '#6366f1',
        ts_criacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_conta (
        cd_conta SERIAL PRIMARY KEY,
        nm_conta varchar(100) NOT NULL,
        ds_observacao text,
        cd_categoria int,
        vl_valor numeric(12,2) NOT NULL,
        sn_recorrente varchar(1) NOT NULL DEFAULT 'S',
        sn_fixo varchar(1) NOT NULL DEFAULT 'S',
        ds_frequencia varchar(20) NOT NULL DEFAULT 'MENSAL',
        sn_dividida varchar(1) NOT NULL DEFAULT 'N',
        vl_total_servico numeric(12,2),
        ds_amigos_divididos varchar(200),
        vl_cota_amigo numeric(12,2),
        sn_terceiros varchar(1) NOT NULL DEFAULT 'N',
        nm_titular_terceiro varchar(100),
        sn_reembolsado varchar(1) NOT NULL DEFAULT 'S',
        vl_cota_propria numeric(12,2) NOT NULL DEFAULT 0,
        nr_dia_vencimento int,
        dt_vencimento_inicial date,
        nr_dias_aviso int NOT NULL DEFAULT 3,
        sn_aviso_ativo varchar(1) NOT NULL DEFAULT 'S',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_conta_categoria FOREIGN KEY (cd_categoria)
          REFERENCES financeiro.tb_categoria (cd_categoria) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_assinatura (
        cd_assinatura SERIAL PRIMARY KEY,
        nm_assinatura varchar(100) NOT NULL,
        ds_observacao text,
        cd_categoria int,
        vl_mensalidade numeric(12,2) NOT NULL,
        ds_ciclo varchar(20) NOT NULL DEFAULT 'MENSAL',
        sn_dividida varchar(1) NOT NULL DEFAULT 'N',
        vl_total_servico numeric(12,2),
        ds_amigos_divididos varchar(200),
        vl_cota_amigo numeric(12,2),
        sn_terceiros varchar(1) NOT NULL DEFAULT 'N',
        nm_titular_terceiro varchar(100),
        sn_reembolsado varchar(1) NOT NULL DEFAULT 'S',
        vl_cota_propria numeric(12,2) NOT NULL DEFAULT 0,
        nr_dia_vencimento int NOT NULL,
        dt_proxima_cobranca date NOT NULL,
        nr_dias_aviso int NOT NULL DEFAULT 3,
        sn_aviso_ativo varchar(1) NOT NULL DEFAULT 'S',
        cd_cartao_credito int,
        nm_cartao_vinculado varchar(100),
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_assinatura_categoria FOREIGN KEY (cd_categoria)
          REFERENCES financeiro.tb_categoria (cd_categoria) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_meta_compra (
        cd_meta SERIAL PRIMARY KEY,
        nm_meta varchar(100) NOT NULL,
        ds_observacao text,
        vl_alvo numeric(12,2) NOT NULL,
        vl_poupado numeric(12,2) NOT NULL DEFAULT 0,
        dt_prazo date,
        sn_concluida varchar(1) NOT NULL DEFAULT 'N',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_ocorrencia (
        cd_ocorrencia SERIAL PRIMARY KEY,
        tp_origem varchar(20) NOT NULL,
        cd_origem int NOT NULL,
        nm_item varchar(100) NOT NULL,
        vl_esperado numeric(12,2) NOT NULL,
        vl_pago numeric(12,2),
        dt_vencimento date NOT NULL,
        dt_pagamento date,
        ds_comprovante_url text,
        sn_pago varchar(1) NOT NULL DEFAULT 'N',
        nr_dias_aviso int NOT NULL DEFAULT 3,
        sn_aviso_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_aviso_enviado (
        cd_aviso SERIAL PRIMARY KEY,
        cd_ocorrencia int NOT NULL,
        dt_referencia date NOT NULL,
        ds_telefone_destino varchar(30),
        ds_status varchar(30) NOT NULL DEFAULT 'ENVIADO',
        ts_envio timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_aviso_ocorrencia FOREIGN KEY (cd_ocorrencia)
          REFERENCES financeiro.tb_ocorrencia (cd_ocorrencia) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_divida (
        cd_divida SERIAL PRIMARY KEY,
        nm_divida varchar(100) NOT NULL,
        ds_credor varchar(100),
        vl_total_original numeric(12,2) NOT NULL,
        vl_saldo_devedor numeric(12,2) NOT NULL,
        vl_parcela numeric(12,2) NOT NULL,
        taxa_juros_mensal numeric(5,2) NOT NULL DEFAULT 0,
        nr_parcelas_totais int NOT NULL DEFAULT 1,
        nr_parcelas_pagas int NOT NULL DEFAULT 0,
        dt_vencimento_parcela date,
        sn_quitada varchar(1) NOT NULL DEFAULT 'N',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_perfil_financeiro (
        cd_perfil SERIAL PRIMARY KEY,
        vl_salario_liquido numeric(12,2) NOT NULL DEFAULT 0,
        vl_renda_variavel numeric(12,2) NOT NULL DEFAULT 0,
        vl_outras_rendas numeric(12,2) NOT NULL DEFAULT 0,
        ds_perfil_risco varchar(50) NOT NULL DEFAULT 'MODERADO',
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_faculdade (
        cd_faculdade SERIAL PRIMARY KEY,
        nm_curso varchar(100) NOT NULL,
        nm_instituicao varchar(100) NOT NULL,
        ds_semestre varchar(50) NOT NULL DEFAULT '1º Semestre',
        vl_mensalidade numeric(12,2) NOT NULL,
        nr_dia_vencimento int NOT NULL DEFAULT 5,
        vl_matricula numeric(12,2),
        dt_pagamento_matricula date,
        ds_comprovante_matricula text,
        nr_dias_aviso int NOT NULL DEFAULT 3,
        sn_aviso_ativo varchar(1) NOT NULL DEFAULT 'S',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_academia (
        cd_academia SERIAL PRIMARY KEY,
        nm_academia varchar(100) NOT NULL DEFAULT 'Smart Fit',
        vl_mensalidade_academia numeric(12,2) NOT NULL DEFAULT 120,
        nr_dia_vencimento_academia int NOT NULL DEFAULT 10,
        sn_academia_namorada varchar(1) NOT NULL DEFAULT 'S',
        nm_titular_terceiro varchar(100) NOT NULL DEFAULT 'Namorada',
        vl_academia_namorada numeric(12,2) NOT NULL DEFAULT 120,
        sn_academia_namorada_reembolsado varchar(1) NOT NULL DEFAULT 'S',
        nm_personal varchar(100) NOT NULL DEFAULT 'Personal Trainer',
        vl_personal_unitario numeric(12,2) NOT NULL DEFAULT 400,
        nr_qtd_pessoas int NOT NULL DEFAULT 2,
        nr_dia_vencimento_personal int NOT NULL DEFAULT 10,
        vl_suplementos numeric(12,2) NOT NULL DEFAULT 200,
        nr_dias_aviso int NOT NULL DEFAULT 3,
        sn_aviso_ativo varchar(1) NOT NULL DEFAULT 'S',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_cartao_transporte (
        cd_cartao SERIAL PRIMARY KEY,
        numero_cartao varchar(50) NOT NULL DEFAULT '036500336819453',
        id_operadora int NOT NULL DEFAULT 1,
        nm_cartao varchar(100) NOT NULL DEFAULT 'SalvadorCARD Estudante',
        token_kim text,
        vl_saldo_minimo numeric(12,2) NOT NULL DEFAULT 15.0,
        vl_saldo_atual numeric(12,2),
        ds_ultima_linha varchar(100),
        dt_ultima_utilizacao timestamptz,
        ds_cor_card varchar(100) NOT NULL DEFAULT 'from-[#ea2a33] to-[#4a0404]',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_cartao_credito (
        cd_cartao_credito SERIAL PRIMARY KEY,
        nm_cartao varchar(100) NOT NULL,
        nm_banco varchar(50) NOT NULL DEFAULT 'Outro',
        nm_bandeira varchar(50) NOT NULL DEFAULT 'Mastercard',
        nr_ultimos_digitos varchar(4),
        vl_limite_total numeric(12,2) NOT NULL DEFAULT 5000,
        vl_limite_usado numeric(12,2) NOT NULL DEFAULT 0,
        nr_dia_fechamento int NOT NULL DEFAULT 5,
        nr_dia_vencimento int NOT NULL DEFAULT 12,
        ds_cor_card varchar(100) NOT NULL DEFAULT 'from-purple-900 via-purple-700 to-indigo-950',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_cartao_credito_compra (
        cd_compra SERIAL PRIMARY KEY,
        cd_cartao_credito int NOT NULL,
        ds_compra varchar(150) NOT NULL,
        vl_total numeric(12,2) NOT NULL,
        nr_parcelas int NOT NULL DEFAULT 1,
        nr_parcela_atual int NOT NULL DEFAULT 1,
        vl_parcela numeric(12,2) NOT NULL,
        dt_compra date NOT NULL,
        nm_categoria varchar(50) NOT NULL DEFAULT 'Geral',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_compra_cartao_credito FOREIGN KEY (cd_cartao_credito)
          REFERENCES financeiro.tb_cartao_credito (cd_cartao_credito) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_pix_parcelado (
        cd_pix_parcelado SERIAL PRIMARY KEY,
        nm_descricao varchar(100) NOT NULL,
        ds_estabelecimento varchar(100),
        nm_banco varchar(60),
        vl_total_compra numeric(12,2) NOT NULL,
        vl_parcela numeric(12,2) NOT NULL,
        taxa_juros_mensal numeric(5,2) NOT NULL DEFAULT 0,
        vl_total_com_juros numeric(12,2) NOT NULL,
        nr_parcelas_totais int NOT NULL DEFAULT 1,
        nr_parcelas_pagas int NOT NULL DEFAULT 0,
        nr_dia_vencimento int NOT NULL DEFAULT 10,
        dt_primeira_parcela date,
        ds_comprovante_url text,
        sn_quitada varchar(1) NOT NULL DEFAULT 'N',
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_evento (
        cd_evento SERIAL PRIMARY KEY,
        nm_evento varchar(100) NOT NULL,
        dt_evento date NOT NULL,
        ds_observacao text,
        sn_ativo varchar(1) NOT NULL DEFAULT 'S',
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financeiro.tb_evento_item (
        cd_item SERIAL PRIMARY KEY,
        cd_evento int NOT NULL,
        ds_item varchar(100) NOT NULL,
        nm_categoria varchar(50),
        vl_estimado numeric(12,2) NOT NULL DEFAULT 0,
        vl_real numeric(12,2),
        dt_prevista date,
        sn_status varchar(20) NOT NULL DEFAULT 'PLANEJADO',
        sn_reembolsavel varchar(1) NOT NULL DEFAULT 'N',
        ds_comprovante_url text,
        ts_criacao timestamptz NOT NULL DEFAULT now(),
        ts_atualizacao timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_evento_item_evento FOREIGN KEY (cd_evento)
          REFERENCES financeiro.tb_evento (cd_evento) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_evento_item`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_evento`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_pix_parcelado`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS financeiro.tb_cartao_credito_compra`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS financeiro.tb_cartao_credito`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS financeiro.tb_cartao_transporte`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_academia`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_faculdade`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS financeiro.tb_perfil_financeiro`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_divida`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_aviso_enviado`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_ocorrencia`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_meta_compra`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_assinatura`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_conta`);
    await queryRunner.query(`DROP TABLE IF EXISTS financeiro.tb_categoria`);
  }
}
