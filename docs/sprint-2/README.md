# Sprint 2 — Full-stack Foundation

## Local startup

```sh
npm install
docker compose -f infra/docker-compose.yml up -d
npm run api
```

In another terminal:

```sh
npm run mobile
npm run ios
# or npm run android
```

API health is available at `http://localhost:3000/api/health` and Swagger at
`http://localhost:3000/api/docs`.

## Workspace map

- `apps/mobile` — preserved bare React Native app and native projects.
- `apps/api` — NestJS API, MongoDB connection, error envelope and Socket.IO.
- `packages/contracts` — shared Zod DTOs and domain primitives.
- `packages/api-client` — typed transport used by mobile clients.
- `packages/ui` — recording-matched design tokens.
- `infra` — local MongoDB replica set.

The counter/native voice prototype remains the active mobile screen until the
recording-matched application shell is implemented in Sprint 3.
