import {
  PrivateKey,
  PublicKey,
  P2PKH,
  Transaction,
  ARC,
  ArcConfig,
} from "@bsv/sdk";
import axios, { AxiosResponse } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const privkey = process.env.PRIV_KEY;
const wocURLTestnet = "https://api.whatsonchain.com/v1/bsv/test";
const wocURLMainnet = "https://api.whatsonchain.com/v1/bsv/main";

var wocURL = wocURLTestnet;

let apiKey: string;
let arcURL: string;
let callbackURL: string;
let callbackToken: string;

var network = "testnet";
let print: boolean = false;
let extended: boolean = false;
let fullStatusUpdates: boolean = false;

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

class TestArc {
  privateKey: PrivateKey;
  address: string;
  publicKey: PublicKey;

  constructor() {
    this.privateKey = PrivateKey.fromString(privkey);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = this.privateKey.toAddress(network).toString();
  }

  async getAddressUnspentUtxosWoC(address: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `${wocURL}/address/${address}/unspent`,
    });
  }

  async getRawTxData(txID: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `${wocURL}/tx/${txID}/hex`,
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

  async buildTx(utxo: formatedUtxo, fee: number): Promise<Transaction> {
    const version = 1;

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

// submit a single tx which paying pack to same address
const submitTx = async () => {
  if (arcURL == "") {
    throw new EvalError("arc URL not given");
  }

  const test = new TestArc();
  let utxos = await test.getAddressUtxosWoC();

  const randomItem = Math.floor(Math.random() * utxos.length);
  const utxo = utxos[randomItem];
  const tx = await test.buildTx(utxo, 1);

  if (extended) {
    tx.toEF();
  }

  if (print) {
    if (extended) {
      console.log(tx.toHexEF());
    } else {
      console.log(tx.toHex());
    }
    return;
  }

  let cfg: ArcConfig = {};

  if (apiKey != "") {

    if (cfg.headers === undefined) {
      cfg.headers = {
        "Authorization": apiKey,
      };
    } else {
      cfg.headers["Authorization"] = apiKey;
    }
  }

  if (callbackURL != "") {
    cfg.callbackUrl = callbackURL;
  }

  if (callbackToken != "") {
    cfg.callbackToken = callbackToken;
  }

  if (fullStatusUpdates) {
    if (cfg.headers === undefined) {
      cfg.headers = {
        "X-FullStatusUpdates": "true",
      };
    } else {
      cfg.headers["X-FullStatusUpdates"] = "true";
    }
  }

  const arc: ARC = new ARC(arcURL, cfg);

  console.log(
    `submitting tx: api key: ${apiKey}, arc URL: ${arcURL}, callback URL: ${callbackURL}, callback token: ${callbackToken}`
  );

  try {
    const txRes = await tx.broadcast(arc);
    console.log(txRes);
  } catch (err) {
    console.log("error: ", err);
  }
};

// print the address from the specified private key
const printAddress = async () => {
  const test = new TestArc();
  test.printAddress();
};

for (let index = 0; index < process.argv.length; index++) {
  const element = process.argv[index];
  switch (element) {
    case "--main":
      wocURL = wocURLMainnet;
      network = "mainnet";
      break;
    case "-m":
      wocURL = wocURLMainnet;
      network = "mainnet";
      break;

    case "--extended":
      extended = true;
      break;
    case "-e":
      extended = true;
      break;

    case "--fullStatusUpdates":
      fullStatusUpdates = true;
      break;
    case "-f":
      fullStatusUpdates = true;
      break;

    case "--print":
      print = true;
      break;
    case "-p":
      print = true;
      break;
    default:
      break;
  }

  if (element.startsWith("--arcURL")) {
    const arcURLFlag = element.split("=");
    if (arcURLFlag.length >= 2) {
      arcURL = arcURLFlag[1];
    }
    continue;
  }

  if (element.startsWith("--apiKey")) {
    const apiKeyFlag = element.split("=");
    if (apiKeyFlag.length >= 2) {
      apiKey = apiKeyFlag[1];
    }
    continue;
  }

  if (element.startsWith("--callbackURL")) {
    const callbackURLFlag = element.split("=");
    if (callbackURLFlag.length >= 2) {
      callbackURL = callbackURLFlag[1];
    }
    continue;
  }

  if (element.startsWith("--callbackToken")) {
    const callbackTokenFlag = element.split("=");
    if (callbackTokenFlag.length >= 2) {
      callbackToken = callbackTokenFlag[1];
    }
    continue;
  }
}

const command = process.argv[process.argv.length - 1];

switch (command) {
  case "submitTx":
    submitTx();
    break;

  case "printAddress":
    printAddress();
    break;

  default:
    console.log("error: {} not a valid command", command);
    break;
}

module.exports = TestArc;
