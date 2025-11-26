// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharonSwitch.sol";

/**
 * @title ChainlinkOracle
 * @notice Chainlink Functions oracle for death verification API queries
 * @dev Queries external APIs (e.g., Searchbug) to verify death status
 */
contract ChainlinkOracle is FunctionsClient, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    // Rate limiting: 7 days in seconds
    uint256 public constant RATE_LIMIT_PERIOD = 7 days;

    struct OracleRequest {
        address userAddress;
        uint256 timestamp;
        bool isPending;
    }

    // Mapping of requestId to request details
    mapping(bytes32 => OracleRequest) public requests;
    
    // Rate limiting: track last query time per user
    mapping(address => uint256) public lastQueryTime;
    
    // Oracle query logs
    struct QueryLog {
        address userAddress;
        uint256 timestamp;
        bytes32 requestId;
        bool success;
        bool isDeceased;
    }
    
    QueryLog[] public queryLogs;
    
    // Chainlink Functions configuration
    bytes32 public s_donId;
    uint64 public s_subscriptionId;
    
    // CharonSwitch contract address
    CharonSwitch public charonSwitch;
    
    // API endpoint (can be updated by owner)
    string public apiEndpoint;
    
    event OracleRequested(
        address indexed userAddress,
        bytes32 indexed requestId,
        uint256 timestamp
    );
    
    event OracleResponse(
        address indexed userAddress,
        bytes32 indexed requestId,
        bool isDeceased,
        bool success
    );
    
    event QueryLogged(
        address indexed userAddress,
        bytes32 indexed requestId,
        uint256 timestamp
    );
    
    error RateLimitExceeded();
    error InvalidUserAddress();
    error RequestNotFound();
    error OnlyCharonSwitch();
    error InvalidSubscription();

    /**
     * @notice Constructor
     * @param router Chainlink Functions Router address
     * @param donId DON ID for the network
     * @param _charonSwitch CharonSwitch contract address
     * @param _apiEndpoint API endpoint URL for death verification
     */
    constructor(
        address router,
        bytes32 donId,
        address _charonSwitch,
        string memory _apiEndpoint
    ) FunctionsClient(router) Ownable(msg.sender) {
        s_donId = donId;
        charonSwitch = CharonSwitch(_charonSwitch);
        apiEndpoint = _apiEndpoint;
    }

    /**
     * @notice Request death verification from external API
     * @param userAddress Address of the user to verify
     * @param encryptedSecretsReference Encrypted secrets reference (comma-separated URLs or CBOR encoded)
     * @param sourceCode JavaScript source code for the Functions request
     * @return requestId Request ID from Chainlink Functions
     */
    function requestDeathVerification(
        address userAddress,
        bytes calldata encryptedSecretsReference,
        bytes calldata sourceCode
    ) external returns (bytes32 requestId) {
        // Only CharonSwitch can request verification
        if (msg.sender != address(charonSwitch)) {
            revert OnlyCharonSwitch();
        }
        
        if (userAddress == address(0)) {
            revert InvalidUserAddress();
        }
        
        // Rate limiting: check if user has queried within last 7 days
        uint256 lastQuery = lastQueryTime[userAddress];
        if (lastQuery > 0 && block.timestamp < lastQuery + RATE_LIMIT_PERIOD) {
            revert RateLimitExceeded();
        }
        
        // Update last query time
        lastQueryTime[userAddress] = block.timestamp;
        
        // Prepare the Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(string(sourceCode));
        
        // Add encrypted secrets (SSN/PII encrypted with DON public key)
        // Note: encryptedSecretsReference should be bytes containing comma-separated URLs or CBOR encoded data
        if (encryptedSecretsReference.length > 0) {
            req.addSecretsReference(encryptedSecretsReference);
        }
        
        // Add arguments: API endpoint and user address
        string[] memory args = new string[](2);
        args[0] = apiEndpoint;
        args[1] = _addressToString(userAddress);
        req.setArgs(args);
        
        // Send request
        requestId = _sendRequest(
            FunctionsRequest.encodeCBOR(req),
            s_subscriptionId,
            uint32(gasleft()),
            s_donId
        );
        
        // Store request details
        requests[requestId] = OracleRequest({
            userAddress: userAddress,
            timestamp: block.timestamp,
            isPending: true
        });
        
        emit OracleRequested(userAddress, requestId, block.timestamp);
        
        return requestId;
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
        OracleRequest memory request = requests[requestId];
        
        if (request.userAddress == address(0)) {
            revert RequestNotFound();
        }
        
        bool success = false;
        bool isDeceased = false;
        
        if (err.length == 0 && response.length > 0) {
            // Parse JSON response: {"deceased": true/false, "date": "2025-01-15"}
            try this.parseDeathVerificationResponse(response) returns (bool deceased) {
                isDeceased = deceased;
                success = true;
                
                // Call back to CharonSwitch
                charonSwitch.oracleCallback(request.userAddress, isDeceased);
            } catch {
                // Parsing failed, treat as unsuccessful
                success = false;
            }
        }
        
        // Update request status
        requests[requestId].isPending = false;
        
        // Log the query
        queryLogs.push(QueryLog({
            userAddress: request.userAddress,
            timestamp: block.timestamp,
            requestId: requestId,
            success: success,
            isDeceased: isDeceased
        }));
        
        emit OracleResponse(request.userAddress, requestId, isDeceased, success);
        emit QueryLogged(request.userAddress, requestId, block.timestamp);
    }

    /**
     * @notice Parse JSON response from death verification API
     * @param response Raw bytes response from API
     * @return deceased Whether the person is deceased
     * @dev This function parses: {"deceased": true/false, "date": "2025-01-15"}
     */
    function parseDeathVerificationResponse(
        bytes memory response
    ) external pure returns (bool deceased) {
        // Simple JSON parsing for {"deceased": true/false}
        // In production, use a proper JSON parser library
        
        string memory responseStr = string(response);
        bytes memory responseBytes = bytes(responseStr);
        
        // Look for "deceased":true or "deceased":false
        // This is a simplified parser - in production use a proper JSON library
        for (uint256 i = 0; i < responseBytes.length - 8; i++) {
            // Check for "deceased"
            if (
                responseBytes[i] == '"' &&
                responseBytes[i + 1] == 'd' &&
                responseBytes[i + 2] == 'e' &&
                responseBytes[i + 3] == 'c' &&
                responseBytes[i + 4] == 'e' &&
                responseBytes[i + 5] == 'a' &&
                responseBytes[i + 6] == 's' &&
                responseBytes[i + 7] == 'e' &&
                responseBytes[i + 8] == 'd'
            ) {
                // Find the value after the colon
                uint256 valueStart = i + 10; // Skip "deceased":
                for (uint256 j = valueStart; j < responseBytes.length; j++) {
                    if (responseBytes[j] == 't' && responseBytes[j + 1] == 'r' && 
                        responseBytes[j + 2] == 'u' && responseBytes[j + 3] == 'e') {
                        return true;
                    }
                    if (responseBytes[j] == 'f' && responseBytes[j + 1] == 'a' && 
                        responseBytes[j + 2] == 'l' && responseBytes[j + 3] == 's' && 
                        responseBytes[j + 4] == 'e') {
                        return false;
                    }
                }
            }
        }
        
        revert("Invalid response format");
    }

    /**
     * @notice Get query logs for a user
     * @param userAddress User address
     * @return logs Array of query logs
     */
    function getUserQueryLogs(address userAddress) 
        external 
        view 
        returns (QueryLog[] memory logs) 
    {
        uint256 count = 0;
        
        // Count matching logs
        for (uint256 i = 0; i < queryLogs.length; i++) {
            if (queryLogs[i].userAddress == userAddress) {
                count++;
            }
        }
        
        // Create array
        logs = new QueryLog[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < queryLogs.length; i++) {
            if (queryLogs[i].userAddress == userAddress) {
                logs[index] = queryLogs[i];
                index++;
            }
        }
    }

    /**
     * @notice Get total query count for a user
     * @param userAddress User address
     * @return count Total number of queries
     */
    function getUserQueryCount(address userAddress) 
        external 
        view 
        returns (uint256 count) 
    {
        for (uint256 i = 0; i < queryLogs.length; i++) {
            if (queryLogs[i].userAddress == userAddress) {
                count++;
            }
        }
    }

    /**
     * @notice Check if user can make a query (rate limit check)
     * @param userAddress User address
     * @return canQuery Whether user can make a query
     * @return timeUntilNextQuery Time until next query is allowed (0 if can query now)
     */
    function canUserQuery(address userAddress) 
        external 
        view 
        returns (bool canQuery, uint256 timeUntilNextQuery) 
    {
        uint256 lastQuery = lastQueryTime[userAddress];
        
        if (lastQuery == 0) {
            canQuery = true;
            timeUntilNextQuery = 0;
        } else {
            uint256 nextAllowedTime = lastQuery + RATE_LIMIT_PERIOD;
            if (block.timestamp >= nextAllowedTime) {
                canQuery = true;
                timeUntilNextQuery = 0;
            } else {
                canQuery = false;
                timeUntilNextQuery = nextAllowedTime - block.timestamp;
            }
        }
    }

    /**
     * @notice Set subscription ID (only owner)
     * @param subscriptionId Chainlink Functions subscription ID
     */
    function setSubscriptionId(uint64 subscriptionId) external onlyOwner {
        if (subscriptionId == 0) {
            revert InvalidSubscription();
        }
        s_subscriptionId = subscriptionId;
    }

    /**
     * @notice Update API endpoint (only owner)
     * @param newEndpoint New API endpoint URL
     */
    function setApiEndpoint(string memory newEndpoint) external onlyOwner {
        apiEndpoint = newEndpoint;
    }

    /**
     * @notice Update CharonSwitch address (only owner)
     * @param newCharonSwitch New CharonSwitch contract address
     */
    function setCharonSwitch(address newCharonSwitch) external onlyOwner {
        charonSwitch = CharonSwitch(newCharonSwitch);
    }

    /**
     * @notice Convert address to string
     * @param addr Address to convert
     * @return String representation
     */
    function _addressToString(address addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}

