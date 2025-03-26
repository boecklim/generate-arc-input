import { ARC, ArcConfig, PrivateKey } from "@bsv/sdk";
import * as dotenv from "dotenv";
import { TxBuilder } from "./txBuilder";

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

// submit a single tx which is paying pack to same address
const submitTx = async () => {
  if (arcURL == "") {
    throw new EvalError("arc URL not given");
  }

  const test = new TxBuilder(privkey, network, wocURL);

  const tx = await test.buildTx();

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
        Authorization: apiKey,
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

  try {
    const txRes = await tx.broadcast(arc);
    console.log(txRes);
  } catch (err) {
    console.log("error: ", err);
  }
};

const printNewPrivateKey = async () => {
  const newPrivateKey = PrivateKey.fromRandom();
  console.log("new private key:\t", newPrivateKey.toString());
  console.log(
    "testnet address:\t",
    newPrivateKey.toAddress("testnet").toString()
  );
  console.log(
    "mainnet address:\t",
    newPrivateKey.toAddress("mainnet").toString()
  );
};

// print the address from the specified private key
const printAddress = async () => {
  const test = new TxBuilder(privkey, network, wocURL);
  test.printAddress();
};

const printHelp = async () => {
    console.log('commands:')
    console.log('\t submitTx:\t\t Submit 1 transaction to ARC')
    console.log('\t printNewPrivateKey:\t Create and print a new random private key')
    console.log('\t printAddress:\t\t Print the address of the given private key')
    console.log('\t help:\t\t\t Print this help')
    
    console.log('flags:')
    console.log('\t --main | -m:\t\t\t Use mainnet')
    console.log('\t --extended | -e:\t\t Run command with extended format')
    console.log('\t --fullStatusUpdates | -f:\t Run command with full status updates')
    console.log('\t --print | -p:\t\t\t Do not submit any transactions but print them')
    console.log('\t --arcURL=XXX:\t\t\t URL of ARC instance to be used')
    console.log('\t --callbackURL=XXX:\t\t Callback URL to be used')
    console.log('\t --callbackToken=XXX:\t\t Callback token to be used')
    console.log('\t --apiKey=XXX:\t\t\t API key to be sent as Authorization header')
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

  case "printNewPrivateKey":
    printNewPrivateKey();
    break;

  case "printAddress":
    printAddress();
    break;

  case "help":
    printHelp();
    break;

  default:
    console.log("error: {} not a valid command", command);
    break;
}
