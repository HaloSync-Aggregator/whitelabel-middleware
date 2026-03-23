---
name: whitelabel-middleware-init
description: >
  Initialize the entire PolarHub NestJS middleware from scratch.
  Creates 34 TypeScript source files across 7 phases: infrastructure,
  types/utils, HTTP client, service layer, DTOs, controllers, and module setup.
  Use when: /whitelabel-middleware-init, "init middleware", "미들웨어 초기화",
  "처음부터 구현", "scaffold middleware", "generate all source files".
---

# Whitelabel Middleware Init

Generate the complete PolarHub NestJS middleware from scratch. This skill creates **34 TypeScript source files** across 7 phases, resulting in a fully functional middleware with:

- 10 PolarHub NDC API endpoints
- HMAC-SHA512 authentication
- camelCase → PascalCase transformation
- Swagger API documentation
- Global error handling with pass-through

## Prerequisites

Before running this skill, ensure:

1. **Dependencies installed**: Run `npm install` (check `node_modules/` exists)
2. **Environment configured**: `.env` file exists with at minimum:
   - `POLARHUB_API_BASE_URL`
   - `POLARHUB_TENANT_ID`
   - `POLARHUB_API_SECRET`
   - `POLARHUB_AGENCY_CONTACT_ID`
3. **Empty src/**: If `src/` already has files, back them up first

Verify prerequisites:
```bash
test -d node_modules && echo "✓ node_modules" || echo "✗ Run npm install"
test -f .env && echo "✓ .env" || echo "✗ Copy .env.example to .env"
```

## Phase Overview

| Phase | Name | Files | Key Components |
|-------|------|-------|----------------|
| 1 | Infrastructure Foundation | 4 | main.ts, app.module.ts, health controller, config |
| 2 | Types & Utilities | 4 | TypeScript interfaces, auth, error-handler, logger |
| 3 | HTTP Client & Filter | 2 | PolarHubClient, PolarHubExceptionFilter |
| 4 | Service Layer | 1 | polarhub.service.ts (~1,797 lines) |
| 5 | DTOs | 12 | common.dto + 10 API DTOs + barrel export |
| 6 | Controllers | 9 | 8 controllers + barrel export |
| 7 | Module & Verification | 2 | polarhub.module.ts, index.ts + build verify |
| **Total** | | **34** | |

## Execution Instructions

Execute each phase sequentially. For each phase:
1. Read the corresponding reference file
2. Create each file using the Write tool with EXACT code from the reference
3. Report progress to the user

### Phase 1: Infrastructure Foundation (4 files)

Read the reference file and create all files listed:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-1-infra.md
```

Create directories first:
```bash
mkdir -p src/config
```

Create these files with EXACT content from the reference:
1. `src/config/polarhub.config.ts`
2. `src/health.controller.ts`
3. `src/app.module.ts`
4. `src/main.ts`

Report: "📦 Phase 1/7 완료 - Infrastructure Foundation (4 files)"

### Phase 2: Types & Utilities (4 files)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-2-types-utils.md
```

Create directories first:
```bash
mkdir -p src/lib/polarhub/types src/lib/polarhub/utils
```

Create these files:
5. `src/lib/polarhub/types/index.ts`
6. `src/lib/polarhub/utils/error-handler.ts`
7. `src/lib/polarhub/utils/auth.ts`
8. `src/lib/polarhub/utils/logger.ts`

Report: "📦 Phase 2/7 완료 - Types & Utilities (4 files)"

### Phase 3: HTTP Client & Exception Filter (2 files)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-3-client-filter.md
```

Create directories first:
```bash
mkdir -p src/lib/polarhub/filters
```

Create these files:
9. `src/lib/polarhub/filters/polarhub-exception.filter.ts`
10. `src/lib/polarhub/client.ts`

Report: "📦 Phase 3/7 완료 - HTTP Client & Exception Filter (2 files)"

### Phase 4: Service Layer (1 file)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-4-service.md
```

Create this file (~1,797 lines - largest file in the project):
11. `src/lib/polarhub/polarhub.service.ts`

Report: "📦 Phase 4/7 완료 - Service Layer (1 file, ~1,797 lines)"

### Phase 5: DTOs (12 files)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-5-dtos.md
```

Create directory first:
```bash
mkdir -p src/lib/polarhub/dto
```

Create these files:
12. `src/lib/polarhub/dto/common.dto.ts`
13. `src/lib/polarhub/dto/air-shopping.dto.ts`
14. `src/lib/polarhub/dto/offer-price.dto.ts`
15. `src/lib/polarhub/dto/order-create.dto.ts`
16. `src/lib/polarhub/dto/order-retrieve.dto.ts`
17. `src/lib/polarhub/dto/order-cancel.dto.ts`
18. `src/lib/polarhub/dto/order-change.dto.ts`
19. `src/lib/polarhub/dto/order-quote.dto.ts`
20. `src/lib/polarhub/dto/order-reshop.dto.ts`
21. `src/lib/polarhub/dto/seat-availability.dto.ts`
22. `src/lib/polarhub/dto/service-list.dto.ts`
23. `src/lib/polarhub/dto/index.ts`

Report: "📦 Phase 5/7 완료 - DTOs (12 files)"

### Phase 6: Controllers (9 files)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-6-controllers.md
```

Create directory first:
```bash
mkdir -p src/lib/polarhub/controllers
```

Create these files:
24. `src/lib/polarhub/controllers/air-shopping.controller.ts`
25. `src/lib/polarhub/controllers/offer-price.controller.ts`
26. `src/lib/polarhub/controllers/order.controller.ts`
27. `src/lib/polarhub/controllers/order-change.controller.ts`
28. `src/lib/polarhub/controllers/order-quote.controller.ts`
29. `src/lib/polarhub/controllers/order-reshop.controller.ts`
30. `src/lib/polarhub/controllers/seat-availability.controller.ts`
31. `src/lib/polarhub/controllers/service-list.controller.ts`
32. `src/lib/polarhub/controllers/index.ts`

Report: "📦 Phase 6/7 완료 - Controllers (9 files)"

### Phase 7: Module & Verification (2 files)

Read the reference file:
```
Read .claude/skills/whitelabel-middleware-init/references/phase-7-module-verify.md
```

Create these files:
33. `src/lib/polarhub/polarhub.module.ts`
34. `src/lib/polarhub/index.ts`

Report: "📦 Phase 7/7 완료 - Module & Verification (2 files)"

## Build Verification

After all 7 phases, run verification:

```bash
# 1. Compile check
npm run build
```
Expected: 0 compile errors

```bash
# 2. Start server
npm run start:dev &
sleep 3

# 3. Health check
curl http://localhost:3000/middleware/health

# 4. Stop server
kill %1
```
Expected: `{"status":"ok","timestamp":"..."}`

Also verify Swagger UI is accessible at `http://localhost:3000/middleware`.

## Code Block Delimiter

Reference files use **4-backtick fences** (`` ```` ``) to wrap source code, NOT the standard 3-backtick.
This prevents confusion with 3-backtick code blocks inside JSDoc comments (e.g., ```json examples in DTO files).

When extracting code from references:
- Look for ```` ````typescript ```` as the opening delimiter
- Look for ```` ```````` as the closing delimiter
- IGNORE any 3-backtick ``` blocks inside — they are part of the source code (JSDoc comments)

## Critical Rules Checklist

1. **EXACT copy**: All code must be copied EXACTLY from reference files — no modifications
2. **Write tool**: Use Write tool (not Edit) since files don't exist yet
3. **Directories**: Create parent directories with `mkdir -p` before writing files
4. **TransactionID**: Do NOT generate TransactionIDs — they come from FE
5. **ContactInfoRefID**: Always force-injected from `POLARHUB_AGENCY_CONTACT_ID` env var
6. **POST only**: All PolarHub APIs use POST method (except health check GET)
7. **Case transform**: camelCase (FE) → PascalCase (PolarHub) transformation only
8. **No hardcoding**: Never hardcode business data values (country codes, labels, etc.)
9. **Pass-through**: Transform format only, never modify data values
10. **Auth headers**: FE pass-through priority, environment variable fallback
11. **DTO decorators**: Nested DTOs must use both `@ValidateNested()` and `@Type()` decorators
12. **Error handling**: PolarHubExceptionFilter handles errors globally — no manual try/catch needed

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Import errors | Missing files from earlier phases | Re-run the failed phase |
| Auth failure (50102) | Missing .env variables | Check POLARHUB_TENANT_ID, POLARHUB_API_SECRET |
| Port in use | Another process on port 3000 | Change PORT in .env or kill the process |
| Build errors | TypeScript version mismatch | Run `npm install` again |
| Validation errors | DTO decorator issues | Ensure @ValidateNested + @Type on nested objects |

## Completion Message

After successful verification, display:

```
✅ 완료! 34개 파일 생성, 10개 API 엔드포인트 준비됨.

다음 단계:
1. .env 파일에 PolarHub 테넌트 정보가 올바른지 확인
2. Swagger UI에서 API 테스트: http://localhost:3000/middleware
3. Health check: curl http://localhost:3000/middleware/health
```
