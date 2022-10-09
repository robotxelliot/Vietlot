const { Resolver } = require("@ethersproject/providers")
const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Vietlot Staging Test", function () {
          let vietlot, vietlotEntranceFee, deployer
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              vietlotEntranceFee = await vietlot.getEntranceFee()
          })
          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  console.log("Setting up test...")
                  const startingTimeStamp = await vietlot.getLastTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter vietlot
                      // Just in case the blokchain moves REALLY fast
                      vietlot.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await vietlot.getRecentWinner()
                              const vietlotState = await vietlot.getVietlotState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await vietlot.getLastTimeStamp()
                              await expect(vietlot.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(vietlotState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // Then entering the vietlot
                      console.log("Entering Vietlot...")
                      const tx = await vietlot.enterVietlot({ value: vietlotEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
