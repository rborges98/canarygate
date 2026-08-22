# CanaryGate

Feature flags com gradual rollout, agendamento, rollback instantâneo e atualização em tempo real via SSE — sem YAML e sem complexidade.

## Estrutura do monorepo

| Pacote                   | Descrição                                        |
| ------------------------ | ------------------------------------------------ |
| `apps/web`               | Dashboard Next.js (App Router)                   |
| `apps/api`               | API Fastify + SSE que serve os SDKs              |
| `packages/database`      | Schema e client Drizzle/Postgres                 |
| `packages/redis`         | Conexão Redis compartilhada                      |
| `packages/logger`        | Logger compartilhado                             |
| `packages/messaging-utils` | Contratos de pub/sub, filas e mensageria       |
| `sdks/js`                | SDK JavaScript/TypeScript (snapshot + stream)    |

## Quick start (Docker)

Não precisa de nada instalado além do Docker. Um comando sobe Postgres, Redis, API e web — e aplica as migrações automaticamente:

```sh
docker compose up --build -d
```

| Serviço              | URL                        |
| -------------------- | -------------------------- |
| Web (dashboard)      | http://localhost:3000      |
| API                  | http://localhost:3001      |
| Swagger da API       | http://localhost:3001/swagger |

> Com a chave placeholder do Resend o app sobe, mas nenhum e-mail é enviado. Para testar o login (OTP) de verdade, crie um `.env` na raiz com `RESEND_API_KEY=re_sua_chave` — o compose lê e repassa automaticamente.

Sem bind mount: depois de alterar código ou dependências, rode `docker compose up --build` de novo.

## Desenvolvimento manual

Requisitos: Node.js 18+, pnpm 9+, PostgreSQL e Redis rodando localmente.

```sh
pnpm install
pnpm --filter @canarygate/database db:push   # cria o schema no banco
pnpm dev                                     # web :3000 + api :3001
```

## Variáveis de ambiente

Referência canônica. **(req)** = obrigatória em produção; as demais são opcionais ou só de dev.

### Banco, cache e servidor

| Variável                          | Usado por   | Default em dev              | Descrição                                          |
| --------------------------------- | ----------- | --------------------------- | -------------------------------------------------- |
| `DATABASE_URL` **(req)**          | api, web    | —                           | Connection string do Postgres (Neon em produção)   |
| `REDIS_URL` **(req)**             | api, web    | `redis://localhost:6379`    | Redis (Upstash em produção)                        |
| `PORT`                            | api         | `3001`                      | Porta da API                                       |
| `LOG_LEVEL`                       | ambos       | `info`                      | `info` \| `warn` \| `error` \| `debug`             |
| `CACHE_REDIS_TIER`                | web         | `memory`                    | Tier de cache Redis: `memory` \| `redis` \| `both` |
| `SSE_MAX_CONNECTIONS_PER_IP`      | api         | `10`                        | Limite de conexões SSE por IP                      |
| `SSE_MAX_CONNECTIONS_PER_API_KEY` | api         | `25`                        | Limite de conexões SSE por API key                 |

### URLs e CORS

| Variável                     | Usado por | Default em dev            | Descrição                                              |
| ---------------------------- | --------- | ------------------------- | ------------------------------------------------------ |
| `WEB_URL` **(req)**          | api, web  | `http://localhost:3000`   | URL do dashboard; origem principal do CORS e do auth   |
| `API_URL` **(req)**          | api, web  | `http://localhost:3001`   | URL da API; base dos webhooks QStash em produção       |
| `NEXT_PUBLIC_APP_URL` **(req)** | web    | `http://localhost:3000`   | URL pública do web, inline no client do better-auth    |
| `CORS_ALLOWED_ORIGINS`       | api       | —                         | Origens extras liberadas, separadas por vírgula        |
| `NGROK_URL`                  | api       | fallback: `API_URL`       | Túnel ngrok usado como base dos webhooks fora de produção |

### Auth e e-mail

| Variável                    | Usado por | Descrição                                             |
| --------------------------- | --------- | ----------------------------------------------------- |
| `BETTER_AUTH_SECRET` **(req)** | ambos  | Secret do better-auth (mínimo 32 chars)               |
| `RESEND_API_KEY` **(req)**  | web       | API key do Resend; fallback dev: `onboarding@resend.dev` |
| `RESEND_SENDER`             | web       | Remetente dos e-mails (OTP e convites)                |

### QStash (jobs agendados)

| Variável                          | Usado por | Descrição                                    |
| --------------------------------- | --------- | -------------------------------------------- |
| `QSTASH_TOKEN` **(req)**          | api       | Token de publish do QStash                   |
| `QSTASH_CURRENT_SIGNING_KEY` **(req)** | api  | Verificação de assinatura do webhook `/webhook` |
| `QSTASH_NEXT_SIGNING_KEY` **(req)**    | api  | Rotação de chave de assinatura               |

> A API **não sobe** sem as três variáveis do QStash. Em dev com Docker, placeholders já são fornecidos pelo compose.

## Como funciona em runtime

- A API mantém as conexões SSE dos SDKs abertas.
- Mudanças de flag são publicadas em Redis pub/sub segmentado por `projectId:environmentId`.
- Cada instância da API assina os canais relevantes e retransmite para seus subscribers SSE locais.
- `schedule` e `auto-rollout` são despachados via QStash (webhook `/webhook`) e processados pela API.
- O SDK trata snapshot + stream como dupla obrigatória e faz resync por `/sdk/flags` ao reconectar.

## Scripts

| Comando                                | Faz o quê                              |
| -------------------------------------- | -------------------------------------- |
| `pnpm dev`                             | Monorepo em modo watch                 |
| `pnpm build`                           | Build de todos os apps/pacotes (turbo) |
| `pnpm test`                            | Testes (vitest workspace)              |
| `pnpm check-types`                     | TypeScript em todo o monorepo          |
| `pnpm lint`                            | Lint                                   |
| `pnpm --filter @canarygate/database db:generate` | Gera migrações Drizzle       |
| `pnpm --filter @canarygate/database db:migrate`  | Aplica migrações             |
| `pnpm --filter @canarygate/database db:studio`   | Drizzle Studio               |

## Documentação operacional

- [`brainstorm/SETUP.md`](brainstorm/SETUP.md)
- [`brainstorm/DEPLOY.md`](brainstorm/DEPLOY.md)
- [`brainstorm/queues-pubsub-implementation-plan.md`](brainstorm/queues-pubsub-implementation-plan.md)

## Licença

MIT — veja [`sdks/js/LICENSE`](sdks/js/LICENSE).
