import {
    ARC,
    ArcConfig,
  } from "@bsv/sdk";
  import axios, { AxiosResponse } from "axios";
  import * as dotenv from "dotenv";
  import { TxBuilder } from "./txBuilder"
  
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
  
  
  // submit a single tx which paying pack to same address
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
    const test = new TxBuilder(privkey, network, wocURL);
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
  