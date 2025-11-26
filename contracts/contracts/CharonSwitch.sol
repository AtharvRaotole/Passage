// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChainlinkOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CharonSwitch
 * @notice A Dead Man's Switch contract with guardian system and Chainlink Functions integration
 */
contract CharonSwitch is Ownable {
    enum UserStatus {
        ALIVE,
        PENDING_VERIFICATION,
        DECEASED
    }

    struct User {
        UserStatus status;
        uint256 lastSeen;
        uint256 threshold; // Time in seconds before verification is needed
        address[3] guardians; // Array of 3 guardian addresses
        uint256 requiredConfirmations; // M-of-N (minimum required guardian confirmations)
        mapping(address => bool) guardianConfirmations; // Track guardian confirmations
        uint256 confirmationCount; // Current number of confirmations
    }

    mapping(address => User) public users;
    mapping(bytes32 => address) public pendingVerifications; // requestId => user address
    
    // Chainlink Oracle integration
    address public chainlinkOracle;
    
    // Demo mode: when true, timers are 100x faster (for testing/demos)
    bool public demoMode;
    uint256 public constant DEMO_TIME_MULTIPLIER = 100; // 100x faster

    event Heartbeat(address indexed user, uint256 timestamp);
    event VerificationInitiated(address indexed user, bytes32 indexed requestId);
    event GuardianConfirmed(address indexed user, address indexed guardian);
    event StatusChanged(address indexed user, UserStatus oldStatus, UserStatus newStatus);
    event OracleResponse(address indexed user, bool isDeceased);

    error UserNotRegistered();
    error InvalidGuardian();
    error DuplicateGuardian();
    error InvalidThreshold();
    error VerificationNotPending();
    error AlreadyConfirmed();
    error InsufficientConfirmations();
    error InvalidStatusTransition();
    error OnlyOracle();
    error OracleNotSet();
    error RateLimitExceeded();

    event DemoModeToggled(bool enabled);

    constructor() Ownable(msg.sender) {
        demoMode = false;
    }

    /**
     * @notice Register a new user with guardians
     * @param threshold Time in seconds before verification is needed
     * @param guardians Array of 3 guardian addresses
     * @param requiredConfirmations Minimum number of guardian confirmations needed (M-of-N)
     */
    function register(
        uint256 threshold,
        address[3] memory guardians,
        uint256 requiredConfirmations
    ) external {
        if (users[msg.sender].threshold > 0) {
            revert UserNotRegistered(); // User already registered
        }
        if (threshold == 0) {
            revert InvalidThreshold();
        }
        if (requiredConfirmations == 0 || requiredConfirmations > 3) {
            revert InsufficientConfirmations();
        }

        // Validate guardians
        for (uint256 i = 0; i < 3; i++) {
            if (guardians[i] == address(0) || guardians[i] == msg.sender) {
                revert InvalidGuardian();
            }
            // Check for duplicates
            for (uint256 j = i + 1; j < 3; j++) {
                if (guardians[i] == guardians[j]) {
                    revert DuplicateGuardian();
                }
            }
        }

        User storage user = users[msg.sender];
        user.status = UserStatus.ALIVE;
        user.lastSeen = block.timestamp;
        user.threshold = threshold;
        user.guardians = guardians;
        user.requiredConfirmations = requiredConfirmations;
    }

    /**
     * @notice Update heartbeat timestamp
     */
    function pulse() external {
        User storage user = users[msg.sender];
        if (user.threshold == 0) {
            revert UserNotRegistered();
        }

        // If user was PENDING_VERIFICATION, reset to ALIVE
        if (user.status == UserStatus.PENDING_VERIFICATION) {
            user.status = UserStatus.ALIVE;
            // Reset guardian confirmations
            _resetGuardianConfirmations(user);
        }

        user.lastSeen = block.timestamp;
        emit Heartbeat(msg.sender, block.timestamp);
    }

    /**
     * @notice Initiate verification if threshold has been exceeded
     * @param encryptedSecretsReference Encrypted secrets reference (comma-separated URLs or CBOR encoded)
     * @param sourceCode JavaScript source code for Chainlink Functions
     * @return requestId A unique identifier for this verification request
     */
    function initiateVerification(
        bytes calldata encryptedSecretsReference,
        bytes calldata sourceCode
    ) external returns (bytes32) {
        User storage user = users[msg.sender];
        if (user.threshold == 0) {
            revert UserNotRegistered();
        }

        // Check if threshold has been exceeded (apply demo mode multiplier if enabled)
        uint256 effectiveThreshold = demoMode 
            ? user.threshold / DEMO_TIME_MULTIPLIER 
            : user.threshold;
        if (block.timestamp <= user.lastSeen + effectiveThreshold) {
            revert InvalidStatusTransition();
        }

        // Only allow if user is ALIVE
        if (user.status != UserStatus.ALIVE) {
            revert InvalidStatusTransition();
        }

        if (chainlinkOracle == address(0)) {
            revert OracleNotSet();
        }

        // Change status to PENDING_VERIFICATION
        UserStatus oldStatus = user.status;
        user.status = UserStatus.PENDING_VERIFICATION;
        emit StatusChanged(msg.sender, oldStatus, user.status);

        // Call ChainlinkOracle to request verification
        ChainlinkOracle oracle = ChainlinkOracle(chainlinkOracle);
        bytes32 requestId = oracle.requestDeathVerification(
            msg.sender,
            encryptedSecretsReference,
            sourceCode
        );

        pendingVerifications[requestId] = msg.sender;
        emit VerificationInitiated(msg.sender, requestId);

        return requestId;
    }

    /**
     * @notice Emergency verification - manually trigger oracle query (costs LINK)
     * @param encryptedSecretsReference Encrypted secrets reference
     * @param sourceCode JavaScript source code for Chainlink Functions
     * @return requestId Request ID from Chainlink
     */
    function emergencyVerification(
        bytes calldata encryptedSecretsReference,
        bytes calldata sourceCode
    ) external returns (bytes32) {
        User storage user = users[msg.sender];
        if (user.threshold == 0) {
            revert UserNotRegistered();
        }

        if (chainlinkOracle == address(0)) {
            revert OracleNotSet();
        }

        // Check rate limit via oracle
        ChainlinkOracle oracle = ChainlinkOracle(chainlinkOracle);
        (bool canQuery, ) = oracle.canUserQuery(msg.sender);
        if (!canQuery) {
            revert RateLimitExceeded();
        }

        // Change status to PENDING_VERIFICATION if not already
        if (user.status == UserStatus.ALIVE) {
            UserStatus oldStatus = user.status;
            user.status = UserStatus.PENDING_VERIFICATION;
            emit StatusChanged(msg.sender, oldStatus, user.status);
        }

        // Request verification from oracle
        bytes32 requestId = oracle.requestDeathVerification(
            msg.sender,
            encryptedSecretsReference,
            sourceCode
        );

        pendingVerifications[requestId] = msg.sender;
        emit VerificationInitiated(msg.sender, requestId);

        return requestId;
    }

    /**
     * @notice Callback from ChainlinkOracle with verification result
     * @param userAddress Address of the user
     * @param isDeceased Whether the oracle determined the user is deceased
     */
    function oracleCallback(address userAddress, bool isDeceased) external {
        if (msg.sender != chainlinkOracle) {
            revert OnlyOracle();
        }

        User storage user = users[userAddress];
        if (user.threshold == 0) {
            revert UserNotRegistered();
        }

        if (user.status != UserStatus.PENDING_VERIFICATION) {
            revert VerificationNotPending();
        }

        emit OracleResponse(userAddress, isDeceased);

        if (isDeceased) {
            // Oracle confirms death - mark as DECEASED
            UserStatus oldStatus = user.status;
            user.status = UserStatus.DECEASED;
            emit StatusChanged(userAddress, oldStatus, user.status);
        }
        // If not deceased, status remains PENDING_VERIFICATION for guardian confirmation
    }

    /**
     * @notice Mock Oracle response (for testing only - remove in production)
     * @param requestId The request ID from initiateVerification
     * @param isDeceased Whether the oracle determined the user is deceased
     */
    function mockOracleResponse(bytes32 requestId, bool isDeceased) external {
        address userAddress = pendingVerifications[requestId];
        if (userAddress == address(0)) {
            revert VerificationNotPending();
        }

        User storage user = users[userAddress];
        if (user.status != UserStatus.PENDING_VERIFICATION) {
            revert VerificationNotPending();
        }

        emit OracleResponse(userAddress, isDeceased);

        if (isDeceased) {
            UserStatus oldStatus = user.status;
            user.status = UserStatus.DECEASED;
            emit StatusChanged(userAddress, oldStatus, user.status);
        }

        delete pendingVerifications[requestId];
    }

    /**
     * @notice Guardian confirms user is deceased
     * @param userAddress Address of the user to confirm
     */
    function guardianConfirm(address userAddress) external {
        User storage user = users[userAddress];
        if (user.threshold == 0) {
            revert UserNotRegistered();
        }
        if (user.status != UserStatus.PENDING_VERIFICATION) {
            revert VerificationNotPending();
        }

        // Check if caller is a guardian
        bool isGuardian = false;
        for (uint256 i = 0; i < 3; i++) {
            if (user.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        if (!isGuardian) {
            revert InvalidGuardian();
        }

        // Check if already confirmed
        if (user.guardianConfirmations[msg.sender]) {
            revert AlreadyConfirmed();
        }

        // Record confirmation
        user.guardianConfirmations[msg.sender] = true;
        user.confirmationCount++;

        emit GuardianConfirmed(userAddress, msg.sender);

        // Check if we have enough confirmations
        if (user.confirmationCount >= user.requiredConfirmations) {
            UserStatus oldStatus = user.status;
            user.status = UserStatus.DECEASED;
            emit StatusChanged(userAddress, oldStatus, user.status);
        }
    }

    /**
     * @notice Get user information
     * @param userAddress Address of the user
     * @return status Current status
     * @return lastSeen Last heartbeat timestamp
     * @return threshold Verification threshold in seconds
     * @return guardians Array of guardian addresses
     * @return requiredConfirmations Required number of confirmations
     * @return confirmationCount Current number of confirmations
     */
    function getUserInfo(address userAddress)
        external
        view
        returns (
            UserStatus status,
            uint256 lastSeen,
            uint256 threshold,
            address[3] memory guardians,
            uint256 requiredConfirmations,
            uint256 confirmationCount
        )
    {
        User storage user = users[userAddress];
        return (
            user.status,
            user.lastSeen,
            user.threshold,
            user.guardians,
            user.requiredConfirmations,
            user.confirmationCount
        );
    }

    /**
     * @notice Check if a guardian has confirmed for a user
     * @param userAddress Address of the user
     * @param guardianAddress Address of the guardian
     * @return confirmed Whether the guardian has confirmed
     */
    function hasGuardianConfirmed(address userAddress, address guardianAddress)
        external
        view
        returns (bool)
    {
        return users[userAddress].guardianConfirmations[guardianAddress];
    }

    /**
     * @notice Internal function to reset guardian confirmations
     */
    function _resetGuardianConfirmations(User storage user) internal {
        for (uint256 i = 0; i < 3; i++) {
            if (user.guardianConfirmations[user.guardians[i]]) {
                delete user.guardianConfirmations[user.guardians[i]];
            }
        }
        user.confirmationCount = 0;
    }

    /**
     * @notice Toggle demo mode (owner only)
     * @param enabled Whether to enable demo mode
     */
    function setDemoMode(bool enabled) external onlyOwner {
        demoMode = enabled;
        emit DemoModeToggled(enabled);
    }

    /**
     * @notice Get effective threshold for a user (accounting for demo mode)
     * @param userAddress Address of the user
     * @return effectiveThreshold Effective threshold in seconds
     */
    function getEffectiveThreshold(address userAddress) external view returns (uint256) {
        User storage user = users[userAddress];
        if (user.threshold == 0) {
            return 0;
        }
        return demoMode ? user.threshold / DEMO_TIME_MULTIPLIER : user.threshold;
    }
}

