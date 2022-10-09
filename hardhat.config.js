require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("hardhat-deploy")
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const REPORT_GAS = process.env.REPORT_GAS || false

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 5,
        },
        // mainnet: {
        //     url: MAINNET_RPC_URL,
        //     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
        //     saveDeployments: true,
        //     chainId: 1,
        // },
        // polygon: {
        //     url: POLYGON_MAINNET_RPC_URL,
        //     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
        //     saveDeployments: true,
        //     chainId: 137,
        // },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.4.24",
            },
        ],
    },
    mocha: {
        setTimeout: 500000,
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            rinkeby: ETHERSCAN_API_KEY,
            goerli: ETHERSCAN_API_KEY,
            // polygon: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    // contractSizer: {
    //   runOnCompile: false,
    //   only: ["Vietlot"]
    // },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
}
