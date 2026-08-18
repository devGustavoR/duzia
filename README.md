# Duzia

Plataforma de controle financeiro pessoal — monorepo com backend NestJS e frontend Next.js.

## Estrutura

- `back-end/` — API NestJS (TypeORM + PostgreSQL/Supabase) — porta 3001
- `front-end/` — Next.js (App Router, React 19) — porta 3000

## Desenvolvimento

```bash
# back-end
cd back-end && npm install && npm run dev

# front-end
cd front-end && npm install && npm run dev
```

## Deploy

Deploy automático via GitHub Actions em push para `main`: build das imagens Docker e `docker compose up -d` na VPS.
