const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Vietlot Unit Tests", function () {
          let vietlot, vietlotContract, vrfCoordinatorV2Mock, vietlotEntranceFee, interval, player
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              player = accounts[1]
              // Deploys modules with the tags "mocks" and "vietlot"
              await deployments.fixture(["mocks", "vietlot"])
              // Returns a new connection to the VRFCoordinatorV2Mock contract
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              // Returns a new connection to the Vietlot contract
              vietlotContract = await ethers.getContract("Vietlot")
              // Returns a new instance of the Vietlot contract connected to player
              vietlot = vietlotContract.connect(player)
              vietlotEntranceFee = await vietlot.getEntranceFee()
              interval = await vietlot.getInterval()
          })

          describe("constructor", function () {
              it("initializes the vietlot correctly", async () => {
                  const vietlotState = (await vietlot.getVietlotState()).toString()
                  // Comparisions for Vietlot initialization:
                  assert.equal(vietlotState, "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["keepersUpdateInterval"]
                  )
              })
          })

          describe("enterVietlot", function () {
              it("reverts when you don't pay enough", async () => {
                  await expect(vietlot.enterVietlot()).to.be.revertedWithCustomError(
                      vietlot,
                      // is reverted when not paid enough or raffle is not open
                      "Vietlot__SendMoreToEnterVietlot"
                  )
              })

              it("records player when they enter", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  const contractPlayer = await vietlot.getPlayer(0)
                  assert.equal(player.address, contractPlayer)
              })

              it("emits event on enter", async () => {
                  await expect(vietlot.enterVietlot({ value: vietlotEntranceFee })).to.emit(
                      vietlot,
                      "VietlotEnter"
                  )
              })

              it("doesn't allow entrance when vietlot is calculating", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })

                  // Pretend to be a keeper for a second
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  // changes the state to calculating for our comparison below
                  await vietlot.performUpkeep([])
                  await expect(
                      vietlot.enterVietlot({ value: vietlotEntranceFee })
                  ).to.be.revertedWithCustomError(vietlot, "Vietlot__VietlotNotOpen")
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  // ask a node to pretend that a call is not state-changing and return the result.
                  const { upkeepNeeded } = await vietlot.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })

              it("returns false if vietlot isn't open", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await vietlot.performUpkeep([])
                  const vietlotState = await vietlot.getVietlotState()
                  const { upkeepNeeded } = await vietlot.callStatic.checkUpkeep("0x")
                  assert.equal(vietlotState.toString() == "1", upkeepNeeded == false)
              })

              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await vietlot.callStatic.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await vietlot.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts if checkup is false", async () => {
                  await expect(vietlot.performUpkeep("0x")).to.be.rejectedWith(
                      "Vietlot__UpkeepNotNeeded"
                  )
              })
              it("updates the vietlot state and emits a requestId", async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await vietlot.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  const vietlotState = await vietlot.getVietlotState()
                  const requestId = txReceipt.events[1].args.requestId
                  assert(requestId.toNumber() > 0)
                  assert(vietlotState == 1)
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await vietlot.enterVietlot({ value: vietlotEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performupkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, vietlot.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, vietlot.address)
                  ).to.be.revertedWith("nonexistent request")
              })
          })
      })
