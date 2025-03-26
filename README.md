# What is generate-arc-input

`generate-arc-input` is a script for the creation of transactions to test [ARC](https://github.com/bitcoin-sv/arc). It holds also some helper functions to get information about transactions.

# How to install
Run 
```
npm install
```

The following environment variables are required: `PRIV_KEY`. The private key should be holding some funds.
You can put them in a `.env` file in the root directory of the project.

If you have no private key ready, you can generate one with the following command to display a new random private key with `testnet` and `mainnet` addresses:

```bash
npm exec ts-node -- src/main.ts printNewPrivateKey
```

Copy the private key and paste it in the `.env` file as `PRIV_KEY='XXXXX'`.

# How to run

To print all available commands and flags run:
```bash
npm exec ts-node -- src/main.t help
``` 

The following commands are available
- submitTx
- printNewPrivateKey
- printAddress
- help

Temporarily not supported anymore:
- ~~submitTxs~~
- ~~splitUtxo~~
- ~~getAddressUtxos~~
- ~~getTxStatus~~
- ~~getTxStatusHistory~~
- ~~getAddressBalanceWoC~~

## Examples

Submit 1 transaction with callback URL and api key:
```bash
npm exec ts-node -- src/main.ts \
--apiKey=mainnet_XXX \
--arcURL=https://arc.taal.com \
--callbackURL=https://abc-callbacks.com \
-f \
-m \
submitTx
```

Print 1 transaction in extended format
```bash
npm exec ts-node -- src/main.ts -p -e submitTx
```