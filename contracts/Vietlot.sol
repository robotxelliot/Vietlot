//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Vietlot__SendMoreToEnterVietlot();
error Vietlot__VietlotNotOpen();
error Vietlot__TransferFailed();
error Vietlot__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 vietlotState);

/**
 * @title Building Vietlot decentralize
 * @author Blake Ng
 * @notice This contract is built for the purpose of creating a decentralized lottery playground.
 * @dev This implements the Chainlink VRF version 2
 */

contract Vietlot is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type declarations*/
    enum VietlotState {
        OPEN,
        CALCULATING
    }

    /* State variables */
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VietlotState private s_vietlotState;
    address private s_recentWinner;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    // Events
    event VietlotEnter(address indexed player);
    event WinnerPicked(address indexed player);
    event RequestedVietlotWinner(uint256 indexed requestId);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 interval,
        uint256 entranceFee,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_interval = interval;
        i_subscriptionId = subscriptionId;
        i_entranceFee = entranceFee;
        s_vietlotState = VietlotState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterVietlot() public payable {
        if (msg.value < i_entranceFee) {
            revert Vietlot__SendMoreToEnterVietlot();
        }
        if (s_vietlotState != VietlotState.OPEN) {
            revert Vietlot__VietlotNotOpen();
        }
        s_players.push(payable(msg.sender));
        emit VietlotEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between vietlot runs
     * 2. The lottery is open
     * 3. The contract has ETH
     * 4. Implicity, your subscription is funded with LINK.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = VietlotState.OPEN == s_vietlotState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * ad it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Vietlot__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_vietlotState)
            );
        }
        s_vietlotState = VietlotState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedVietlotWinner(requestId);
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(
        uint256, /* requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_vietlotState = VietlotState.OPEN;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Vietlot__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /** Getter Functions */

    function getVietlotState() public view returns (VietlotState) {
        return s_vietlotState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
