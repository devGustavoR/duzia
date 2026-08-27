<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<h1 align="center">💰 Duzia</h1>

<p align="center">
  Plataforma de controle financeiro pessoal — backend NestJS + frontend Next.js em monorepo.
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/devGustavoR/duzia?style=flat-square" />
  <img src="https://img.shields.io/github/languages/top/devGustavoR/duzia?style=flat-square" />
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-orange?style=flat-square" />
</p>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Como rodar](#-como-rodar)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Autor](#-autor)

---

## 💡 Sobre

Duzia é uma plataforma pessoal de controle financeiro que centraliza receitas, despesas e relatórios em um só lugar. Construída como projeto de estudo e uso pessoal, com foco em boas práticas de arquitetura backend e stack moderna no frontend.

---

## 📸 Preview

![Dashboard Duzia](./docs/dashboard.png)

---

## ✨ Funcionalidades

- 🔐 Autenticação com JWT + refresh token
- 💸 Cadastro de receitas e despesas por categoria
- 📊 Relatórios mensais: saldo, total por categoria e evolução diária
- ⚠️ Alertas de limite de gasto por categoria
- 🗑️ Soft delete em transações
- 📄 Documentação automática com Swagger (`/api/docs`)
- 🚀 Deploy automático via GitHub Actions

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11 + TypeScript |
| ORM | TypeORM |
| Banco de dados | PostgreSQL (Supabase) |
| Frontend | Next.js (App Router) + React 19 |
| Containerização | Docker + Docker Compose |
| CI/CD | GitHub Actions |

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

### Rodando com Docker

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
├── back-end/          # API NestJS — porta 3001
│   ├── src/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── reports/
│   │   └── common/
│   └── Dockerfile
├── front-end/         # Next.js App Router — porta 3000
│   ├── app/
│   ├── components/
│   └── Dockerfile
├── .github/workflows/ # CI/CD GitHub Actions
└── docker-compose.yml
```

---

## 📦 Deploy

Deploy automático via GitHub Actions em push para `main`:
- Build das imagens Docker
- `docker compose up -d` na VPS via SSH

---

## 👨‍💻 Autor

Feito por **Gustavo Ribeiro**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/devgustavor)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://devgustavor.com.br)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/devGustavoR)
