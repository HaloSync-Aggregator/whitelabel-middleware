# Sub-Agents and Skills

This repository includes optional Claude Code maintenance assets under `.claude/`.

## Scope

These assets are for maintainers who want AI-assisted repository work such as:

- checking request/response mapping rules
- generating or updating DTOs
- keeping controller and service patterns consistent

They are not needed for:

- `npm install`
- `npm run start:dev`
- Docker startup
- normal application use

## Canonical Location

Use `.claude/` as the canonical location for bundled agent and skill definitions in this repository.

## Included Asset Types

- `.claude/agents/`: optional agent prompts
- `.claude/skills/`: optional workflow and reference documents
- `.claude/settings.json`: optional Claude Code hook configuration

If you are publishing or consuming this repository only as application code, you can treat these assets as optional reference material.
