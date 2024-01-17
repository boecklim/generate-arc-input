# What is generate-arc-input

`generate-arc-input` is a script for the creation of transactions to test ARC. It holds also some helper functions to get information about transactions.

# How to install
Run 
```
yarn install
```

The following environment variables are required: `APIKEY_TESTNET`, `APIKEY_MAINNET`, `PRIV_KEY`. The private key should be holding some funds.
You can put them in a `.env` file in the root directory of the project.

If you have no private key ready, you can generate one with the following command to display a new random private key with `testnet` and `mainnet` addresses:

```
node testArc.js printNewPrivateKey
```

Copy the private key and paste it in the `.env` file as `PRIV_KEY='XXXXX'`.

After adding funds to the private key, you can split the initial UTXO into 10 smaller outputs using the command:
```
node testArc.js splitUtxo
```

# How to run

The following commands are available
```
submit1Tx
submitMultipleTx
splitUtxo

printNewPrivateKey
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
