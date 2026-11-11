import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import packageJson from '../../package.json'

// MCP clients do not hand the server version to the model: a tool is the only way to ask for it.
export const getMcpVersionTool = createTool({
  id: 'getMcpVersion',
  description: 'Get the version of this XRPL MCP server (the @florent-uzio/xrpl-mcp npm package).',
  inputSchema: z.object({}),
  outputSchema: z.object({ name: z.string(), version: z.string() }),
  execute: async () => ({ name: packageJson.name, version: packageJson.version }),
})
