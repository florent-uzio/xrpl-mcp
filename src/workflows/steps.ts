import { Client, SubmittableTransaction, TransactionMetadata, TxResponse, Wallet } from 'xrpl'
import { errorMessage, LedgerClient, submit, toWalletRecord, WalletRecord } from '../helpers'
import { TxnResult } from './results'

/** Runs the work of a workflow step and names it when it fails: "Failed to <what>: <reason>". */
export const attempt = async <T>(what: string, work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    throw new Error(`Failed to ${what}: ${errorMessage(error)}`)
  }
}

/**
 * Submits a transaction signed by `signer` and throws unless it succeeded: a workflow cannot go on after a failed
 * transaction (a tec result is validated but failed, so later steps would build on something that does not exist).
 */
export const submitStep = async <T extends SubmittableTransaction>(
  client: LedgerClient,
  tx: T,
  signer: WalletRecord,
  description: string,
): Promise<{ result: TxnResult; response: TxResponse<T> }> => {
  const { ok, engineResult, hash, response } = await submit(client, tx, { wallet: Wallet.fromSeed(signer.seed) })
  if (!ok) {
    throw new Error(`${description} failed with ${engineResult} (${hash})`)
  }
  return { result: { description, hash, status: engineResult }, response }
}

/** Reads the ID of the ledger entry of `type` (e.g. "Vault") that a transaction created, from its metadata. */
export const createdEntryId = (response: TxResponse, type: string): string => {
  const { AffectedNodes } = response.result.meta as TransactionMetadata
  for (const node of AffectedNodes) {
    if ('CreatedNode' in node && node.CreatedNode.LedgerEntryType === type) {
      return node.CreatedNode.LedgerIndex
    }
  }
  throw new Error(`No ${type} created by ${response.result.hash}`)
}

/** Funds `count` new wallets from the faucet, in parallel. */
export const fundWallets = async (client: Client, count: number): Promise<WalletRecord[]> =>
  Promise.all(Array.from({ length: count }, async () => toWalletRecord((await client.fundWallet()).wallet)))
