import { MCPClient } from '@mastra/mcp'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import packageJson from '../package.json'
import { allTools } from './catalog'
import { createXrplMcpServer } from './server'
import { INSTRUCTIONS } from './tools/instructions'

const server = createXrplMcpServer()

const toolNames = async () => (await server.getToolListInfo()).tools.map(tool => tool.name)

const errorOf = async (toolName: string, input: object) => {
  try {
    return JSON.stringify(await server.executeTool(toolName, input))
  } catch (error) {
    return String(error)
  }
}

describe('xrpl MCP server', () => {
  it('reports the version of the npm package', () => {
    expect(server.version).toBe(packageJson.version)
  })

  it('returns the package version from a tool', async () => {
    const result = await server.executeTool('getMcpVersion', {})
    expect(result).toEqual({ status: 'completed', output: { name: packageJson.name, version: packageJson.version } })
  })

  it('lists every tool of the catalog, and nothing else but the workflows', async () => {
    const names = await toolNames()
    expect(names.filter(name => !name.startsWith('run_')).sort()).toEqual(Object.keys(allTools).sort())
  })

  it('lists the four workflows', async () => {
    expect(await toolNames()).toEqual(
      expect.arrayContaining(['run_iou-issuance', 'run_mpt-issuance', 'run_confidential-mpt', 'run_lending-setup']),
    )
  })

  it('gives the client the instructions, flow-record rules included', () => {
    expect(server.instructions).toBe(INSTRUCTIONS)
    expect(INSTRUCTIONS).toContain('## Memory')
  })

  describe('seed policy', () => {
    afterEach(() => vi.unstubAllEnvs())

    const payment = (network: string) => ({
      network,
      seed: 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2',
      txn: {
        TransactionType: 'Payment',
        Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
        Amount: '1',
      },
    })

    it('refuses a seed on mainnet without connecting', async () => {
      expect(await errorOf('submitPayment', payment('wss://xrplcluster.com/'))).toMatch(
        /Wallet seeds are refused on wss:\/\/xrplcluster\.com\//,
      )
    })

    it('lets a seed through the check on a network listed in XRPL_EXTRA_TEST_NETWORKS', async () => {
      // The unreachable URL gets past the check and fails to connect.
      vi.stubEnv('XRPL_EXTRA_TEST_NETWORKS', 'ws://127.0.0.1:1')
      expect(await errorOf('submitPayment', payment('ws://127.0.0.1:1'))).toMatch(/ECONNREFUSED/)
    }, 30_000)
  })
})

// The only test that starts the real entry point: it catches a broken stdio.ts.
describe('stdio entry point', () => {
  it('serves the tools over stdio', async () => {
    const client = new MCPClient({
      servers: {
        xrpl: {
          command: 'npx',
          args: ['tsx', path.join(__dirname, 'stdio.ts')],
          env: { PATH: process.env.PATH ?? '' },
        },
      },
    })
    try {
      const tools = await client.listTools()
      const result = await tools['xrpl_getMcpVersion'].execute?.({}, {} as never)
      expect(JSON.stringify(result)).toContain(packageJson.version)
    } finally {
      await client.disconnect()
    }
  }, 60_000)
})
