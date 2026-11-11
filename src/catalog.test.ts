import { describe, expect, it } from 'vitest'
import { allTools, workflows } from './catalog'
import * as toolsBarrel from './tools'

const barrelToolNames = Object.entries(toolsBarrel)
  .filter(([, value]) => typeof value === 'object' && value !== null && 'id' in value && 'execute' in value)
  .map(([name]) => name)
  .sort()

describe('catalog', () => {
  it('lists every tool of the tools barrel exactly once', () => {
    expect(barrelToolNames.length).toBeGreaterThan(100)
    expect(Object.keys(allTools).sort()).toEqual(barrelToolNames)
  })

  it('names each workflow once, in kebab case', () => {
    expect(Object.keys(workflows)).toEqual(['iou-issuance', 'mpt-issuance', 'confidential-mpt', 'lending-setup'])
  })
})
