# Backend Agent Reference

This file is a lightweight public-facing note for the optional backend-maintenance agent included with this repository.

The canonical agent definition lives at:

- `.claude/agents/polarhub-backend-developer.md`

Repository reality:

- Framework: NestJS
- Validation: class-validator and class-transformer
- API docs: `@nestjs/swagger`
- Transport/auth logic: `src/lib/polarhub/client.ts` and `src/lib/polarhub/utils/auth.ts`

This repository does not require the agent to run. The application source is already present under `src/`.
