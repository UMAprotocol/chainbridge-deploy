const ethers = require('ethers');
const constants = require('../constants');

const {Command} = require('commander');
const {
    setupParentArgs, 
    waitForTx, 
    log, 
    stringToBytes32, 
    abiEncode, 
    createGenericDepositData
} = require("./utils")

const requestPriceCmd = new Command("request-price")
    .description("Initiates a bridged price request")
    .option('--dest <id>', "Destination chain ID", 1)
    .option('--time <value>', 'Request timestamp', Date.now())
    .option('--identifier <string>', 'Request identifier', "Test Identifier")
    .option('--ancillary <string>', 'Request ancillary data', "message: test ancillary data")
    .option('--bridge <address>', 'Bridge contract address', constants.BRIDGE_ADDRESS)
    .option('--resourceId <id>', 'ResourceID for request price', constants.ERC20_RESOURCEID)
    .action(async function (args) {
        await setupParentArgs(args, args.parent.parent)
        args.decimals = args.parent.decimals
        const identifier = stringToBytes32(args.identifier);
        const ancillaryData = stringToBytes32(args.ancillary);

        // Instances
        const bridgeInstance = new ethers.Contract(args.bridge, constants.ContractABIs.Bridge.abi, args.wallet);
        const depositData = createRequestPriceProposalData(args.time, identifier, ancillaryData)
         log(args, `Constructed deposit:`)
        log(args, `  Resource Id: ${args.resourceId}`)
        log(args, `  Identifier: ${identifier}`)
        log(args, `  Request Time: ${args.time}`)
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

const pushPriceCmd = new Command("push-price")
    .description("Resolves a bridged price request and publishes a cross-chain price")
    .option('--dest <id>', "Destination chain ID", 1)
    .option('--time <value>', 'Request timestamp', Date.now())
    .option('--identifier <string>', 'Request identifier', "Test Identifier")
    .option('--ancillary <string>', 'Request ancillary data', "message: test ancillary data")
    .option('--price <value>', 'Price to push', 666)
    .option('--bridge <address>', 'Bridge contract address', constants.BRIDGE_ADDRESS)
    .option('--resourceId <id>', 'ResourceID for request price', constants.ERC20_RESOURCEID)
    .action(async function (args) {
        await setupParentArgs(args, args.parent.parent)
        args.decimals = args.parent.decimals
        const identifier = stringToBytes32(args.identifier);
        const ancillaryData = stringToBytes32(args.ancillary);

        // Instances
        const bridgeInstance = new ethers.Contract(args.bridge, constants.ContractABIs.Bridge.abi, args.wallet);
        const depositData = createPushPriceData(args.time, identifier, ancillaryData, args.price)
        log(args, `Constructed deposit:`)
        log(args, `  Resource Id: ${args.resourceId}`)
        log(args, `  Identifier: ${identifier}`)
        log(args, `  Request Time: ${args.time}`)
        log(args, `  Ancillary Data: ${ancillaryData}`)
        log(args, `  Price: ${args.price}`)
        log(args, `  Raw: ${depositData}`)
        log(args, `Creating deposit to initiate price resolution!`);

        // Make the deposit
        let tx = await bridgeInstance.deposit(
            args.dest, // destination chain id
            args.resourceId,
            depositData,
            { gasPrice: args.gasPrice, gasLimit: args.gasLimit}
        );

        await waitForTx(args.provider, tx.hash)
    })

const createPushPriceData = (time, identifier, ancillaryData, price) => {
        const encodedMetaDataProposal = abiEncode(
            ["bytes32", "uint256", "bytes", "int256"],
            [identifier, time, ancillaryData, price]
        );
        return createGenericDepositData(encodedMetaDataProposal);
    }

const createRequestPriceProposalData = (time, identifier, ancillaryData) => {
        const encodedMetaDataProposal = abiEncode(
            ["bytes32", "uint256", "bytes"],
            [identifier, time, ancillaryData]
        );
        return createGenericDepositData(encodedMetaDataProposal);
    }

const votingCmd = new Command("voting")
votingCmd.addCommand(requestPriceCmd)
votingCmd.addCommand(pushPriceCmd)

module.exports = votingCmd
