export interface FaturaNeoenergiaData {
  valor: number;
  vencimento: string; // YYYY-MM-DD
  referenciaMesAno: string | null; // MM/YYYY
  codigoCliente: string | null;
  linhaDigitavel: string | null;
}

function parseValorBr(valor: string): number {
  return Number(valor.replace(/\./g, '').replace(',', '.'));
}

function parseDataBr(data: string): string {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes}-${dia}`;
}

export function parseFaturaNeoenergia(rawText: string): FaturaNeoenergiaData {
  const texto = rawText.replace(/\s+/g, ' ');

  const valorMatch = texto.match(/TOTAL A PAGAR R\$\s*([\d.,]+)/i);
  const vencimentoMatch = texto.match(/VENCIMENTO\s*(\d{2}\/\d{2}\/\d{4})/i);
  const referenciaMatch = texto.match(/REF:?\s*M[ÊE]S\/ANO\s*(\d{2}\/\d{4})/i);
  const codigoClienteMatch = texto.match(/C[ÓO]DIGO DO CLIENTE\s*(\d+)/i);
  const linhaDigitavelMatch = texto.match(
    /(\d{5}\.\d{5}\s\d{5}\.\d{6}\s\d{5}\.\d{6}\s\d\s\d{14})/,
  );

  if (!valorMatch || !vencimentoMatch) {
    throw new Error(
      'Não foi possível identificar valor/vencimento na fatura. Confirme se é uma fatura da Neoenergia Coelba.',
    );
  }

  return {
    valor: parseValorBr(valorMatch[1]),
    vencimento: parseDataBr(vencimentoMatch[1]),
    referenciaMesAno: referenciaMatch?.[1] ?? null,
    codigoCliente: codigoClienteMatch?.[1] ?? null,
    linhaDigitavel: linhaDigitavelMatch?.[1] ?? null,
  };
}
