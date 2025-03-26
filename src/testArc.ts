import { PrivateKey, PublicKey, P2PKH, Transaction, ARC } from "@bsv/sdk";
import axios, { AxiosResponse } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const arcURLTestnet = process.env.TESTNET_URL;
const arcURLMainnet = process.env.MAINNET_URL;
// const arcURLMainnet2 = process.env.MAINNET_URL_2;
const apikeyTestnet = process.env.APIKEY_TESTNET;
const apikeyMainnet = process.env.APIKEY_MAINNET;
const privkey = process.env.PRIV_KEY;
const wocURLTestnet = "https://api.whatsonchain.com/v1/bsv/test";
const wocURLMainnet = "https://api.whatsonchain.com/v1/bsv/main";

var wocURL = wocURLTestnet;
var apikey = apikeyTestnet;
var arcURL = arcURLTestnet;

var network = "testnet";
var print = false;
var extended = false;

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

  async printAddress() {
    console.log(this.address);
  }

  getAddressUtxosWoC(): formatedUtxo[] {
    let utxos: wocUtxo[];

    axios
      .get(`${wocURL}/address/${this.address}/unspent`)
      .then((response: AxiosResponse<wocUtxo[]>) => {
        utxos = response.data;
      })
      .catch((error) => {
        console.error(error);
      });

    let formatedUtxos: formatedUtxo[];
    for (const utxo of utxos) {
      if (utxo.value <= 1) {
        continue;
      }
      let formatedUtxo: formatedUtxo = {
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

    const tx = new Transaction();

    tx.addInput({
      sourceTransaction: Transaction.fromHex(utxo.txid),
      sourceOutputIndex: utxo.vout,
      unlockingScriptTemplate: new P2PKH().unlock(this.privateKey),
      sequence: 0,
    });

    tx.addOutput({
      lockingScript: new P2PKH().lock(this.privateKey.toAddress()),
      change: true,
      satoshis: utxo.satoshis - fee,
    });

    await tx.fee();
    await tx.sign();
    return tx;
  }
}

// run 1 single test
const submitTx = async () => {
  const test = new TestArc();
  let utxos = test.getAddressUtxosWoC();

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
  try {
    const txRes = await tx.broadcast(new ARC(arcURL, apikey));
    console.log("Transaction Response: ", txRes);
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
      apikey = apikeyMainnet;
      arcURL = arcURLMainnet;
      network = "mainnet";
      break;

    case "--extended":
      extended = true;
      break;

    case "--print":
      print = true;
      break;
    default:
      break;
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
