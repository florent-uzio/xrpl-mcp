import { Tool } from '@mastra/core/tools'
import * as toolsBarrel from './tools'
import { confidentialMptWorkflow, iouIssuanceWorkflow, lendingSetupWorkflow, mptIssuanceWorkflow } from './workflows'

/**
 * The single list of tools and workflows the MCP server exposes.
 * Each tool is exposed under its id, the name the model sees, so ids never change (docs/adr/0001).
 */

// The tools barrel also exports schemas and helper functions: keep only the tools. Exporting a tool is enough to add it.
export const allTools = Object.fromEntries(
  Object.values(toolsBarrel)
    .filter((value): value is Tool<any, any, any, any> => value instanceof Tool)
    .map(tool => [tool.id, tool]),
)

// One key per workflow. The MCP server exposes each one as run_<key>.
export const workflows = {
  'iou-issuance': iouIssuanceWorkflow,
  'mpt-issuance': mptIssuanceWorkflow,
  'confidential-mpt': confidentialMptWorkflow,
  'lending-setup': lendingSetupWorkflow,
}
