import { Tool } from '@mastra/core/tools'
import { describe, expect, it } from 'vitest'
import { allTools, workflows } from './catalog'
import * as toolsBarrel from './tools'
import { INSTRUCTIONS } from './tools/instructions'

const barrelTools = Object.entries(toolsBarrel).filter(
  (entry): entry is [string, Tool<any, any, any, any>] => entry[1] instanceof Tool,
)

describe('catalog', () => {
  it('exposes every tool of the tools barrel under its own id', () => {
    expect(barrelTools.length).toBeGreaterThan(100)
    expect(Object.keys(allTools)).toHaveLength(barrelTools.length)
    for (const [, tool] of barrelTools) {
      expect(allTools[tool.id]).toBe(tool)
    }
  })

  it('names each tool after its export, without the Tool suffix', () => {
    for (const [exportName, tool] of barrelTools) {
      expect(`${tool.id}Tool`).toBe(exportName)
    }
  })

  it('names tools in camel case, as the sibling MCP servers do', () => {
    expect(Object.keys(allTools)).toEqual(
      expect.arrayContaining(['submitPayment', 'getMcpVersion', 'getXrpldApiVersions']),
    )
  })

  // Outside `code spans`, the only camelCase words in the instructions are tool names.
  it('knows every tool the instructions name', () => {
    const named = INSTRUCTIONS.replace(/`[^`]*`/g, '').match(/\b[a-z]+[A-Z]\w*/g)
    expect(named).not.toBeNull()
    for (const name of new Set(named)) {
      expect(Object.keys(allTools), `instructions name ${name}`).toContain(name)
    }
  })

  it('names each workflow once, in kebab case', () => {
    expect(Object.keys(workflows)).toEqual(['iou-issuance', 'mpt-issuance', 'confidential-mpt', 'lending-setup'])
  })
})
