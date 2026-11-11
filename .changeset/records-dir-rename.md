---
'@florent-uzio/xrpl-mcp': patch
---

The default flow records folder is now `~/.xrpl-mcp/records` (was `~/.xrpl-mastra-ai/records`). Existing records in the old folder are not migrated; set `XRPL_RECORDS_DIR` to keep using them.
