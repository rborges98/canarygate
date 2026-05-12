# CanaryGate

CanaryGate é um monorepo com:

- `apps/web`: dashboard Next.js
- `apps/api`: API Fastify + SSE para o SDK
- `apps/worker`: worker BullMQ para `schedule` e `auto-rollout`
- `packages/database`: schema e client Drizzle/Postgres
- `packages/logger`: logger compartilhado para API, web e worker
- `packages/redis`: conexão Redis compartilhada
- `packages/messaging-utils`: contratos compartilhados de pub/sub, filas e utilitários de mensageria
- `sdks/js`: SDK JavaScript com snapshot + stream SSE

## Requisitos locais

- Node.js 18+
- pnpm 9+
- PostgreSQL
- Redis

## Variáveis principais

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/canarygate
REDIS_URL=redis://localhost:6379
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3005
BETTER_AUTH_SECRET=
```

`REDIS_URL` é obrigatória para API e worker em produção. Em desenvolvimento, o fallback padrão é `redis://localhost:6379`.

`CORS_ALLOWED_ORIGINS` é opcional e aceita uma lista separada por vírgulas com origens extras liberadas no CORS da API. `WEB_URL` continua sendo a origem principal do dashboard e do auth.

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

O compose local sobe `redis`, `api` e `worker` em containers separados e reaproveita um PostgreSQL já exposto no host em `localhost:5432`.

Com a configuração padrão deste repo, ele aponta para:

```env
postgresql://postgres:postgres@host.docker.internal:5432/canarygate
```

Para subir os serviços com um comando:

```sh
docker compose up --build -d
```

Nao ha bind mount do repositorio nesses containers. Quando voce alterar codigo ou dependencias, rode `docker compose up --build` novamente para reconstruir as imagens de `api` e `worker`.

Logs da API:

```sh
docker compose logs -f api
```

Logs do worker:

```sh
docker compose logs -f worker
```

Se quiser ver o banco que já está fora do compose, use o log do container existente diretamente.

Se o banco estiver vazio, aplique o schema uma vez antes de usar a API/worker:

```sh
pnpm --filter @canarygate/database db:push
```

Serviços locais esperados:

- `web`: `http://localhost:3000`
- `api`: `http://localhost:3001`
- `api docs`: `http://localhost:3001/docs`
- `worker`: processo background sem porta pública

## Runtime de background

- A API mantém as conexões SSE do SDK.
- Mudanças de flag são publicadas em Redis pub/sub segmentado por `projectId:environmentId`.
- A API assina os canais Redis e retransmite para os subscribers SSE locais.
- `schedule` e `auto-rollout` entram em filas BullMQ e são processados pelo `worker`.
- O SDK trata snapshot + stream como dupla obrigatória e faz resync por `/sdk/flags` no reconnect.

## Build por serviço

```sh
pnpm --filter @canarygate/web build
pnpm --filter @canarygate/api build
pnpm --filter @canarygate/worker build
pnpm --filter @canarygate/sdk build
```

## Documentação operacional

- `brainstorm/SETUP.md`
- `brainstorm/DEPLOY.md`
- `brainstorm/queues-pubsub-implementation-plan.md`
