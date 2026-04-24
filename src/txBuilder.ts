import { PrivateKey, PublicKey, P2PKH, Transaction } from "@bsv/sdk";
import axios, { AxiosResponse } from "axios";

type formatedUtxo = {
  txid: string;
  vout: number;
  satoshis: number;
};

type wocUtxo = {
  height: number;
  tx_pos: number;
  tx_hash: string;
  value: number;
};

export class TxBuilder {
  privateKey: PrivateKey;
  address: string;
  publicKey: PublicKey;
  wocURL: string;

  constructor(privkey: string, network: string, wocURL: string) {
    this.privateKey = PrivateKey.fromString(privkey);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = this.privateKey.toAddress(network).toString();
    this.wocURL = wocURL;
  }

  async getAddressUnspentUtxosWoC(address: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `${this.wocURL}/address/${address}/unspent/all`,
    });
  }

  async getRawTxData(txID: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `${this.wocURL}/tx/${txID}/hex`,
    });
  }

  async printAddress() {
    console.log(this.address);
  }

  async printPrivKeyWIF() {
    console.log(this.privateKey.toWif());
  }

  async printPrivKeyHex() {
    console.log(this.privateKey.toHex());
  }

  async getAddressUtxosWoC(): Promise<formatedUtxo[]> {
    let utxos: wocUtxo[];

    const resp = await this.getAddressUnspentUtxosWoC(this.address);

    utxos = resp.data.result;

    let formatedUtxos: formatedUtxo[] = [];
    let formatedUtxo: formatedUtxo;
    for (const utxo of utxos) {
      if (utxo.value > 1) {
        formatedUtxo = {
          txid: utxo.tx_hash,
          vout: utxo.tx_pos,
          satoshis: utxo.value,
        };

        formatedUtxos.push(formatedUtxo);
      }
    }

    return formatedUtxos;
  }

  async createTx1Output(utxo: formatedUtxo, changeAddress: string ): Promise<Transaction> {
    let rawTxHex: string;

    const resp = await this.getRawTxData(utxo.txid);

    rawTxHex = resp.data;

    const tx = new Transaction();

    const sourceTx = Transaction.fromHex(rawTxHex);

    const p2pkh = new P2PKH().unlock(this.privateKey);

    tx.addInput({
      sourceTransaction: sourceTx,
      sourceOutputIndex: utxo.vout,
      unlockingScriptTemplate: p2pkh,
      sequence: 0,
    });

    tx.addOutput({
      lockingScript: new P2PKH().lock(changeAddress),
      change: true,
      // satoshis: utxo.satoshis,
    });

    await tx.fee();
    await tx.sign();
    return tx;
  }

  async createTx2Outputs(utxo: formatedUtxo, changeAddress: string, address: string): Promise<Transaction> {
    let rawTxHex: string;

    const resp = await this.getRawTxData(utxo.txid);

    rawTxHex = resp.data;

    const tx = new Transaction();

    const sourceTx = Transaction.fromHex(rawTxHex);

    const p2pkh = new P2PKH().unlock(this.privateKey);

    tx.addInput({
      sourceTransaction: sourceTx,
      sourceOutputIndex: utxo.vout,
      unlockingScriptTemplate: p2pkh,
      sequence: 0,
    });

    tx.addOutput({
      lockingScript: new P2PKH().lock(changeAddress),
      change: true,
    });

    tx.addOutput({
      lockingScript: new P2PKH().lock(address),
      change: false,
      satoshis: 1,
    });

    await tx.fee();
    await tx.sign();
    return tx;
  }

  async buildTx(): Promise<Transaction> {
    let utxos = await this.getAddressUtxosWoC();

    const randomItem = Math.floor(Math.random() * utxos.length);
    const utxo = utxos[randomItem];

    let tx = await this.createTx1Output(utxo, this.privateKey.toAddress());

    return tx;
  }

  async sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async buildTxs(): Promise<Transaction[]> {
    let utxos = await this.getAddressUtxosWoC();

    const txsCount = 10;

    let index = Math.floor(Math.random() * utxos.length - txsCount);

    let txs = [];

    for (let i = 0; i < txsCount; i++) {
      const utxo = utxos[index];

      let tx = await this.createTx1Output(utxo, this.privateKey.toAddress());

      txs.push(tx);

      index++;

      await this.sleep(2000);
    }

    return txs;
  }

  async build2ConflictingTx(): Promise<Transaction[]> {
    let utxos = await this.getAddressUtxosWoC();

    const randomItem = Math.floor(Math.random() * utxos.length);
    const utxo = utxos[randomItem];

    let tx1 = await this.createTx2Outputs(utxo, this.privateKey.toAddress(), PrivateKey.fromRandom().toAddress());
    let tx2 = await this.createTx2Outputs(utxo, this.privateKey.toAddress(), PrivateKey.fromRandom().toAddress());

    return [tx1, tx2];
  }
}
