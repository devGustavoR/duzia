/**
 * Consulta o saldo do cartão de transporte (SalvadorCARD / KIM) via API do KIM.
 *
 * USO:
 *   node consulta-saldo-kim.js <TOKEN>
 * ou defina KIM_ACCESS_TOKEN no .env / .kim-tokens.json
 */

const fs = require('fs');
const path = require('path');

const TOKEN_STORE_PATH = path.join(__dirname, '.kim-tokens.json');

const CONFIG = {
  numeroCartao: '036500336819453',
  idOperadora: 1,
  saldoMinimo: 15.0,
  extratoUrl: 'https://kim.prd.usekim.com.br/cartao/api/v1/cartao/extrato',

  evolution: {
    ativo: process.env.EVOLUTION_ATIVO === 'true',
    baseUrl: process.env.EVOLUTION_BASE_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instance: process.env.EVOLUTION_INSTANCE || '',
    numeroDestino: process.env.EVOLUTION_NUMERO_DESTINO || '',
  },
};

function carregarTokens() {
  const cliToken = process.argv[2];
  if (cliToken) {
    const updated = { id_token: cliToken, access_token: cliToken };
    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(updated, null, 2));
    return updated;
  }

  if (fs.existsSync(TOKEN_STORE_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_STORE_PATH, 'utf-8'));
  }

  const token = process.env.KIM_TOKEN || process.env.KIM_ACCESS_TOKEN;
  if (token) {
    return { id_token: token, access_token: token };
  }

  throw new Error(
    'Nenhum token encontrado. Execute: node consulta-saldo-kim.js <SEU_TOKEN>'
  );
}

async function consultarSaldoDirect(token) {
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const url = new URL(CONFIG.extratoUrl);
  url.searchParams.set('numeroCartao', CONFIG.numeroCartao);
  url.searchParams.set('idOperadora', String(CONFIG.idOperadora));
  url.searchParams.set('dataUsoInicial', '2000-01-01');
  url.searchParams.set('dataUsoFinal', amanha);
  url.searchParams.set('codigoCargaInicial', '1');
  url.searchParams.set('codigoCargaFinal', '9999');

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Origin: 'https://app.usekim.com.br',
      Referer: 'https://app.usekim.com.br/',
    },
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errorText}`);
  }

  return await resp.json();
}

function processarExtrato(extrato) {
  if (!Array.isArray(extrato) || extrato.length === 0) {
    throw new Error('Extrato veio vazio ou em formato inesperado.');
  }

  const maisRecente = [...extrato].sort(
    (a, b) => new Date(b.dataUtilizacao) - new Date(a.dataUtilizacao)
  )[0];

  return {
    saldo: maisRecente.saldoBanco,
    atualizadoEm: maisRecente.dataUtilizacao,
    linha: maisRecente.linhaOnibusUtilizada,
    tipoCartao: maisRecente.descTipoUtilizacao,
    valorDebitado: maisRecente.valorDebitado,
  };
}

async function enviarWhatsApp(mensagem) {
  const { baseUrl, apiKey, instance, numeroDestino } = CONFIG.evolution;

  const resp = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({ number: numeroDestino, text: mensagem }),
  });

  if (!resp.ok) {
    throw new Error(`Falha ao enviar WhatsApp: HTTP ${resp.status} - ${await resp.text()}`);
  }
}

async function main() {
  try {
    const tokens = carregarTokens();
    // A API do KIM aceita o id_token (que tem audiência kim-web-app) ou access_token
    const token = tokens.id_token || tokens.idToken || tokens.access_token || tokens.accessToken;

    const extratoData = await consultarSaldoDirect(token);
    const { saldo, atualizadoEm, linha, tipoCartao, valorDebitado } = processarExtrato(extratoData);

    const dataFormatada = new Date(atualizadoEm).toLocaleString('pt-BR');

    console.log(`\n==================================================`);
    console.log(`💳 Cartão: ${CONFIG.numeroCartao} (${tipoCartao})`);
    console.log(`✅ Saldo Atual: R$ ${saldo.toFixed(2)}`);
    console.log(`🚌 Último Uso: ${dataFormatada} (Linha: ${linha} | -R$ ${valorDebitado.toFixed(2)})`);
    console.log(`==================================================\n`);

    if (saldo < CONFIG.saldoMinimo) {
      const mensagem = `⚠️ Saldo do cartão de transporte baixo: R$ ${saldo.toFixed(2)}. Considere recarregar.`;
      console.log(mensagem);

      if (CONFIG.evolution.ativo) {
        await enviarWhatsApp(mensagem);
        console.log('Notificação enviada no WhatsApp.');
      }
    }
  } catch (err) {
    console.error('\n❌ Erro ao consultar saldo:', err.message);
  }
}

main();