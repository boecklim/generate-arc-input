import { ARC, ArcConfig, PrivateKey } from "@bsv/sdk";
import * as dotenv from "dotenv";
import { TxBuilder } from "./txBuilder";

dotenv.config();

const wocURLTestnet = "https://api.whatsonchain.com/v1/bsv/test";
const wocURLMainnet = "https://api.whatsonchain.com/v1/bsv/main";

var wocURL = wocURLTestnet;

let apiKey: string;
let arcURL: string;
let callbackURL: string;
let callbackToken: string;
let waitFor: string;
let maxTimeout: string;
const privkey: string = process.env.PRIV_KEY || ""

var network = "testnet";
let print: boolean = false;
let extended: boolean = false;
let fullStatusUpdates: boolean = false;
let allowBatch: boolean = false;

const getArcConfig = (): ArcConfig => {
  const cfg: ArcConfig = {};

  if (apiKey !== undefined) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = apiKey;
  }

  if (callbackURL !== undefined) {
    cfg.callbackUrl = callbackURL;
  }

  if (callbackToken !== undefined) {
    cfg.callbackToken = callbackToken;
  }

  if (waitFor !== undefined) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["X-WaitFor"] = waitFor;
  }

  if (maxTimeout !== undefined) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["X-MaxTimeout"] = maxTimeout;
  }

  if (fullStatusUpdates) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["X-FullStatusUpdates"] = "true";
  }

  if (allowBatch) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["X-CallbackBatch"] = "true";
  }

  return cfg;
};

// submit a single tx which is paying pack to same address
const submitTx = async () => {
  if (arcURL === undefined && !print) {
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

  const arc: ARC = new ARC(arcURL, getArcConfig());

  try {
    const startTime = Date.now();
    const txRes = await arc.broadcast(tx);
    const elapsedMs = Date.now() - startTime;

    console.log("broadcast took", elapsedMs, "ms");
    console.log(txRes);
  } catch (err) {
    console.log("error: ", err);
  }
};

// submit 10 txs which is paying pack to same address
const submitTxs = async () => {
  if (arcURL === undefined && !print) {
    throw new EvalError("arc URL not given");
  }

  const test = new TxBuilder(privkey, network, wocURL);

  const txs = await test.buildTxs();

  if (extended) {
    txs.forEach((element) => {
      element.toEF();
    });
  }

  if (print) {
    let txsJson
    if (extended) {
      txsJson = txs.map((tx) => {
        return { rawTx: tx.toHexEF() };
      });
    } else {
      txsJson = txs.map((tx) => {
        return { rawTx: tx.toHex() };
      });
    }

    var dictstring = JSON.stringify(txsJson);
    console.log(dictstring);
    return;
  }

  const arc: ARC = new ARC(arcURL, getArcConfig());

  try {
    const startTime = Date.now();
    const txRes = await arc.broadcastMany(txs);
    const elapsedMs = Date.now() - startTime;

    console.log("broadcastMany took", elapsedMs, "ms");
    console.log(txRes);
  } catch (err) {
    console.log("error: ", err);
  }
};

// submit 2 conflicting txs
const submit2ConflictingTxs = async () => {
  if (arcURL === undefined && !print) {
    throw new EvalError("arc URL not given");
  }

  const test = new TxBuilder(privkey, network, wocURL);

  const txs = await test.build2ConflictingTx();

  if (extended) {
    txs.forEach((element) => {
      element.toEF();
    });
  }

  if (print) {
    let txsJson = txs.map((tx) => {
      return { rawTx: tx.toHex() };
    });

    var dictstring = JSON.stringify(txsJson);
    console.log(dictstring);
    return;
  }

  const arc: ARC = new ARC(arcURL, getArcConfig());

  try {
    const txRes = await arc.broadcastMany(txs);
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

// print the private key as wif
const printWIF = async () => {
  const test = new TxBuilder(privkey, network, wocURL);
  test.printPrivKeyWIF();
};

// print the private key as hex
const printPrivKeyHex = async () => {
  const test = new TxBuilder(privkey, network, wocURL);
  test.printPrivKeyHex();
};

const printHelp = async () => {
  console.log("commands:");
  console.log("\t submitTx:\t\t Submit 1 transaction to ARC");
  console.log("\t submitTxs:\t\t Submit 10 transactions to ARC");
  console.log("\t printNewPrivateKey:\t Create and print a new random private key");
  console.log("\t printPrivKeyWIF:\t Print private key in WIF format");
  console.log("\t printPrivKeyHex:\t Print private key as hex string");
  console.log("\t printAddress:\t\t Print the address of the given private key");
  console.log("\t help:\t\t\t Print this help");
  console.log("flags:");
  console.log("\t --main | -m:\t\t\t Use mainnet");
  console.log("\t --extended | -e:\t\t Run command with extended format");
  console.log("\t --fullStatusUpdates | -f:\t Run command with full status updates");
  console.log("\t --print | -p:\t\t\t Do not submit any transactions but print them");
  console.log("\t --arcURL=XXX:\t\t\t URL of ARC instance to be used");
  console.log("\t --callbackURL=XXX:\t\t Callback URL to be used");
  console.log("\t --callbackToken=XXX:\t\t Callback token to be used");
  console.log("\t --waitFor=XXX:\t\t\t Transaction status to be waited For");
  console.log("\t --apiKey=XXX:\t\t\t API key to be sent as Authorization header");
  console.log("\t --maxTimeout=XXX:\t\t\t Maximum time to wait to receive response in seconds");
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

    case "--batch-callback":
      allowBatch = true;
      break;
    case "-b":
      allowBatch = true;
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

  if (element.startsWith("--maxTimeout")) {
    const maxTimeoutFlag = element.split("=");
    if (maxTimeoutFlag.length >= 2) {
      maxTimeout = maxTimeoutFlag[1];
    }
    continue;
  }

  if (element.startsWith("--waitFor")) {
    const waitForFlag = element.split("=");
    if (waitForFlag.length >= 2) {
      waitFor = waitForFlag[1];
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

  case "submitTxs":
    submitTxs();
    break;

  case "submit2ConflictingTxs":
    submit2ConflictingTxs();
    break;

  case "printNewPrivateKey":
    printNewPrivateKey();
    break;

  case "printAddress":
    printAddress();
    break;

  case "printPrivKeyWIF":
    printWIF();
    break;

  case "printPrivKeyHex":
    printPrivKeyHex();
    break;

  case "help":
    printHelp();
    break;

  default:
    console.log("error: {} not a valid command", command);
    break;
}
