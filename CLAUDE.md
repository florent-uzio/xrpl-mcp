## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on florent-uzio/xrpl-mcp, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Conventions

- Single npm package, MCP server only (stdio), bundled with esbuild into one bin. No Mastra agent or Studio.
- Mastra provides `createTool`, `createWorkflow` and `MCPServer`; schemas are Zod 4. Every dependency is a devDependency, because the bundle carries them all.
- Every tool exported from `src/tools` is exposed by the server (`src/catalog.ts`); workflows are exposed as `run_<name>`.
- Wallet seeds are refused outside test networks. On mainnet, flow records hold addresses and public keys only.
- Every user-facing change comes with a changeset (`npm run changeset`). See `RELEASING.md`.
- Checks before a PR: `npm run format:check && npm run typecheck && npm test`.
