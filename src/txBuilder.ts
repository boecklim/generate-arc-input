import {
  PrivateKey,
  PublicKey,
  P2PKH,
  Transaction,
} from "@bsv/sdk";
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
  wocURL: string

  constructor(privkey: string, network: string, wocURL: string) {
    this.privateKey = PrivateKey.fromString(privkey);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = this.privateKey.toAddress(network).toString();
    this.wocURL = wocURL
  }

  async getAddressUnspentUtxosWoC(address: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `${this.wocURL}/address/${address}/unspent`,
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

  async getAddressUtxosWoC(): Promise<formatedUtxo[]> {
    let utxos: wocUtxo[];

    const resp = await this.getAddressUnspentUtxosWoC(this.address);

    utxos = resp.data;

    let formatedUtxos: formatedUtxo[] = [];
    let formatedUtxo: formatedUtxo;
    for (const utxo of utxos) {
      if (utxo.value <= 1) {
        continue;
      }

      formatedUtxo = {
        txid: utxo.tx_hash,
        vout: utxo.tx_pos,
        satoshis: utxo.value,
      };

      formatedUtxos.push(formatedUtxo);
    }
    return formatedUtxos;
  }

  async buildTx(): Promise<Transaction> {
    let utxos = await this.getAddressUtxosWoC();
  
    const randomItem = Math.floor(Math.random() * utxos.length);
    const utxo = utxos[randomItem];

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
      lockingScript: new P2PKH().lock(this.privateKey.toAddress()),
      change: true,
      satoshis: utxo.satoshis,
    });

    await tx.fee();
    await tx.sign();
    return tx;
  }
}
