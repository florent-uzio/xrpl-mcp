import { xrplMcpServer } from './server'

// Started from any folder (npx), flow records must not land in the current directory.
process.env.XRPL_RECORDS_DIR ??= '~/.xrpl-mcp/records'

await xrplMcpServer.startStdio()
