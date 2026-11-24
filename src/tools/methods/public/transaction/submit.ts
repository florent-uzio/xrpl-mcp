import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const submitSignedBlobTool = defineMethodTool({
  id: 'submitSignedBlob',
  command: 'submit',
  description: `Submit an already signed transaction, given as a hex tx_blob, to the network. Use it when the user provides a pre-signed blob (e.g. signed offline or by a custody/HSM). To build, autofill and sign a transaction from fields, use the submit tool of its transaction type (submitPayment, submitTrustSet, ...) instead.

A tesSUCCESS engine_result only means the transaction was applied to the open ledger: it is final once validated. Confirm with getTx using the returned hash. Submitting is irreversible on mainnet.`,
  request: z.object({
    tx_blob: z
      .string()
      .regex(/^[0-9A-Fa-f]+$/, 'Must be a hex string')
      .describe('Signed transaction as a hex blob'),
    fail_hard: z
      .boolean()
      .optional()
      .describe('If true, do not relay the transaction when it fails its local checks (default false)'),
  }),
  result: {
    engine_result: z.string().optional().describe('Preliminary result, e.g. "tesSUCCESS", "tecUNFUNDED_PAYMENT"'),
    engine_result_message: z.string().optional(),
    accepted: z.boolean().optional().describe('true if the server accepted the transaction for processing'),
    applied: z.boolean().optional(),
    broadcast: z.boolean().optional(),
    kept: z.boolean().optional(),
    queued: z.boolean().optional(),
    tx_blob: z.string().optional(),
    tx_json: z.looseObject({ hash: z.string().optional() }).optional(),
    validated_ledger_index: z.number().optional(),
  },
})

export const submitMultisignedTool = defineMethodTool({
  id: 'submitMultisigned',
  command: 'submit_multisigned',
  description: `Submit a multi-signed transaction, given as tx_json with a Signers array whose weights meet the account's SignerList quorum. Use submitSignedBlob for a single-signed hex blob. Irreversible on mainnet. engine_result is preliminary: confirm with getTx.`,
  request: z.object({
    tx_json: z
      .looseObject({ TransactionType: z.string(), Signers: z.array(z.looseObject({})).min(1) })
      .describe('Transaction JSON, fully autofilled, with a Signers array'),
    fail_hard: z.boolean().optional().describe('If true, do not relay when local checks fail (default false)'),
  }),
  result: {
    engine_result: z.string().optional().describe('Preliminary result, e.g. "tesSUCCESS"'),
    engine_result_message: z.string().optional(),
    tx_blob: z.string().optional(),
    tx_json: z.looseObject({ hash: z.string().optional() }).optional(),
  },
})
