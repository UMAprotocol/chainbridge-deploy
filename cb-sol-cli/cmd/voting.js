const ethers = require('ethers');
const constants = require('../constants');

const {Command} = require('commander');
const {
    setupParentArgs, 
    waitForTx, 
    log, 
    stringToBytes32
} = require("./utils")

const requestPriceCmd = new Command("request-price")
    .description("Initiates a bridged price request from sink to source oracle")
    .option('--time <value>', 'Request timestamp', Date.now())
    .option('--identifier <string>', 'Request identifier', "Test Identifier")
    .option('--ancillary <string>', 'Request ancillary data', "message: test ancillary data")
    .option('--sinkOracle <address>', 'Address for SinkOracle', constants.BRIDGE_ADDRESS)
    .action(async function (args) {
        await setupParentArgs(args, args.parent.parent)
        args.decimals = args.parent.decimals
        const identifier = stringToBytes32(args.identifier);
        const ancillaryData = stringToBytes32(args.ancillary);

        // Instances
        const oracleInstance = new ethers.Contract(args.sinkOracle, constants.ContractABIs.SinkOracle.abi, args.wallet);
        log(args, `Initiating price request:`)
        log(args, `  Identifier: ${identifier}`)
        log(args, `  Request Time: ${args.time}`)
        log(args, `  Ancillary Data: ${ancillaryData}`)

        // Requesting price should call Bridge.deposit()
        let tx = await oracleInstance.requestPrice(
            identifier,
            args.time,
            ancillaryData,
            { gasPrice: args.gasPrice, gasLimit: args.gasLimit}
        );

        await waitForTx(args.provider, tx.hash)
    })

const pushPriceCmd = new Command("push-price")
    .description("Publishes a cross-chain price from source to sink")
    .option('--dest <id>', "Destination chain ID", 1)
    .option('--time <value>', 'Request timestamp', Date.now())
    .option('--identifier <string>', 'Request identifier', "Test Identifier")
    .option('--ancillary <string>', 'Request ancillary data', "message: test ancillary data")
    .option('--price <value>', 'Price to push', 666)
    .option('--sourceOracle <address>', 'Address for SourceOracle', constants.BRIDGE_ADDRESS)
    .option('--mockOracle <address>', 'Address for MockOracle', constants.BRIDGE_ADDRESS)
    .action(async function (args) {
        await setupParentArgs(args, args.parent.parent)
        args.decimals = args.parent.decimals
        const identifier = stringToBytes32(args.identifier);
        const ancillaryData = stringToBytes32(args.ancillary);

        // Instances
        const sourceOracle = new ethers.Contract(args.sourceOracle, constants.ContractABIs.SourceOracle.abi, args.wallet);
        const mockOracle = new ethers.Contract(args.mockOracle, constants.ContractABIs.MockOracle.abi, args.wallet);

        if (!(await mockOracle.hasPrice(identifier, args.time, ancillaryData))) {
            log(args, `Resolving price on MockOracle:`)
            let resolvePriceTx = await mockOracle.pushPrice(identifier, args.time, ancillaryData, args.price, { gasPrice: args.gasPrice, gasLimit: args.gasLimit})
            await waitForTx(args.provider, resolvePriceTx.hash)
            log(args, `Resolved new price: ${price}`)  
        } else {
            log(args, `Mock oracle already has a price, not using the input price: ${args.price}`)
        }

        log(args, `Publishing price from MockOracle to SourceOracle:`)
        log(args, `  Identifier: ${identifier}`)
        log(args, `  Request Time: ${args.time}`)
        log(args, `  Ancillary Data: ${ancillaryData}`)

        // Make the deposit
        let tx = await sourceOracle.publishPrice(
            args.dest,
            identifier,
            args.time,
            ancillaryData,
            { gasPrice: args.gasPrice, gasLimit: args.gasLimit}
        );

        await waitForTx(args.provider, tx.hash)
    })


const votingCmd = new Command("voting")
votingCmd.addCommand(requestPriceCmd)
votingCmd.addCommand(pushPriceCmd)

module.exports = votingCmd
