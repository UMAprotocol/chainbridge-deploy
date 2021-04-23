const ethers = require('ethers');
const { hexZeroPad, hexlify, keccak256, toUtf8Bytes, parseUnits } = ethers.utils;
const AbiCoder = new ethers.utils.AbiCoder();
const fs = require('fs');

const setupParentArgs = async (args, parent) => {
    args.url= parent.url
    if (!parent.networkId) {
        args.provider = new ethers.providers.JsonRpcProvider(args.url);
    } else {
        args.provider = new ethers.providers.JsonRpcProvider(args.url, {
            name: "custom",
            chainId: Number(parent.networkId)
        });
    }
    args.gasLimit = hexlify(Number(parent.gasLimit))
    args.gasPrice = hexlify(Number(parent.gasPrice))
    if (!parent.jsonWallet) {
        args.wallet = new ethers.Wallet(parent.privateKey, args.provider);
    } else {
        const raw = fs.readFileSync(parent.jsonWallet);
        const keyfile = JSON.parse(raw);
        args.wallet = await ethers.Wallet.fromEncryptedJson(keyfile, parent.jsonWalletPassword)
    }
}

const splitCommaList = (str) => {
    return str.split(",")
}

const getFunctionBytes = (sig) => {
    return keccak256(hexlify(toUtf8Bytes(sig))).substr(0, 10)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const waitForTx = async (provider, hash) => {
    console.log(`Waiting for tx: ${hash}...`)
    while (!await provider.getTransactionReceipt(hash)) {
        sleep(5000)
    }
}

const expandDecimals = (amount, decimals = 18) => {
    return parseUnits(String(amount), decimals);
}

// from: https://github.com/ethers-io/ethers.js/issues/207
function stringToBytes32(text) {
    let result = toUtf8Bytes(text)
    if (result.length > 32) { throw new Error('String too long') }
    result = hexlify(result);
    while (result.length < 66) { result += '0'; }
    if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
    return result;
}

const abiEncode = (valueTypes, values) => {
    return AbiCoder.encode(valueTypes, values);
};
  
const toHex = (numberOrBigNumberOrHexStringOrArrayish, padding) => {
    return hexZeroPad(hexlify(numberOrBigNumberOrHexStringOrArrayish), padding);
};

const createGenericDepositData = hexMetaData => {
    if (hexMetaData === null) {
      return "0x" + toHex(0, 32).substr(2); // len(metaData) (32 bytes)
    }
    const hexMetaDataLength = hexMetaData.substr(2).length / 2;
    return "0x" + toHex(hexMetaDataLength, 32).substr(2) + hexMetaData.substr(2);
};

const log = (args, msg) => console.log(`[${args.parent._name}/${args._name}] ${msg}`)

module.exports = {
    setupParentArgs,
    splitCommaList,
    getFunctionBytes,
    waitForTx,
    log,
    expandDecimals,
    stringToBytes32,
    abiEncode,
    toHex,
    createGenericDepositData
}