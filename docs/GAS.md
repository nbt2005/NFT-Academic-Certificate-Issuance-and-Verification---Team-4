# Measured gas comparison

Solidity 0.8.24, EVM Shanghai, Ganache chain 1337. Identical URI and JSON inputs, with a fresh deployment for each configuration. Optimizer enabled with runs=200. Receipt details are in gas-results.csv.

| Operation | Optimizer disabled | Optimizer enabled | Reduction (%) |
| --- | ---: | ---: | ---: |
| deploy | 2819227 | 1555029 | 44.84 |
| grantRole | 52047 | 51514 | 1.02 |
| mintFirst | 303520 | 301761 | 0.58 |
| mintNext | 252220 | 250461 | 0.70 |
| revoke | 37898 | 37302 | 1.57 |
| revokeRole | 30125 | 29527 | 1.99 |

Negative values indicate increased gas. Reads through eth_call do not charge transaction fees. Fees are recorded in wei from receipts, not estimates.
