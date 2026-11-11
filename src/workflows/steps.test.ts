import { Payment, TxResponse, Wallet } from 'xrpl'
import { describe, expect, it, vi } from 'vitest'
import { attempt, createdEntryId, fundWallets, submitStep } from './steps'

const TESTNET = 'wss://s.altnet.rippletest.net:51233/'
const signer = { address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', seed: 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2' }
const payment: Payment = {
  TransactionType: 'Payment',
  Account: signer.address,
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Amount: '1',
}

/** A fake testnet client: every submission is validated with `engineResult`, every faucet call makes a new wallet. */
const fakeClient = (engineResult = 'tesSUCCESS') => ({
  url: TESTNET,
  autofill: vi.fn(async (tx: unknown) => tx),
  submitAndWait: vi.fn(async () => ({
    result: { hash: 'ABC', validated: true, meta: { TransactionResult: engineResult } },
  })),
  fundWallet: vi.fn(async () => ({ wallet: Wallet.generate(), balance: 10 })),
})

const responseCreating = (...types: string[]) =>
  ({
    result: {
      hash: 'ABC',
      meta: {
        AffectedNodes: [
          { ModifiedNode: { LedgerEntryType: 'AccountRoot', LedgerIndex: 'ACCOUNT' } },
          ...types.map(type => ({ CreatedNode: { LedgerEntryType: type, LedgerIndex: `${type}-ID` } })),
        ],
      },
    },
  }) as unknown as TxResponse

describe('submitStep', () => {
  it('returns the result of a successful transaction', async () => {
    const { result } = await submitStep(fakeClient() as never, payment, signer, 'Send USD')

    expect(result).toEqual({ description: 'Send USD', hash: 'ABC', status: 'tesSUCCESS' })
  })

  it('throws on a tec result, so the workflow stops', async () => {
    await expect(submitStep(fakeClient('tecNO_LINE') as never, payment, signer, 'Send USD')).rejects.toThrow(
      'Send USD failed with tecNO_LINE (ABC)',
    )
  })
})

describe('fundWallets', () => {
  it('funds as many new wallets as asked, as plain records', async () => {
    const client = fakeClient()

    const wallets = await fundWallets(client as never, 3)

    expect(client.fundWallet).toHaveBeenCalledTimes(3)
    expect(new Set(wallets.map(wallet => wallet.address)).size).toBe(3)
    wallets.forEach(wallet => expect(Wallet.fromSeed(wallet.seed).classicAddress).toBe(wallet.address))
  })
})

describe('createdEntryId', () => {
  it('reads the ID of the created entry of a type', () => {
    expect(createdEntryId(responseCreating('MPToken', 'Vault'), 'Vault')).toBe('Vault-ID')
  })

  it('throws when the transaction created no entry of that type', () => {
    expect(() => createdEntryId(responseCreating('MPToken'), 'Vault')).toThrow('No Vault created by ABC')
  })
})

describe('attempt', () => {
  it('returns what the work returns', async () => {
    expect(await attempt('create wallets', async () => 42)).toBe(42)
  })

  it('names the failed work and keeps the reason', async () => {
    await expect(
      attempt('create wallets', async () => {
        throw new Error('faucet is down')
      }),
    ).rejects.toThrow('Failed to create wallets: faucet is down')
  })

  it('reads plain objects thrown by the crypto layer', async () => {
    await expect(
      attempt('convert', async () => {
        throw { code: 7 }
      }),
    ).rejects.toThrow('Failed to convert: {"code":7}')
  })
})
