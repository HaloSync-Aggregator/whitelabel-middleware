# Whitelabel Middleware

> [English](README.en.md)

PolarHub NDC API를 위한 NestJS 기반 미들웨어 게이트웨이입니다.

프론트엔드(camelCase) 요청을 받아 PolarHub(PascalCase) 형식으로 변환하고, HMAC-SHA512 인증을 처리하여 PolarHub API에 전달합니다.

## 핵심 원칙

- **Pass-through**: 데이터 형식만 변환하고 비즈니스 데이터는 수정하지 않습니다
- **하드코딩 금지**: 승객/연락처 등 비즈니스 데이터를 코드에 직접 넣지 않습니다
- **TransactionID**: 프론트엔드에서 생성하여 전달받은 값을 그대로 사용합니다
- **ContactInfoRefID**: 환경변수(`POLARHUB_AGENCY_CONTACT_ID`)에서 항상 자동 주입됩니다

## 사전 요구사항

실제 API 호출을 위해서는 PolarHub 접속 정보가 필요합니다:

- `POLARHUB_API_BASE_URL`
- `POLARHUB_TENANT_ID`
- `POLARHUB_API_SECRET`
- `POLARHUB_AGENCY_CONTACT_ID`

이 정보는 PolarHub 관리자 또는 플랫폼 운영자에게 문의하세요.

## 빠른 시작

### 1. 설치

```bash
git clone <your-repo-url>
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

POLARHUB_AGENCY_CONTACT_ID=CTC_TA1
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
src/
├── main.ts
├── app.module.ts
├── health.controller.ts
├── config/
│   └── polarhub.config.ts
└── lib/polarhub/
    ├── polarhub.module.ts
    ├── polarhub.service.ts
    ├── client.ts
    ├── controllers/
    ├── dto/
    ├── filters/
    ├── types/
    └── utils/

spec/
├── polarhub.openapi.json
├── schema-llms-index.json
├── schema-ts-index.json
└── llms-api-mapping.json

docs/
├── api-schemas/
└── architecture/
```

## 환경변수

### 필수 (API 호출용)

| 변수 | 설명 |
|---|---|
| `POLARHUB_API_BASE_URL` | PolarHub API 기본 URL |
| `POLARHUB_TENANT_ID` | 인증 및 테넌트 헤더에 사용되는 테넌트 식별자 |
| `POLARHUB_API_SECRET` | Base64 인코딩된 HMAC 시크릿 |
| `POLARHUB_AGENCY_CONTACT_ID` | sender에 주입되는 여행사 연락처 참조 ID |

### 선택

| 변수 | 기본값 | 설명 |
|---|---|---|
| `POLARHUB_SITE_CODE` | `01` | 사이트 코드 |
| `POLARHUB_AGENCY_NAME` | 미설정 | 여행사명 |
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

## 로깅 및 개인정보

비프로덕션 환경에서는 요청/응답 페이로드가 `logs/` 디렉토리에 기록됩니다.

기록 내용에 승객 이름, 연락처, 여권 정보, 결제 관련 데이터 등 민감한 정보가 포함될 수 있습니다.

권장사항:

- `logs/`를 커밋하지 마세요
- 실제 승객 데이터로 개발 로깅을 사용하지 마세요
- 배포 전 `NODE_ENV=production`으로 전환하세요

## 라이선스

MIT
