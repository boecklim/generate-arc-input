# What is generate-arc-input

`generate-arc-input` is a script for the creation of transactions to test ARC. It holds also some helper functions to get information about transactions.

# How to install
Run 
```
yarn install
```

The following environment variables are required: `APIKEY_TESTNET`, `APIKEY_MAINNET`, `PRIV_KEY`. The private key should be holding some funds.
You can put them in a `.env` file in the root directory of the project.

# How to run

The following commands are available
```
submit1Tx
submitMultipleTx
splitUtxo

printAddress

getAddressUtxos
getTxStatus
getTxStatusHistory
getAddressBalanceWoC
```

By default each command is for `testnet`. Add the `--main` flag to run the commands for `mainnet`.

## submit 1 tx
Creates and sends one transaction to ARC

```
node testArc.js submit1Tx
```

With flag `--print` the transaction is merely printed.
With flag `--extended` the transaction is created in extended format.

## submit multiple txs
Creates and sends 10 transactions to ARC

```
node testArc.js submitMultipleTx
```

With flag `--print` the transaction is merely printed.
With flag `--extended` the transaction is created in extended format.

## print address

Print the address of the private key
```
node testArc.js printAddress
```
