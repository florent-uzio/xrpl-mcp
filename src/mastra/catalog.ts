import { Tool } from '@mastra/core/tools'
import * as toolsBarrel from './tools'
import { confidentialMptWorkflow, iouIssuanceWorkflow, lendingSetupWorkflow, mptIssuanceWorkflow } from './workflows'

/**
 * The single list of tools and workflows the MCP server exposes.
 * Tool keys are the tool names the model sees, so they never change.
 */

// The tools barrel also exports schemas and helper functions: keep only the tools. Exporting a tool is enough to add it.
export const allTools = Object.fromEntries(
  Object.entries(toolsBarrel).filter((entry): entry is [string, Tool<any, any, any, any>] => entry[1] instanceof Tool),
)

// One key per workflow. The MCP server exposes each one as run_<key>.
export const workflows = {
  'iou-issuance': iouIssuanceWorkflow,
  'mpt-issuance': mptIssuanceWorkflow,
  'confidential-mpt': confidentialMptWorkflow,
  'lending-setup': lendingSetupWorkflow,
}
