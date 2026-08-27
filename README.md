<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<h1 align="center">💰 Duzia</h1>

<p align="center">
  Sistema financeiro pessoal completo — controle total de contas, assinaturas, cartões, dívidas, metas e muito mais.
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/devGustavoR/duzia?style=flat-square" />
  <img src="https://img.shields.io/github/languages/top/devGustavoR/duzia?style=flat-square" />
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento%20ativo-green?style=flat-square" />
</p>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Preview](#-preview)
- [Módulos](#-módulos)
- [Tecnologias](#-tecnologias)
- [Como rodar](#-como-rodar)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Autor](#-autor)

---

## 💡 Sobre

Duzia nasceu da necessidade de centralizar toda a vida financeira pessoal em um único lugar — com visibilidade real sobre o que entra, o que sai, o que vence e o que foi pago.

Diferente de apps genéricos, o Duzia foi construído de forma totalmente personalizada para cobrir os detalhes do cotidiano real: cartões de passagem, divisão de assinaturas, pix parcelados, servidores e despesas recorrentes de cloud, faculdade, academia e muito mais.

---

## 📸 Preview

![Dashboard](./docs/dashboard.png)

---

## 🧩 Módulos

| Módulo | Descrição |
|---|---|
| 📊 **Dashboard** | Visão geral do mês: total, já pago, pendente e progresso |
| 💳 **Cartões de Crédito** | Controle de faturas e gastos por cartão |
| 🚌 **Cartões de Passagem** | Acompanhamento de saldo de transporte |
| 🏦 **Contas** | Gestão de contas a pagar com vencimentos |
| ✅ **Contas Pagas** | Histórico de pagamentos realizados |
| ☁️ **Servidores & Cloud** | Controle de custos de infraestrutura e VPS |
| 🔁 **Assinaturas** | Serviços recorrentes com alertas de vencimento |
| 🏋️ **Academia & Saúde** | Despesas de saúde e bem-estar |
| 🎓 **Faculdade** | Mensalidades e despesas acadêmicas |
| 💸 **Dívidas** | Controle e acompanhamento de dívidas |
| 📲 **Pix Parcelado** | Parcelamentos informais via Pix |
| 📅 **Próximos Vencimentos** | Timeline de contas a vencer |
| 🎯 **Metas** | Metas de compra e objetivos financeiros |
| 📊 **Simulador** | Simulações financeiras |
| 🔔 **Avisos WhatsApp** | Notificações de vencimento via WhatsApp |
| 🧠 **Quiz Renda** | Educação financeira gamificada |
| 🔧 **Preparação p/ o Dia** | Checklist financeiro diário |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11 + TypeScript |
| ORM | TypeORM |
| Banco de dados | PostgreSQL via Supabase |
| Frontend | Next.js 15 (App Router) + React 19 |
| Estilização | Tailwind CSS |
| Containerização | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deploy | VPS via SSH |

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### Instalação

```bash
# Clone o repositório
git clone https://github.com/devGustavoR/duzia.git
cd duzia
```

### Backend

```bash
cd back-end
npm install
cp .env.example .env
# Configure as variáveis de ambiente
npm run dev
```

### Frontend

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

### Com Docker

```bash
docker compose up -d
```

Acesse:
- Frontend: `http://localhost:3000`
- Backend/Swagger: `http://localhost:3001/api/docs`

---

## 📁 Estrutura do projeto

```
duzia/
├── back-end/               # API NestJS — porta 3001
│   ├── src/
│   │   ├── auth/           # JWT + refresh token
│   │   ├── accounts/       # Contas e vencimentos
│   │   ├── subscriptions/  # Assinaturas recorrentes
│   │   ├── cards/          # Cartões de crédito
│   │   ├── goals/          # Metas financeiras
│   │   ├── reports/        # Dashboard e relatórios
│   │   └── common/         # Guards, filters, decorators
│   └── Dockerfile
├── front-end/              # Next.js App Router — porta 3000
│   ├── app/
│   ├── components/
│   └── Dockerfile
├── .github/
│   └── workflows/          # CI/CD GitHub Actions
└── docker-compose.yml
```

---

## 📦 Deploy

Deploy automático via GitHub Actions em push para `main`:
- Build das imagens Docker
- Deploy via SSH na VPS
- `docker compose up -d` com zero downtime

---

## 👨‍💻 Autor

Feito por **Gustavo Ribeiro**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/devgustavor)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://devgustavor.com.br)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/devGustavoR)
