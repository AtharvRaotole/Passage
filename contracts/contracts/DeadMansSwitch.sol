// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeadMansSwitch
 * @notice A decentralized digital estate manager that uses Chainlink Functions
 *         to verify user activity via external APIs
 */
contract DeadMansSwitch is FunctionsClient, ConfirmedOwner, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    struct Estate {
        address beneficiary;
        uint256 heartbeatInterval; // Time in seconds between required heartbeats
        uint256 lastHeartbeat; // Timestamp of last verified heartbeat
        bool isActive;
        bytes encryptedData; // Encrypted estate data (encrypted via Lit Protocol)
        string source; // API source for heartbeat verification
        string secrets; // Encrypted secrets for API access
    }

    mapping(address => Estate) public estates;
    mapping(bytes32 => address) public pendingRequests; // requestId => user address

    // Chainlink Functions configuration
    bytes32 public s_lastRequestId;
    bytes32 public s_donId;
    uint64 public s_subscriptionId;

    event EstateCreated(address indexed user, address indexed beneficiary, uint256 heartbeatInterval);
    event HeartbeatVerified(address indexed user, uint256 timestamp);
    event HeartbeatMissed(address indexed user, uint256 missedAt);
    event EstateActivated(address indexed user, address indexed beneficiary);
    event HeartbeatRequested(address indexed user, bytes32 indexed requestId);

    error EstateNotFound();
    error EstateAlreadyExists();
    error HeartbeatTooEarly();
    error InvalidBeneficiary();
    error InvalidInterval();

    constructor(
        address router,
        bytes32 donId
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        s_donId = donId;
    }

    /**
     * @notice Create a new estate
     * @param beneficiary Address that will receive the estate if heartbeat is missed
     * @param heartbeatInterval Time in seconds between required heartbeats
     * @param source API source URL for heartbeat verification
     * @param secrets Encrypted secrets for API access (encrypted via Lit Protocol)
     */
    function createEstate(
        address beneficiary,
        uint256 heartbeatInterval,
        string memory source,
        string memory secrets
    ) external {
        if (estates[msg.sender].isActive) {
            revert EstateAlreadyExists();
        }
        if (beneficiary == address(0) || beneficiary == msg.sender) {
            revert InvalidBeneficiary();
        }
        if (heartbeatInterval < 86400) {
            // Minimum 1 day
            revert InvalidInterval();
        }

        estates[msg.sender] = Estate({
            beneficiary: beneficiary,
            heartbeatInterval: heartbeatInterval,
            lastHeartbeat: block.timestamp,
            isActive: true,
            encryptedData: "",
            source: source,
            secrets: secrets
        });

        emit EstateCreated(msg.sender, beneficiary, heartbeatInterval);
    }

    /**
     * @notice Request a heartbeat verification via Chainlink Functions
     * @param source API source URL
     * @param encryptedSecretsReference Encrypted secrets reference (optional)
     * @param sourceCode JavaScript source code for the Functions request
     */
    function requestHeartbeatVerification(
        string calldata source,
        bytes calldata encryptedSecretsReference,
        bytes calldata sourceCode
    ) external {
        Estate storage estate = estates[msg.sender];
        if (!estate.isActive) {
            revert EstateNotFound();
        }

        // Check if enough time has passed since last heartbeat
        if (block.timestamp < estate.lastHeartbeat + estate.heartbeatInterval) {
            revert HeartbeatTooEarly();
        }

        // Prepare the Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(string(sourceCode));
        
        if (encryptedSecretsReference.length > 0) {
            req.addSecretsReference(encryptedSecretsReference);
        }

        // Add arguments
        string[] memory args = new string[](1);
        args[0] = source;
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            s_subscriptionId,
            uint32(gasleft()),
            s_donId
        );

        pendingRequests[requestId] = msg.sender;
        s_lastRequestId = requestId;

        emit HeartbeatRequested(msg.sender, requestId);
    }

    /**
     * @notice Callback function for Chainlink Functions
     * @param requestId The request ID
     * @param response The response from the API
     * @param err Any errors from the API call
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        address user = pendingRequests[requestId];
        require(user != address(0), "Invalid request ID");

        Estate storage estate = estates[user];

        if (err.length > 0 || response.length == 0) {
            // API call failed or no response - heartbeat missed
            _handleMissedHeartbeat(user, estate);
        } else {
            // Parse response (assuming it returns a boolean or timestamp)
            // This is a simplified version - actual implementation would parse JSON
            bool isActive = abi.decode(response, (bool));
            
            if (isActive) {
                estate.lastHeartbeat = block.timestamp;
                emit HeartbeatVerified(user, block.timestamp);
            } else {
                _handleMissedHeartbeat(user, estate);
            }
        }

        delete pendingRequests[requestId];
    }

    /**
     * @notice Store encrypted estate data
     * @param encryptedData The encrypted data (encrypted via Lit Protocol)
     */
    function updateEncryptedData(bytes calldata encryptedData) external {
        Estate storage estate = estates[msg.sender];
        if (!estate.isActive) {
            revert EstateNotFound();
        }
        estate.encryptedData = encryptedData;
    }

    /**
     * @notice Activate the estate and transfer to beneficiary
     * @param userAddress Address of the estate owner (can be called by beneficiary or owner)
     */
    function activateEstate(address userAddress) external {
        Estate storage estate = estates[userAddress];
        if (!estate.isActive) {
            revert EstateNotFound();
        }

        // Only owner or beneficiary can activate
        require(
            msg.sender == userAddress || msg.sender == estate.beneficiary,
            "Not authorized"
        );

        // Check if heartbeat interval has passed
        require(
            block.timestamp >= estate.lastHeartbeat + estate.heartbeatInterval,
            "Heartbeat interval not exceeded"
        );

        address beneficiary = estate.beneficiary;
        estate.isActive = false;

        emit EstateActivated(userAddress, beneficiary);
    }

    /**
     * @notice Set the Chainlink Functions subscription ID
     */
    function setSubscriptionId(uint64 subscriptionId) external onlyOwner {
        s_subscriptionId = subscriptionId;
    }

    /**
     * @notice Get estate information
     */
    function getEstate(address user) external view returns (Estate memory) {
        return estates[user];
    }

    /**
     * @notice Internal function to handle missed heartbeat
     */
    function _handleMissedHeartbeat(address user, Estate storage estate) internal {
        emit HeartbeatMissed(user, block.timestamp);
        // In a full implementation, this might trigger automatic estate activation
        // or notify the beneficiary
    }
}

