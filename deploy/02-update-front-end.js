const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const fs = require("fs")
const { network, ethers } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const vietlot = await ethers.getContract("Vietlot")
    fs.writeFileSync(frontEndAbiFile, vietlot.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const vietlot = await ethers.getContract("Vietlot")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (network.config.chainId.toString() in contractAddresses) {
        if (!contractAddresses[network.config.chainId.toString()].includes(vietlot.address)) {
            contractAddresses[network.config.chainId.toString()].push(vietlot.address)
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [vietlot.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}
module.exports.tags = ["all", "frontend"]
