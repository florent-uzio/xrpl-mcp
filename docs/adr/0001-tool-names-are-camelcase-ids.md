# Tools are exposed under camelCase ids

Each tool is exposed under its `id`, a camelCase name equal to its export name without `Tool` (`submitPayment` for `submitPaymentTool`), as in custody-mcp and simpleXRPL-mcp. Until 2.0.0 the server exposed the export names (`submitPaymentTool`) while the instructions named the kebab ids (`submit-payment`), so the model was told to call tools that did not exist.

The ids are the names clients call and allowlist (`mcp__xrpl__submitPayment`), so a published id is never renamed: a rename breaks every client and needs a major release. Workflows keep their `run_<kebab>` names (`run_iou-issuance`), which Mastra derives from the workflow keys.

## Considered Options

- Keep the `…Tool` names and fix only the text: nothing would break, but the three sibling servers would keep two naming styles.
