# Skill: DTO Generation Pipeline (LLMs Markdown based)

This skill defines the core technical logic for automatically generating NestJS DTOs from Markdown-formatted OpenAPI schemas by tracking `llms.txt`.

## 1. Overview
Uses `js-yaml` to safely parse OpenAPI blocks within Markdown and converts them into NestJS-friendly DTO code.

## 2. Detailed Logic (Scripts)

### 2.1 Index Synchronization (`sync-llms-index.mjs`)
- Parses `llms.txt` to extract schema names, versions, and Markdown URLs.
- Saves results to `spec/schema-llms-index.json`.

### 2.2 DTO Generation (`gen-dto-from-llms.mjs`)
- **Recursive class extraction**: When a nested object is found, uses the parent class name as a prefix to create uniquely named DTO classes.
- **Modular Common DTO**: Generates all common types (`Comm.*`) as individual files within `src/dto-llms/common/`.
- **`allOf` inheritance support**: Analyzes the schema's `allOf` properties and converts them to TypeScript `extends` syntax (object extension and `any[]` prevention).
- **Strict type definitions**: Adds `!` (Definite Assignment) to required properties and applies accurate validation decorators (`@IsString`, `@IsArray`, `@Type`, etc.).

## 3. Best Practices
- **Uniqueness guarantee**: Class names must follow the `[Parent][Property]Dto` format to avoid duplicates.
- **Circular reference prevention**: During recursive traversal, checks whether a class has already been collected to prevent infinite loops.
- **Explicit visibility**: Specify `description` and `required` in `ApiProperty` decorators to maintain Swagger documentation quality.
- **Independent file structure**: Each API request/response is placed in its own dedicated directory (`src/dto-llms/[api-name]/`).
