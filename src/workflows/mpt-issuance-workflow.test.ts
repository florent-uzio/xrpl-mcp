import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SubmittableTransaction, Wallet } from 'xrpl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getXrplClient } from '../helpers'
import { mptIssuanceWorkflow } from './mpt-issuance-workflow'

vi.mock('../helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('../helpers')>()),
  getXrplClient: vi.fn(),
}))

/** A fake testnet client: wallets are funded offline, and `failing` gets a tec result. */
const fakeClient = (failing?: string) => ({
  url: 'wss://s.altnet.rippletest.net:51233/',
  fundWallet: vi.fn(async () => ({ wallet: Wallet.generate() })),
  autofill: vi.fn(async (tx: unknown) => tx),
  submitAndWait: vi.fn(async (tx: SubmittableTransaction) => ({
    result: {
      hash: `${tx.TransactionType}-HASH`,
      validated: true,
      meta: {
        TransactionResult: tx.TransactionType === failing ? 'tecNO_PERMISSION' : 'tesSUCCESS',
        mpt_issuance_id: tx.TransactionType === 'MPTokenIssuanceCreate' ? 'MPT-ID' : undefined,
      },
    },
  })),
})

const inputData = {
  network: 'wss://s.altnet.rippletest.net:51233/',
  issuance: { flags: ['tfMPTRequireAuth' as const] },
  holders: 2,
  mintAmount: '10',
}

describe('mpt-issuance workflow', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'mpt-records-'))
    vi.stubEnv('XRPL_RECORDS_DIR', dir)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(dir, { recursive: true, force: true })
  })

  it('opts in, authorizes and mints to each holder, and returns addresses only', async () => {
    const client = fakeClient()
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await mptIssuanceWorkflow.createRun()
    const result = await run.start({ inputData })

    expect(result.status).toBe('success')
    const submitted = client.submitAndWait.mock.calls.map(([tx]) => tx.TransactionType)
    expect(submitted).toEqual([
      'MPTokenIssuanceCreate',
      'MPTokenAuthorize',
      'MPTokenAuthorize',
      'MPTokenAuthorize',
      'MPTokenAuthorize',
      'Payment',
      'Payment',
    ])
    const output = (result as { result: { mptIssuanceId: string; holders: string[] } }).result
    expect(output.mptIssuanceId).toBe('MPT-ID')
    expect(JSON.stringify(output)).not.toMatch(/"seed"/)
  })

  it('stops when the issuance fails on ledger, and names the step', async () => {
    const client = fakeClient('MPTokenIssuanceCreate')
    vi.mocked(getXrplClient).mockResolvedValue(client as never)

    const run = await mptIssuanceWorkflow.createRun()
    const result = await run.start({ inputData })

    expect(result.status).toBe('failed')
    expect(JSON.stringify(result)).toContain('Failed to create MPT issuance')
    expect(JSON.stringify(result)).toContain('tecNO_PERMISSION')
    expect(client.submitAndWait).toHaveBeenCalledTimes(1)
  })
})
