# xrpl-mcp

An MCP server, [`@florent-uzio/xrpl-mcp`](https://www.npmjs.com/package/@florent-uzio/xrpl-mcp), that lets an AI client such as Claude Code query and transact on the XRP Ledger. It runs over stdio and is built with [Mastra](https://mastra.ai/) and [xrpl.js](https://js.xrpl.org/). See `GLOSSARY.md` for the vocabulary.

- **Over 120 tools**:
  - query the ledger (accounts, ledgers, transactions, order books, AMMs, NFTs, vaults, servers, fees)
  - submit the XRPL transaction types (payments, trust lines, DEX offers, AMMs, NFTs, MPTs, escrows, checks, payment channels, credentials, vaults, lending, oracles, batches, confidential MPTs)
  - create and fund wallets
  - convert units and currency codes
- **4 workflows** for multi-step setups on test networks: IOU issuance, MPT issuance, confidential MPT and lending setup.

## Use it from Claude Code

You only need Node.js 22.13 or later. No model API key is required: Claude Code does the reasoning and calls the tools.

```bash
claude mcp add xrpl -- npx -y @florent-uzio/xrpl-mcp@latest
```

Then ask Claude things like "What is the balance of rXXX on mainnet?" or "Issue an MPT on testnet with 2 holders".

`@latest` makes `npx` check npm each time Claude Code starts the server, so a new release loads in your next session, or when you reconnect `xrpl` from `/mcp`. To stay on one version, pin it instead, e.g. `@florent-uzio/xrpl-mcp@2.0.0`.

To run the server from a clone of this repo instead:

```bash
claude mcp add xrpl -- npm --prefix "$(pwd)" run --silent mcp
```

## Networks and secrets

- Mainnet is the default. Say "testnet" or "devnet", or give a `wss://` URL, to use another network. Every known network is listed in `src/helpers/networks.ts`.
- **Seeds are refused outside test networks**, before any connection is made. On mainnet, sign the transaction yourself and submit the blob with `submitSignedBlob`.
- **Flow records** keep what a session creates (wallets, MPT IDs, keys, hashes), so a later session can reuse it. `saveFlowRecord` refuses seeds and private keys on mainnet.

| Variable                   | Purpose                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XRPL_RECORDS_DIR`         | Folder for flow records. Defaults to `~/.xrpl-mcp/records`.                                                                                                                                                                              |
| `XRPL_EXTRA_TEST_NETWORKS` | Comma-separated URLs of other test networks where seeds are allowed, e.g. a local node. Pass it to the MCP server with `claude mcp add xrpl --env XRPL_EXTRA_TEST_NETWORKS=ws://localhost:6006 -- npx -y @florent-uzio/xrpl-mcp@latest`. |

## Workflows

The server exposes each workflow as `run_<name>`.

| Workflow           | Network         | What it does                                                                                                                                                   |
| ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iou-issuance`     | testnet, devnet | Funds an issuer and holders, configures the issuer, creates the trust lines and sends the token to each holder.                                                |
| `mpt-issuance`     | testnet, devnet | Funds an issuer and holders, creates the MPT issuance (flags, scale, metadata), opts the holders in and sends them the token.                                  |
| `confidential-mpt` | devnet          | Creates or reuses a confidential MPT, registers the ElGamal keys, converts a holder balance to confidential, then optionally sends and converts back.          |
| `lending-setup`    | devnet          | Creates a transferable MPT, a closed-ended vault, a deposit, a loan broker and its first-loss cover. The loan itself is created afterwards with `signLoanSet`. |

The input of each workflow is described in its schema, in `src/workflows/*.types.ts`.

## Add a tool

Transaction tools use the factory. It adds `network` and `seed`, refuses seeds outside test networks, hex-encodes every currency code, then autofills, signs and submits the transaction:

```typescript
// src/tools/transactions/payment/payment.ts
import { Payment } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory({ inputSchema: xrplPaymentSchema })

export const submitPaymentTool = createTransactionTool<Payment>({
  toolId: 'submitPayment',
  description: 'Submit a Payment transaction to send XRP, tokens or MPTs. ...',
  // Optional: reshape the input into the transaction
  buildTransaction: payment => ({ ...payment, Amount: payment.DeliverMax ? undefined : payment.Amount }) as Payment,
  // Optional: throw to refuse the transaction before it is signed
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
```

Query tools use `defineMethodTool` (`src/tools/methods/shared/method-tool.ts`), with the `id`, the xrpld `command` and the `request` and `result` schemas.

Export the new tool from its folder's `index.ts`. `src/catalog.ts` picks up every tool exported from `src/tools`, so the server exposes it.

The server exposes each tool under its id, so the id is the name the model sees. Name the export after the id with a `Tool` suffix (`submitPaymentTool` for `submitPayment`): a test checks it. Never rename a published tool: it breaks every client that calls it (see `docs/adr/0001-tool-names-are-camelcase-ids.md`).

## Development

```bash
npm test               # unit tests
npm run typecheck      # tsc
npm run format         # prettier
npm run build          # bundle the server into dist/
```

Domain terms are in [GLOSSARY.md](https://github.com/florent-uzio/xrpl-mcp/blob/main/GLOSSARY.md). Releases of the MCP package follow [RELEASING.md](https://github.com/florent-uzio/xrpl-mcp/blob/main/RELEASING.md).
