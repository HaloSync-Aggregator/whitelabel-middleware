# Whitelabel Middleware

[English](./README.md) | 한국어

PolarHub NDC API 연동을 위한 NestJS 기반 미들웨어 게이트웨이입니다. **Claude Code 에이전트가 전체 소스 코드를 자동 생성**합니다.

## 개요

항공 NDC API 연동은 복잡합니다. 12개 이상 항공사마다 인증 방식, 요청/응답 구조, 워크플로우가 다르고, HMAC-SHA512 서명, 필드 매핑, 에러 처리 등을 직접 구현하려면 수주에서 수개월이 걸립니다.

이 프로젝트는 Claude Code의 에이전트/스킬 시스템으로 **NDC 미들웨어를 몇 분 안에 자동 생성**합니다.

### 왜 미들웨어가 필요한가?

프론트엔드(브라우저)에서 PolarHub API를 직접 호출할 수 없는 이유가 있습니다:

- **인증 정보 보호**: HMAC 시크릿, Tenant ID 등 크리덴셜은 서버에서만 관리해야 합니다
- **요청 서명**: PolarHub API는 HMAC-SHA512 서명이 필요하며, 이를 브라우저에서 처리하면 시크릿이 노출됩니다
- **데이터 변환**: 프론트엔드(camelCase)와 PolarHub(PascalCase) 간의 형식 변환을 서버에서 처리합니다
- **에러 핸들링**: 항공사별 에러 코드를 프론트엔드가 이해할 수 있는 형식으로 통일합니다

### 이 미들웨어의 활용

생성된 미들웨어는 독립적인 NestJS 서버입니다. 다양한 방식으로 활용할 수 있습니다:

| 시나리오 | 설명 |
|:---------|:-----|
| **독립 배포** | Docker/PM2 등으로 별도 서버에 배포하여 프론트엔드의 백엔드로 사용 |
| **기존 서버에 통합** | 자사 OTA 백엔드에 모듈로 흡수 (NestJS Module import) |
| **커스터마이징** | 생성된 코드에 자사 비즈니스 로직 추가 (마일리지, 할인, 결제 연동 등) |
| **학습/참고용** | NDC API 연동 패턴을 이해하기 위한 레퍼런스로 활용 |

## 이 레포지토리의 구성

이 레포지토리는 두 가지를 포함합니다:

1. **생성된 샘플 애플리케이션** (`src/`) — 스킬로 생성된 34개 TypeScript 파일, 10개 API 엔드포인트가 포함된 실행 가능한 NestJS 서버
2. **코드 생성 시스템** (`.claude/`) — Claude Code에서 사용하는 에이전트, 스킬, 레퍼런스 파일

```
이 레포를 clone하면 바로 실행 가능한 미들웨어 서버를 얻습니다.
스킬 시스템을 사용하면 처음부터 새로 생성하거나 커스터마이징할 수 있습니다.
```

## 코드 생성 방식

### `/whitelabel-middleware-init` 스킬

Claude Code에서 이 스킬을 실행하면 7단계에 걸쳐 34개 파일을 자동 생성합니다:

| Phase | 생성 파일 | 내용 |
|:-----:|:---------:|:-----|
| 1 | 4개 | main.ts, app.module.ts, health.controller.ts, polarhub.config.ts |
| 2 | 4개 | TypeScript 타입, HMAC 인증, 에러 핸들러, 로거 |
| 3 | 2개 | HTTP 클라이언트, 글로벌 예외 필터 |
| 4 | 1개 | polarhub.service.ts (~1,800줄, 핵심 변환 로직) |
| 5 | 12개 | common.dto + 10개 API DTO + barrel export |
| 6 | 9개 | 8개 API 컨트롤러 + barrel export |
| 7 | 2개 | polarhub.module.ts, index.ts + 빌드 검증 |

```bash
# Claude Code에서 실행
/whitelabel-middleware-init
```

각 phase의 코드는 `.claude/skills/whitelabel-middleware-init/references/phase-{1~7}-*.md`에 정의되어 있습니다.

### `polarhub-backend-developer` 에이전트

코드 생성의 핵심 실행 주체입니다. Claude Code에서 PolarHub API 관련 작업을 요청하면 이 에이전트가 자동으로 활성화되어 아래 스킬들을 참조하며 코드를 구현합니다.

- NestJS 컨트롤러, DTO, 서비스 매핑 구현
- HMAC-SHA512 인증 처리
- camelCase(FE) → PascalCase(PolarHub) 변환
- 에러 핸들링 및 Swagger 문서화

### 스킬 목록

| 스킬 | 목적 |
|:-----|:-----|
| `whitelabel-middleware-init` | 전체 소스 코드 생성 (34개 파일, 7 phase) |
| `polarhub-api-routes` | 10개 API 라우트 구현 패턴 + 17개 워크플로우 |
| `polarhub-hmac-auth` | HMAC-SHA512 인증 구현 |
| `polarhub-service-patterns` | 서비스 변환 패턴 (camelCase → PascalCase) |
| `polarhub-dto-templates` | NestJS DTO 템플릿 (class-validator, Swagger) |
| `polarhub-controller-templates` | 컨트롤러 템플릿 (Swagger, 로깅) |
| `polarhub-types` | TypeScript 타입 정의 (40+ 인터페이스) |
| `polarhub-error-handling` | 에러 핸들링 패턴 (BA 50202 특수 케이스 포함) |
| `polarhub-client` | HTTP 클라이언트 구현 (재시도, 타임아웃) |
| `polarhub-testing` | 테스트 전략 (HMAC, TransactionID, Zod) |
| `polarhub-airline-rules` | 항공사별 규칙 (결제, 여권, Trip Type) |
| `polarhub-transaction-id` | TransactionID 관리 원칙 |
| `polarhub-zod-schemas` | Zod 런타임 검증 스키마 |
| `polarhub-best-practices` | 구현 베스트 프랙티스 |

### 레퍼런스 자료

`.claude/` 하위에 포함된 참조 자료:

- `spec/polarhub.openapi.json` — PolarHub OpenAPI 스펙 스냅샷
- `docs/api-schemas/*.json` — API별 요청 스키마
- `asset/carrier_support_matrix.yaml` — 항공사별 지원 매트릭스
- `.claude/skills/*/references/` — 각 스킬의 상세 구현 가이드

## 핵심 원칙

- **Pass-through**: 데이터 형식만 변환하고 비즈니스 데이터는 수정하지 않습니다
- **하드코딩 금지**: 승객/연락처 등 비즈니스 데이터를 코드에 직접 넣지 않습니다
- **TransactionID**: 프론트엔드에서 생성하여 전달받은 값을 그대로 사용합니다
- **여행사 정보 (Sender / ContactInfo)**: 여행사 사이트 코드, 연락처 등은 FE에서 전달받은 값을 우선 사용하고, 미전달 시 환경변수가 있으면 자동 주입하며, 환경변수도 없으면 해당 필드를 포함하지 않습니다

## 사전 요구사항

- **Node.js** 20 이상
- **PolarHub 접속 정보** (API 호출용):
  - `POLARHUB_API_BASE_URL`, `POLARHUB_TENANT_ID`, `POLARHUB_API_SECRET`
  - PolarHub 관리자 또는 플랫폼 운영자에게 문의
- **AI 도구** (코드 생성 시): [Claude Code](https://claude.ai/code) Max 플랜 이상

## 빠른 시작

### 1. 설치

```bash
git clone https://github.com/HaloSync-Aggregator/whitelabel-middleware.git
cd whitelabel-middleware
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일의 placeholder를 실제 값으로 채웁니다:

```env
POLARHUB_API_BASE_URL=https://your-tenant.sandbox.halo-platform.net
POLARHUB_TENANT_ID=YOUR_TENANT_ID
POLARHUB_API_SECRET=your_base64_encoded_secret

POLARHUB_AGENCY_EMAIL=your-agency@example.com
POLARHUB_AGENCY_PHONE_COUNTRY_CODE=82
POLARHUB_AGENCY_PHONE_NUMBER=0212345678
POLARHUB_AGENCY_POSTAL_STREET=Your Street Address
POLARHUB_AGENCY_POSTAL_CODE=04534
POLARHUB_AGENCY_POSTAL_CITY=Seoul
POLARHUB_AGENCY_POSTAL_COUNTRY=KR
```

### 3. 서버 실행

```bash
npm run start:dev
```

프로덕션 빌드:

```bash
npm run build
npm run start:prod
```

기본 로컬 URL:

- Swagger: `http://localhost:3000/middleware`
- Health check: `GET http://localhost:3000/middleware/health`
- API 기본 경로: `http://localhost:3000/middleware/polarhub`

### 4. Docker 실행

```bash
docker build -t whitelabel-middleware .
docker run -p 3000:3000 --env-file .env whitelabel-middleware
```

## 프로젝트 구조

```text
src/                          # 생성된 NestJS 애플리케이션 (34개 파일)
├── main.ts
├── app.module.ts
├── health.controller.ts
├── config/
│   └── polarhub.config.ts
└── lib/polarhub/
    ├── polarhub.module.ts
    ├── polarhub.service.ts   # 핵심 변환 로직 (~1,800줄)
    ├── client.ts             # PolarHub HTTP 클라이언트
    ├── controllers/          # 8개 API 컨트롤러
    ├── dto/                  # 12개 DTO (요청/응답 검증)
    ├── filters/              # 글로벌 예외 필터
    ├── types/                # TypeScript 타입 정의
    └── utils/                # 인증, 로거, 에러 핸들러

.claude/                      # Claude Code 에이전트/스킬 시스템
├── agents/
│   └── polarhub-backend-developer.md  # 핵심 코드 생성 에이전트
├── skills/
│   ├── whitelabel-middleware-init/    # 전체 코드 생성 스킬
│   │   └── references/               # phase 1~7 레퍼런스
│   ├── polarhub-api-routes/          # API 라우트 패턴
│   ├── polarhub-hmac-auth/           # HMAC 인증
│   └── ...                           # 14개 스킬
└── CLAUDE.md                 # 프로젝트 컨텍스트

spec/                         # OpenAPI 스펙 및 스키마 참조
docs/                         # API 스키마, 아키텍처 문서
```

## 환경변수

### 필수 (API 호출용)

| 변수 | 설명 |
|---|---|
| `POLARHUB_API_BASE_URL` | PolarHub API 기본 URL |
| `POLARHUB_TENANT_ID` | 인증 및 테넌트 헤더에 사용되는 테넌트 식별자 |
| `POLARHUB_API_SECRET` | Base64 인코딩된 HMAC 시크릿 |

### 여행사 정보 (선택)

모든 여행사 관련 환경변수는 **FE 값 우선 → 환경변수 fallback → 미전달** 원칙을 따릅니다.

**Sender 관련**

| 변수 | 기본값 | 설명 |
|---|---|---|
| `SALES_BRANCH_ID` | 미설정 | 사이트 코드. FE가 `sender.travelAgency.siteCode`를 보내면 무시됨. FE 미전달 + 미설정 시 생략 |
| `POLARHUB_AGENCY_NAME` | 미설정 | 여행사명. FE가 `sender.travelAgency.agencyName`을 보내면 무시됨 |
| `POLARHUB_AGENCY_CONTACT_ID` | 미설정 | 연락처 정보 ID (예: `CTC_TA1`). FE가 `sender.travelAgency.contactInfoRefId`를 보내면 무시됨. OrderCreate 시 여행사 ContactInfo 자동 구성에도 사용 |

**여행사 연락처 상세 (OrderCreate 시 자동 구성용)**

FE가 `contactInfoList`에 여행사 연락처를 포함하면 아래 환경변수는 무시됩니다.
FE가 생략하고 `POLARHUB_AGENCY_CONTACT_ID`가 설정되어 있으면 아래 정보로 여행사 연락처를 자동 구성합니다.
둘 다 없으면 여행사 연락처 없이 PolarHub에 전달합니다.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `POLARHUB_AGENCY_EMAIL` | 미설정 | 여행사 이메일 주소 |
| `POLARHUB_AGENCY_PHONE_COUNTRY_CODE` | 미설정 | 전화 국가 코드 |
| `POLARHUB_AGENCY_PHONE_NUMBER` | 미설정 | 여행사 전화번호 |
| `POLARHUB_AGENCY_POSTAL_STREET` | 미설정 | 우편 주소 (도로명) |
| `POLARHUB_AGENCY_POSTAL_CODE` | 미설정 | 우편번호 |
| `POLARHUB_AGENCY_POSTAL_CITY` | 미설정 | 도시명 |
| `POLARHUB_AGENCY_POSTAL_COUNTRY` | 미설정 | 국가 코드 (예: `KR`) |

### 서버 및 기타

| 변수 | 기본값 | 설명 |
|---|---|---|
| `POLARHUB_TIMEOUT_MS` | `30000` | 요청 타임아웃 (밀리초) |
| `POLARHUB_RETRY_COUNT` | `3` | 네트워크 재시도 횟수 |
| `PORT` | `3000` | 로컬 서버 포트 |
| `CORS_ORIGIN` | `*` | CORS 출처 |
| `NODE_ENV` | `development` | 로깅 동작 제어 |

## API 엔드포인트

| 엔드포인트 | 설명 |
|---|---|
| `POST /middleware/polarhub/air-shopping` | 항공편 검색 |
| `POST /middleware/polarhub/offer-price` | 운임 조회 |
| `POST /middleware/polarhub/order` | 예약 생성 |
| `POST /middleware/polarhub/order/retrieve` | 예약 조회 |
| `POST /middleware/polarhub/order/cancel` | 예약 취소 |
| `POST /middleware/polarhub/order-change` | 예약 변경 |
| `POST /middleware/polarhub/order-reshop` | 리숍 / 환불 견적 |
| `POST /middleware/polarhub/order-quote` | 변경 견적 |
| `POST /middleware/polarhub/seat-availability` | 좌석 조회 |
| `POST /middleware/polarhub/service-list` | 부가 서비스 조회 |
| `GET /middleware/health` | 헬스 체크 |

모든 PolarHub 비즈니스 API는 `POST` 메서드를 사용합니다.

## 관련 프로젝트

| 프로젝트 | 설명 |
|:---------|:-----|
| [whitelabel-client](https://github.com/HaloSync-Aggregator/whitelabel-client) | 멀티테넌트 항공 예약 SPA (이 미들웨어를 백엔드로 사용) |

## 로깅 및 개인정보

비프로덕션 환경에서는 요청/응답 페이로드가 `logs/` 디렉토리에 기록됩니다.

기록 내용에 승객 이름, 연락처, 여권 정보, 결제 관련 데이터 등 민감한 정보가 포함될 수 있습니다.

권장사항:

- `logs/`를 커밋하지 마세요
- 실제 승객 데이터로 개발 로깅을 사용하지 마세요
- 배포 전 `NODE_ENV=production`으로 전환하세요

## 라이선스

MIT

---

Built with [Claude Code](https://claude.ai/code)
