---
'@florent-uzio/xrpl-mcp': major
---

Rename every tool to a camelCase name without the `Tool` suffix, like the other MCP servers: `submitPaymentTool` becomes `submitPayment`, `getAccountInfoTool` becomes `getAccountInfo`, and so on. One exception: `getVersionTool` becomes `getXrpldApiVersions`, since it returns the API versions an xrpld server supports. Update Claude Code permission rules and saved prompts that name the old tools (for example `mcp__xrpl__submitPaymentTool` becomes `mcp__xrpl__submitPayment`). Workflow names (`run_iou-issuance`, ...) do not change.

The server instructions and tool descriptions now name the tools the client actually sees, instead of ids such as `submit-signed-blob` that no client could call.
