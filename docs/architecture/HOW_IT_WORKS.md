# How It Works

## Runtime Flow

At runtime the middleware follows a simple path:

1. The frontend sends a `camelCase` JSON request to a NestJS controller.
2. The request DTO validates the payload.
3. `PolarHubService` transforms the payload into PolarHub's PascalCase structure.
4. `PolarHubClient` applies HMAC headers when FE headers are not provided.
5. The response is returned to the frontend with minimal reshaping.

## Key Constraints

- Business data comes from the frontend
- The middleware should not invent passenger or contact values
- `transactionId` is passed through from the frontend
- `sender.travelAgency.contactInfoRefId` is injected from environment variables
- PolarHub errors are passed through via `PolarHubExceptionFilter`

## Optional Claude Code Workflow

If you use Claude Code, `.claude/` provides optional skills and agent prompts for maintaining this repository.

That workflow is optional:

- it is not required to run the server
- it is not required to inspect the OpenAPI snapshot
- it is not part of the request path used by application consumers
