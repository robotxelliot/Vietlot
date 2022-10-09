const networkConfig = {
    default: {
        name: "hardhat",
        keepersUpdateInterval: "30",
    },
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        keepersUpdateInterval: "30", // 30 gwei
        vietlotEntranceFee: "10000000000000000", // 0.01 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    5: {
        name: "goerli",
        subscriptionId: "2548",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        keepersUpdateInterval: "30", // 30 gwei
        vietlotEntranceFee: "10000000000000000", // 0.01 ETH
        callbackGasLimit: "500000", // 500,000 gas
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATION = 1
const frontEndContractsFile = "../nextjs-web3-vietlot/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-web3-vietlot/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATION,
    frontEndContractsFile,
    frontEndAbiFile,
}
