# Generated Code Structure

This repository already includes the middleware source code. The main application structure is:

```text
src/lib/polarhub/
├── client.ts
├── polarhub.module.ts
├── polarhub.service.ts
├── controllers/
├── dto/
├── filters/
├── types/
└── utils/
```

High-level responsibilities:

- `controllers/`: HTTP route handlers and Swagger metadata
- `dto/`: NestJS DTOs and validation decorators
- `polarhub.service.ts`: request transformation and workflow mapping
- `client.ts`: outbound HTTP transport, auth headers, retries, logging
- `filters/`: PolarHub error pass-through
- `utils/`: auth, logging, and error helpers

Supporting reference assets:

- `spec/`: bundled schema and index artifacts
- `docs/api-schemas/`: static schema snapshots

This document intentionally avoids implementation metrics or release claims and exists only as a lightweight orientation note.
