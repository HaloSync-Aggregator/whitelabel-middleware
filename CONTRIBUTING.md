# Contributing

Thanks for helping improve `whitelabel-middleware`.

This repository is a public NestJS middleware seed for OTA developers who have completed PolarHub onboarding and received API credentials.

## Scope

- Code in this repository is released under the MIT License.
- Access to the PolarHub API is governed separately through PolarHub onboarding and API key issuance.
- If you have completed onboarding and received API credentials, you may use this project to generate and operate your middleware with your provisioned API access.

## How To Report Issues

Issues are welcome for:

- Reproducible bugs in the generated middleware or skills
- Documentation gaps or incorrect setup instructions
- Confusing behavior in code generation output

When opening an issue, please include:

- What you were trying to do
- Exact steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots, logs, or request/response snippets when safe to share
- Never post secrets, API keys, or credentials

## Pull Requests

Pull request policy is still being finalized.

Until that policy is published:

- Please open an issue first for non-trivial code changes
- Small documentation fixes are welcome
- Maintainers may request changes, re-scope a PR, or close it if it does not fit the current roadmap

## Local Validation

Before submitting a code change, run:

```bash
npm run build
npm run start:dev
curl http://localhost:3000/middleware/health
```
