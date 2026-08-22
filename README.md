# CanaryGate

CanaryGate é um monorepo com:

- `apps/web`: dashboard Next.js
- `apps/api`: API Fastify + SSE para o SDK
- `packages/database`: schema e client Drizzle/Postgres
- `packages/logger`: logger compartilhado para API e web
- `packages/redis`: conexão Redis compartilhada
- `packages/messaging-utils`: contratos compartilhados de pub/sub, filas e utilitários de mensageria
- `sdks/js`: SDK JavaScript com snapshot + stream SSE

## Requisitos locais

- Node.js 18+
- pnpm 9+
- PostgreSQL
- Redis

## Variáveis de ambiente

Referência canônica de todas as variáveis lidas pelo projeto. As obrigatórias em produção são marcadas com **(required)**; as demais são opcionais ou de desenvolvimento.

```env
# ============================================================
# DATABASE (Postgres — Neon em produção)
# ============================================================
# (required) Connection string do Postgres usada pela API e pelo web (better-auth).
DATABASE_URL=postgresql://user:password@localhost:5432/canarygate

# ============================================================
# REDIS (Upstash em produção)
# ============================================================
# (required em produção) URL do Redis. Em dev o fallback é redis://localhost:6379.
REDIS_URL=redis://localhost:6379

# ============================================================
# URLs públicas
# ============================================================
# (required) URL do dashboard (web). Origem principal do CORS e do trustedOrigins do auth.
WEB_URL=http://localhost:3000
# (required) URL da API. Base dos webhooks QStash em produção (/webhook).
API_URL=http://localhost:3001
# (required em produção) URL pública do web, inline no client (next-auth/better-auth client).
NEXT_PUBLIC_APP_URL=http://localhost:3000
# (optional) Origens extras liberadas no CORS, separadas por vírgula.
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3005
# (dev) URL do túnel ngrok usada como base dos webhooks QStash fora de produção.
# Quando ausente em dev, o código usa API_URL como fallback.
NGROK_URL=

# ============================================================
# AUTH (better-auth)
# ============================================================
# (required em produção) Secret do better-auth (mínimo 32 chars).
BETTER_AUTH_SECRET=
# (dev) true desativa o login. Nunca use em produção.
BYPASS_AUTH=

# ============================================================
# EMAIL (Resend)
# ============================================================
# (required em produção) API key do Resend.
RESEND_API_KEY=re_xxxx
# (optional) Remetente dos e-mails (OTP de login e convites).
# Fallback: CanaryGate <onboarding@resend.dev>
RESEND_SENDER=

# ============================================================
# QSTASH (jobs de schedule e auto-rollout)
# ============================================================
# (required em produção) Token de publish do QStash.
QSTASH_TOKEN=
# (required em produção) Chaves de verificação de assinatura do webhook /webhook.
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# ============================================================
# SERVIDORES
# ============================================================
# (optional) Porta da API. Default: 3001.
PORT=3001
# (optional) Nível de log do @canarygate/logger (info, warn, error, debug).
LOG_LEVEL=info

# ============================================================
# CACHE / SSE (opcional)
# ============================================================
# (optional) Tier de cache Redis do web (memory | redis | both). Default: memory.
CACHE_REDIS_TIER=memory
# (optional) Limite de conexões SSE por IP na API. Default: 10.
SSE_MAX_CONNECTIONS_PER_IP=10
# (optional) Limite de conexões SSE por API key na API. Default: 25.
SSE_MAX_CONNECTIONS_PER_API_KEY=25
```

`REDIS_URL` é obrigatória para a API em produção. Em desenvolvimento, o fallback padrão é `redis://localhost:6379`.

`CORS_ALLOWED_ORIGINS` é opcional e aceita uma lista separada por vírgulas com origens extras liberadas no CORS da API. `WEB_URL` continua sendo a origem principal do dashboard e do auth.

A API falha no boot se faltarem `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` ou `QSTASH_NEXT_SIGNING_KEY` (necessários para despachar e validar os jobs via webhook QStash).

## Desenvolvimento

Instale as dependências:

```sh
pnpm install
```

Suba o banco e aplique o schema:

```sh
pnpm --filter @canarygate/database db:push
```

Rode o monorepo em modo dev:

```sh
pnpm dev
```

## Docker Compose local

O compose local sobe `redis` e `api` em containers separados e reaproveita um PostgreSQL já exposto no host em `localhost:5432`.

Com a configuração padrão deste repo, ele aponta para:

```env
postgresql://postgres:postgres@host.docker.internal:5432/canarygate
```

Para subir os serviços com um comando:

```sh
docker compose up --build -d
```

Nao ha bind mount do repositorio nesses containers. Quando voce alterar codigo ou dependencias, rode `docker compose up --build` novamente para reconstruir a imagem da `api`.

Logs da API:

```sh
docker compose logs -f api
```

Se quiser ver o banco que já está fora do compose, use o log do container existente diretamente.

Se o banco estiver vazio, aplique o schema uma vez antes de usar a API:

```sh
pnpm --filter @canarygate/database db:push
```

Serviços locais esperados:

- `web`: `http://localhost:3000`
- `api`: `http://localhost:3001`
- `api docs`: `http://localhost:3001/docs`

## Runtime de background

- A API mantém as conexões SSE do SDK.
- Mudanças de flag são publicadas em Redis pub/sub segmentado por `projectId:environmentId`.
- A API assina os canais Redis e retransmite para os subscribers SSE locais.
- `schedule` e `auto-rollout` são despachados via QStash (webhook em `/webhook`) e processados diretamente pela API.
- O SDK trata snapshot + stream como dupla obrigatória e faz resync por `/sdk/flags` no reconnect.

## Build por serviço

```sh
pnpm --filter @canarygate/web build
pnpm --filter @canarygate/api build
pnpm --filter @canarygate/sdk/js build
```

## Documentação operacional

- `brainstorm/SETUP.md`
- `brainstorm/DEPLOY.md`
- `brainstorm/queues-pubsub-implementation-plan.md`
