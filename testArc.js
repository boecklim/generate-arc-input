const bsv = require('bsv')
const axios = require('axios');
require('bitcoin-ef/bsv')
require('dotenv').config();
const ArcClient  = require('@bitcoin-a/arc-client').ArcClient;

const arcURLTestnet = 'https://test-api.taal.com/arc'
const arcURLMainnet = 'https://api.taal.com/arc'
const apikeyTestnet = process.env.APIKEY_TESTNET
const apikeyMainnet = process.env.APIKEY_MAINNET
const privkey = process.env.PRIV_KEY
const wocURLTestnet = 'https://api.whatsonchain.com/v1/bsv/test'
const wocURLMainnet = 'https://api.whatsonchain.com/v1/bsv/main'

var wocURL = wocURLTestnet
var apikey = apikeyTestnet
var arcURL = arcURLTestnet
var network = 'testnet'
var print = false
var extended = false

class TestArc {
	constructor() {
        this.privateKey = bsv.PrivateKey.fromString(privkey);
        this.address = bsv.Address.fromPrivateKey(this.privateKey, network).toString();
		this.p2pkhOut = bsv.Script.buildPublicKeyHashOut(this.address).toHex();
		this.pkh = bsv.Address.fromString(this.address).toJSON().hash;
        this.utxos = []
    }

	async getAddressUnspentUtxosWoC(address) {
		const res = await axios({
			method: 'get',
			url: `${wocURL}/address/${address}/unspent`
		});
		return res.data;
	}

	async getAddressBalanceWoC(address) {
		const res = await axios({
			method: 'get',
			url: `${wocURL}/address/${address}/balance`
		});
		return res.data;
	}

	async printAddress() {
		console.log(this.address)
	}

	async getAddressHistoryWoC() {
		const address = this.address
		const res = await axios({
			method: 'get',
			url: `${wocURL}/address/${address}/history`
		});
		return res.data;
	}

	async getTransactionStatusWoC(txid) {
		const res = await axios({
			method: 'get',
			url: `${wocURL}/tx/hash/${txid}`
		});
		return res.data;
	}

	async getTransactionsStatusWoC(transactionIDs) {
		const json = JSON.stringify({ txids: transactionIDs });
		const res = await axios.post(`${wocURL}/txs/status`, json);
		return res.data;
	}

	async getAddressUtxosWoC() {
		const utxos = await this.getAddressUnspentUtxosWoC(this.address);
		const formatedUtxos = [];
		for (const utxo of utxos) {
			if (utxo.value <= 1)  {
				continue;
			}
			const formatedUtxo = {
				txid: utxo.tx_hash,
				vout: utxo.tx_pos,
				satoshis: utxo.value,
				script: this.p2pkhOut
			};
			formatedUtxos.push(formatedUtxo);
		}
		return formatedUtxos;
	}

	async splitUtxo (targetnumber) {
		const utxo = this.utxos.pop()
        const tx = bsv.Transaction()
        tx.from(utxo)
		let splitSatoshis = Math.floor(utxo.satoshis / targetnumber)
		for (let i = 1; i < targetnumber; i++) {
			tx.to(this.address, splitSatoshis)
		}
        tx.to(this.address, splitSatoshis - 2.5 * targetnumber) // leave 10 sats for fees - 1 input 1 output
        tx.sign(this.privateKey)

		if (extended) {
			return tx.toExtended('hex')
		}
	    return tx
	}

    async buildTx () {
		const utxo = this.utxos.shift()
        const tx = bsv.Transaction()
        tx.from(utxo)
        tx.to(this.address, utxo.satoshis - 1) // leave 10 sats for fees - 1 input 1 output
        tx.sign(this.privateKey)

		if (extended) {
			return tx.toExtended('hex')
		}

	    return tx
    }

	async buildMultiTx () {
		let numOfTx = 1
		if(this.utxos.length < 10){
			numOfTx = this.utxos.length
		} else {
			numOfTx = 10
		}
		const allTxs = []
		for(let i = 0; i < numOfTx; i++){
			const tx = await this.buildTx()
			allTxs.push(tx)
		}
		return allTxs
    }
}

const splitUtxo = async () => {
	const test = new TestArc()
    test.utxos = await test.getAddressUtxosWoC()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)
	
	const splitTx = await test.splitUtxo(10)
	if (print) {
		console.log(splitTx.toString())
		return
	}
	try {
		const txRes = await arcClient.postTransaction(splitTx)
		console.log('Transaction Response: ',txRes)
	} catch (err) {
		console.log('error: ', err)
	}	
}

// run 1 single test
const submit1Tx = async () => {
    const test = new TestArc()
    test.utxos = await test.getAddressUtxosWoC()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)
	
	const tx = await test.buildTx()
	if (print) {
		console.log(tx.toString())
		return
	}
	try {
		const txRes = await arcClient.postTransaction(tx)
		console.log('Transaction Response: ',txRes)
	} catch (err) {
		console.log('error: ', err)
	}
}

// run multi broadcast test
const submitMultipleTx = async () => {
    const test = new TestArc()
    test.utxos = await test.getAddressUtxosWoC()
    const txs = await test.buildMultiTx()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)

	if (print) {
		txsJson = txs.map(tx => {return {rawTx: tx}})
		var dictstring = JSON.stringify(txsJson)
		console.log(dictstring)
		return
	}
	
	try {
		const txRes = await arcClient.postTransactions(txs)
		console.log('Transaction Response: ',txRes)
	} catch (err) {
		console.log('error: ', err)
	}	
}

const getAddressUtxos = async () => {
	const test = new TestArc()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)

	test.utxos = await test.getAddressUtxosWoC()
	
	const rows = []

	for(let i = 0; i < test.utxos.length; i++){ 
		const utxo = test.utxos[i]

		rows.push({txid: utxo.txid, vout: utxo.vout, satoshis: utxo.satoshis})
	}

	console.table(rows)
}

const getAddressBalanceWoC = async () => {
	const test = new TestArc()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)
	balance = await test.getAddressBalanceWoC(test.address)

	console.table(balance)
}

const getTxStatus = async () => {
	const test = new TestArc()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)

	test.utxos = await test.getAddressUtxosWoC()
	
	const distinctUtxos = [...new Set(test.utxos.map(item => item.txid))]

	const wocRes = await test.getTransactionsStatusWoC(distinctUtxos)

	const rows = []

	for(let i = 0; i < distinctUtxos.length; i++){ 
		const txid = distinctUtxos[i]
		const arcRes = await arcClient.getTransactionStatus(txid)

		const wocResRow = wocRes.find(function(post, index) {
			if(post.txid == txid)
				return true;
		});

		const blockHashWoc = wocResRow.blockhash

		rows.push({txid: txid, arc: arcRes.blockHash, woc: blockHashWoc})
	}

	console.table(rows)
}


// print the address from the specified private key
const printAddress = async () => {
	const test = new TestArc()
	const arcClient = new ArcClient(arcURL);
	test.printAddress()
}

// print status of the 20 last transactions
const getTxStatusHistory = async () => {
	const test = new TestArc()
	const arcClient = new ArcClient(arcURL);
	arcClient.setAuthorization(apikey)

	const wocRes = await test.getAddressHistoryWoC()

	let wocResLast20 = wocRes.sort((w1, w2) => (w1.height < w2.height) ? 1 : (w1.height > w2.height) ? -1 : 0).slice(0,20)
	
	const distinctUtxos = [...new Set(wocResLast20.map(item => item.tx_hash))]

	const rows = []

	for(let i = 0; i < distinctUtxos.length; i++){ 
		const txid = distinctUtxos[i]

		let blockHeightArc
		let txStatusArc
		try {
			const arcRes = await arcClient.getTransactionStatus(txid)
			blockHeightArc = arcRes.blockHeight
			txStatusArc = arcRes.txStatus
		} catch (error) {
			blockHeightArc = 0
			txStatusArc = 'not found'
		}

		const wocResRow = wocResLast20.find(function(post, index) {
			if(post.tx_hash == txid)
				return true;
		});

		const blockHeightWoc = wocResRow.height
		const txidString = txid
		rows.push({txid: txidString, blockHeightArc: blockHeightArc, txStatusArc: txStatusArc, blockHeightWoc: blockHeightWoc})
	}
	console.log("block height")
	console.table(rows)
}

for (let index = 0; index < process.argv.length; index++) {
	const element = process.argv[index];
	switch (element) {
		case "--main":
			wocURL = wocURLMainnet
			apikey = apikeyMainnet
			arcURL = arcURLMainnet
			network = 'mainnet'					
			break;

		case "--extended":
			extended = true
			break;

		case "--print":
			print = true
			break;
		default:
			break;
	}
}

const command = process.argv[process.argv.length - 1]

switch (command) {
	case 'submit1Tx':
		submit1Tx()
		break;
	case 'submitMultipleTx':
		submitMultipleTx()
		break;
	case 'splitUtxo':
		splitUtxo()
		break;
	case 'printAddress':
		printAddress()
		break;
	case 'getAddressUtxos':
		getAddressUtxos()
		break;
	case 'getTxStatus':
		getTxStatus()
		break;
	case 'getTxStatusHistory':
		getTxStatusHistory()
		break;
	case 'getAddressBalanceWoC':
		getAddressBalanceWoC()
		break;

	default:
		console.log('error: {} not a valid command', command)
		break;

	}
	
module.exports = TestArc;

