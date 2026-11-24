import { z } from 'zod'
import { defineMethodTool } from '../../shared'

const txResultShape = {
  hash: z.string().optional(),
  validated: z.boolean().optional().describe('true if the outcome is final'),
  ledger_index: z.number().optional(),
  meta: z
    .looseObject({ TransactionResult: z.string().optional().describe('e.g. "tesSUCCESS"') })
    .optional()
    .describe('Metadata of the validated transaction, including its result and affected nodes'),
}

export const getTxTool = defineMethodTool({
  id: 'getTx',
  command: 'tx',
  description: `Look up a transaction by its hash: contents, validation status and metadata (result code "meta.TransactionResult", e.g. tesSUCCESS). If validated is false the outcome is not final yet. Use min_ledger/max_ledger to tell the server which range to search so it can answer "not found" definitively.`,
  request: z.object({
    transaction: z.string().length(64).describe('64-character hex transaction hash'),
    binary: z.boolean().optional().describe('Return hex instead of JSON'),
    min_ledger: z.number().int().nonnegative().optional().describe('Earliest ledger to search'),
    max_ledger: z.number().int().nonnegative().optional().describe('Latest ledger to search'),
  }),
  result: txResultShape,
})

export const getTransactionEntryTool = defineMethodTool({
  id: 'getTransactionEntry',
  command: 'transaction_entry',
  description: `Look up a transaction by hash inside ONE specific ledger. Unlike getTx, the ledger is required. Use getTx unless you already know the ledger.`,
  request: z.object({
    tx_hash: z.string().length(64).describe('64-character hex transaction hash'),
    ledger_index: z
      .union([z.number().int().nonnegative(), z.enum(['validated', 'current', 'closed'])])
      .optional()
      .describe('Ledger sequence number or "validated"'),
    ledger_hash: z.string().length(64).optional().describe('Hash of the ledger containing the transaction'),
  }),
  result: {
    tx_json: z.looseObject({}).optional(),
    metadata: z.looseObject({}).optional(),
    ledger_hash: z.string().optional(),
  },
})

export const simulateTransactionTool = defineMethodTool({
  id: 'simulateTransaction',
  command: 'simulate',
  description: `Dry-run an UNSIGNED transaction to preview its result and metadata without submitting it or paying a fee. Give tx_json (or tx_blob). Fee, Sequence, SigningPubKey and NetworkID are autofilled. Results may differ at real submission.`,
  request: z
    .object({
      tx_json: z.looseObject({ TransactionType: z.string() }).optional().describe('Unsigned transaction JSON'),
      tx_blob: z
        .string()
        .regex(/^[0-9A-Fa-f]+$/, 'Must be a hex string')
        .optional()
        .describe('Unsigned hex blob, instead of tx_json'),
      binary: z.boolean().optional().describe('Return hex instead of JSON'),
    })
    .refine(r => (r.tx_json === undefined) !== (r.tx_blob === undefined), {
      message: 'Provide exactly one of tx_json or tx_blob',
    }),
  result: {
    applied: z.boolean().optional(),
    engine_result: z.string().optional().describe('e.g. "tesSUCCESS"'),
    engine_result_message: z.string().optional(),
    ledger_index: z.number().optional(),
    tx_json: z.looseObject({}).optional(),
    tx_blob: z.string().optional(),
    meta: z.looseObject({}).optional(),
    meta_blob: z.string().optional(),
  },
})
