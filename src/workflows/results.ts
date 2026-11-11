import z from 'zod'

/**
 * Transaction result schema
 *
 * Represents the result of a single XRPL transaction with
 * description, hash, and status information.
 */
export const txnResultSchema = z.object({
  description: z.string().describe('Human-readable description of the transaction'),
  hash: z.string().describe('Transaction hash for blockchain verification'),
  status: z.string().describe('Transaction status (success, failure, etc.)'),
})

export type TxnResult = z.infer<typeof txnResultSchema>

/**
 * Fields every workflow result ends with. Results carry addresses only: seeds stay in the record file
 * (getFlowRecords), so they never reach the model or an MCP client by default.
 */
export const resultShape = {
  network: z.string(),
  txnResults: z.array(txnResultSchema).describe('Transactions of the run'),
  recordId: z.string().describe('Id of the saved record, usable with the getFlowRecords tool (it holds the seeds)'),
  recordPath: z.string().describe('Path of the saved record file'),
}

export const addressSchema = z.string().describe('Classic address')

/**
 * A wallet as carried from step to step: plain JSON, because Mastra saves every step's output in a snapshot and a
 * Wallet instance would come back from it as a plain object. Each step signs with Wallet.fromSeed.
 */
export const walletRecordSchema = z.object({
  address: z.string().describe('Classic address'),
  seed: z.string().describe('Seed (test networks only)'),
})
