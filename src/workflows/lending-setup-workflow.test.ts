import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SubmittableTransaction, Wallet } from 'xrpl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../helpers'
import { lendingSetupWorkflow } from './lending-setup-workflow'

vi.mock('../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../helpers')>()),
  getXrplClient: vi.fn(),
}))

const CLOSE_TIME = 800_000_000

/** The ledger entry each transaction creates, as the steps read it from the metadata. */
const created: Partial<Record<string, string>> = { VaultCreate: 'Vault', LoanBrokerSet: 'LoanBroker' }

/** A fake devnet client: wallets are funded offline, and `failing` gets a tec result. */
const fakeClient = (failing?: string) => ({
  url: 'wss://s.devnet.rippletest.net:51233/',
  fundWallet: vi.fn(async () => ({ wallet: Wallet.generate() })),
  autofill: vi.fn(async (tx: unknown) => tx),
  request: vi.fn(async () => ({ result: { ledger: { close_time: CLOSE_TIME } } })),
  submitAndWait: vi.fn(async (tx: SubmittableTransaction) => {
    const entry = created[tx.TransactionType]
    return {
      result: {
        hash: `${tx.TransactionType}-HASH`,
        validated: true,
        meta: {
          TransactionResult: tx.TransactionType === failing ? 'tecEXPIRED' : 'tesSUCCESS',
          mpt_issuance_id: tx.TransactionType === 'MPTokenIssuanceCreate' ? 'MPT-ID' : undefined,
          AffectedNodes: entry ? [{ CreatedNode: { LedgerEntryType: entry, LedgerIndex: `${entry}-ID` } }] : [],
        },
      },
    }
  }),
})

const inputData = {
  network: 'wss://s.devnet.rippletest.net:51233/',
  issuance: { source: 'create' as const, assetScale: 2 },
  mintAmount: '1000',
  depositAmount: '500',
  coverAmount: '100',
  managementFeeRate: 5000,
  coverRateMinimum: 10000,
  coverRateLiquidation: 50000,
  subscriptionSeconds: 300,
  investmentSeconds: 3600,
}

describe('lending-setup workflow', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'lending-records-'))
    vi.stubEnv('XRPL_RECORDS_DIR', dir)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(dir, { recursive: true, force: true })
  })

  it('creates the vault, deposit and loan broker, and dates the vault from ledger time', async () => {
    const client = fakeClient()
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await lendingSetupWorkflow.createRun()
    const result = await run.start({ inputData })

    expect(result.status).toBe('success')
    const submitted = client.submitAndWait.mock.calls.map(([tx]) => tx.TransactionType)
    expect(submitted.slice(-4)).toEqual(['VaultCreate', 'VaultDeposit', 'LoanBrokerSet', 'LoanBrokerCoverDeposit'])
    const output = (result as { result: Record<string, unknown> }).result
    expect(output).toMatchObject({
      mptIssuanceId: 'MPT-ID',
      vaultId: 'Vault-ID',
      loanBrokerId: 'LoanBroker-ID',
      subscriptionDate: CLOSE_TIME + 300,
      redemptionDate: CLOSE_TIME + 300 + 3600,
    })
    expect(JSON.stringify(output)).not.toMatch(/"seed"/)
  })

  it('stops when the deposit fails on ledger, and names the step', async () => {
    const client = fakeClient('VaultDeposit')
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await lendingSetupWorkflow.createRun()
    const result = await run.start({ inputData })

    expect(result.status).toBe('failed')
    expect(JSON.stringify(result)).toContain('Failed to deposit into the vault')
    expect(JSON.stringify(result)).toContain('tecEXPIRED')
    const submitted = client.submitAndWait.mock.calls.map(([tx]) => tx.TransactionType)
    expect(submitted).not.toContain('LoanBrokerSet')
  })
})
