import type { ToolsInput } from '@mastra/core/agent'
import { MCPServer } from '@mastra/mcp'
import packageJson from '../package.json'
import { allTools, workflows } from './catalog'
import { INSTRUCTIONS } from './tools/instructions'

export const createXrplMcpServer = () =>
  new MCPServer({
    id: 'xrpl-mcp',
    name: 'XRPL',
    version: packageJson.version,
    description: 'XRP Ledger tools and token issuance workflows',
    instructions: INSTRUCTIONS,
    tools: allTools as ToolsInput,
    workflows,
  })
