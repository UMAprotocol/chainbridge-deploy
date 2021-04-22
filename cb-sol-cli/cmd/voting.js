const ethers = require('ethers');
const { hexZeroPad, hexlify } = ethers.utils;
const AbiCoder = new ethers.utils.AbiCoder();
const constants = require('../constants');

const {Command} = require('commander');
const {setupParentArgs, waitForTx, log} = require("./utils")

const identifier = hexZeroPad("0x123", 32)
const ancillaryData = hexZeroPad("0xabc", 32);

const abiEncode = (valueTypes, values) => {
    return AbiCoder.encode(valueTypes, values);
  };
  
const toHex = (covertThis, padding) => {
    return hexZeroPad(hexlify(covertThis), padding);
  };

const createGenericDepositData = hexMetaData => {
    if (hexMetaData === null) {
      return "0x" + toHex(0, 32).substr(2); // len(metaData) (32 bytes)
    }
    const hexMetaDataLength = hexMetaData.substr(2).length / 2;
    return "0x" + toHex(hexMetaDataLength, 32).substr(2) + hexMetaData.substr(2);
  };

const requestPriceCmd = new Command("request-price")
    .description("Initiates a bridged price request")
    .option('--dest <id>', "Destination chain ID", 1)
    .option('--time <value>', 'Request timestamp', 999)
    .option('--bridge <address>', 'Bridge contract address', constants.BRIDGE_ADDRESS)
    .option('--resourceId <id>', 'ResourceID for request price', constants.ERC20_RESOURCEID)
    .action(async function (args) {
        await setupParentArgs(args, args.parent.parent)
        args.decimals = args.parent.decimals
        const requestTime = args.time;

        // Instances
        const bridgeInstance = new ethers.Contract(args.bridge, constants.ContractABIs.Bridge.abi, args.wallet);
        const depositData = createRequestPriceProposalData(requestTime)
 
        log(args, `Constructed deposit:`)
        log(args, `  Resource Id: ${args.resourceId}`)
        log(args, `  Identifier: ${identifier}`)
        log(args, `  Request Time: ${requestTime}`)
        log(args, `  Ancillary Data: ${ancillaryData}`)
        log(args, `  Raw: ${depositData}`)
        log(args, `Creating deposit to initiate price request!`);

        // Make the deposit
        let tx = await bridgeInstance.deposit(
            args.dest, // destination chain id
            args.resourceId,
            depositData,
            { gasPrice: args.gasPrice, gasLimit: args.gasLimit}
        );

        await waitForTx(args.provider, tx.hash)
    })

const createRequestPriceProposalData = (time) => {
        const encodedMetaDataProposal = abiEncode(
            ["bytes32", "uint256", "bytes"],
            [identifier, time, ancillaryData]
        );    
        return createGenericDepositData(encodedMetaDataProposal);
    }

const proposalDataHashCmd = new Command("request-price-data-hash")
    .description("Hash the proposal data for a price request")
    .option('--time <value>', "Request timestamp", 999)
    .option('--handler <address>', 'Generic handler  address', constants.GENERIC_HANDLER_ADDRESS)
    .action(async function(args) {
        const data = createRequestPriceProposalData(args.time)
        const hash = ethers.utils.solidityKeccak256(["address", "bytes"], [args.handler, data])

        log(args, `Hash: ${hash} Data: ${data}`)
    })

const votingCmd = new Command("voting")
votingCmd.addCommand(requestPriceCmd)
votingCmd.addCommand(proposalDataHashCmd)

module.exports = votingCmd
