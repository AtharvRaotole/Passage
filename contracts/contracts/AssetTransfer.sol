// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharonSwitch.sol";

/**
 * @title AssetTransfer
 * @notice Manages ERC-20 token deposits and automatic transfers to beneficiaries
 *         when user status changes to DECEASED in CharonSwitch
 */
contract AssetTransfer is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    CharonSwitch public immutable charonSwitch;

    struct Beneficiary {
        address beneficiaryAddress;
        uint256 percentage; // Basis points (10000 = 100%)
        bool isActive;
    }

    struct UserAssets {
        address[] tokenAddresses; // List of token addresses user has deposited
        mapping(address => uint256) tokenBalances; // token => balance
        Beneficiary[] beneficiaries;
        bool isInitialized;
    }

    mapping(address => UserAssets) public userAssets;
    mapping(address => mapping(address => bool)) public tokenDeposited; // user => token => deposited

    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event BeneficiaryAdded(
        address indexed user,
        address indexed beneficiary,
        uint256 percentage
    );
    event BeneficiaryRemoved(
        address indexed user,
        address indexed beneficiary
    );
    event AssetsTransferred(
        address indexed user,
        address indexed token,
        address indexed beneficiary,
        uint256 amount
    );
    event SweepExecuted(
        address indexed user,
        address indexed executor,
        uint256 totalTokensTransferred
    );

    error UserNotRegistered();
    error InvalidBeneficiary();
    error InvalidPercentage();
    error PercentageExceeds100();
    error NotDeceased();
    error NoAssets();
    error NoBeneficiaries();
    error TransferFailed();
    error TokenNotDeposited();
    error UnauthorizedSweep();
    error BeneficiaryNotFound();

    constructor(address _charonSwitch) Ownable(msg.sender) {
        require(_charonSwitch != address(0), "Invalid CharonSwitch address");
        charonSwitch = CharonSwitch(_charonSwitch);
    }

    /**
     * @notice Initialize user's asset management
     * @param beneficiaries Array of beneficiary addresses
     * @param percentages Array of percentages (basis points) for each beneficiary
     */
    function initializeBeneficiaries(
        address[] calldata beneficiaries,
        uint256[] calldata percentages
    ) external {
        require(beneficiaries.length == percentages.length, "Array length mismatch");
        require(beneficiaries.length > 0, "No beneficiaries provided");

        UserAssets storage assets = userAssets[msg.sender];
        require(!assets.isInitialized, "Already initialized");

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == address(0) || beneficiaries[i] == msg.sender) {
                revert InvalidBeneficiary();
            }
            if (percentages[i] == 0 || percentages[i] > 10000) {
                revert InvalidPercentage();
            }
            totalPercentage += percentages[i];

            assets.beneficiaries.push(
                Beneficiary({
                    beneficiaryAddress: beneficiaries[i],
                    percentage: percentages[i],
                    isActive: true
                })
            );
        }

        if (totalPercentage != 10000) {
            revert PercentageExceeds100();
        }

        assets.isInitialized = true;
    }

    /**
     * @notice Add a new beneficiary (can only be called by user while ALIVE)
     */
    function addBeneficiary(
        address beneficiary,
        uint256 percentage
    ) external {
        if (beneficiary == address(0) || beneficiary == msg.sender) {
            revert InvalidBeneficiary();
        }
        if (percentage == 0 || percentage > 10000) {
            revert InvalidPercentage();
        }

        UserAssets storage assets = userAssets[msg.sender];
        require(assets.isInitialized, "Not initialized");

        // Check user is still ALIVE
        (CharonSwitch.UserStatus status, , , , , ) = charonSwitch.getUserInfo(
            msg.sender
        );
        if (status != CharonSwitch.UserStatus.ALIVE) {
            revert NotDeceased(); // Actually means "not alive"
        }

        // Recalculate total percentage
        uint256 totalPercentage = percentage;
        for (uint256 i = 0; i < assets.beneficiaries.length; i++) {
            if (assets.beneficiaries[i].isActive) {
                totalPercentage += assets.beneficiaries[i].percentage;
            }
        }

        if (totalPercentage > 10000) {
            revert PercentageExceeds100();
        }

        assets.beneficiaries.push(
            Beneficiary({
                beneficiaryAddress: beneficiary,
                percentage: percentage,
                isActive: true
            })
        );

        emit BeneficiaryAdded(msg.sender, beneficiary, percentage);
    }

    /**
     * @notice Remove a beneficiary
     */
    function removeBeneficiary(address beneficiary) external {
        UserAssets storage assets = userAssets[msg.sender];
        require(assets.isInitialized, "Not initialized");

        bool found = false;
        for (uint256 i = 0; i < assets.beneficiaries.length; i++) {
            if (assets.beneficiaries[i].beneficiaryAddress == beneficiary) {
                assets.beneficiaries[i].isActive = false;
                found = true;
                emit BeneficiaryRemoved(msg.sender, beneficiary);
                break;
            }
        }

        if (!found) {
            revert BeneficiaryNotFound();
        }
    }

    /**
     * @notice Deposit ERC-20 tokens (user must approve this contract first)
     * @param token Address of the ERC-20 token
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        UserAssets storage assets = userAssets[msg.sender];
        require(assets.isInitialized, "Not initialized");

        // Check user is still ALIVE
        (CharonSwitch.UserStatus status, , , , , ) = charonSwitch.getUserInfo(
            msg.sender
        );
        if (status != CharonSwitch.UserStatus.ALIVE) {
            revert NotDeceased(); // Actually means "not alive"
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (!tokenDeposited[msg.sender][token]) {
            assets.tokenAddresses.push(token);
            tokenDeposited[msg.sender][token] = true;
        }

        assets.tokenBalances[token] += amount;

        emit TokenDeposited(msg.sender, token, amount);
    }

    /**
     * @notice Automatically transfer assets to beneficiaries when user is DECEASED
     * @param userAddress Address of the deceased user
     */
    function transferAssetsOnDeath(
        address userAddress
    ) external nonReentrant {
        // Verify user is DECEASED
        (CharonSwitch.UserStatus status, , , , , ) = charonSwitch.getUserInfo(
            userAddress
        );
        if (status != CharonSwitch.UserStatus.DECEASED) {
            revert NotDeceased();
        }

        UserAssets storage assets = userAssets[userAddress];
        require(assets.isInitialized, "Not initialized");

        if (assets.tokenAddresses.length == 0) {
            revert NoAssets();
        }

        if (assets.beneficiaries.length == 0) {
            revert NoBeneficiaries();
        }

        // Transfer each token to beneficiaries based on percentages
        for (uint256 i = 0; i < assets.tokenAddresses.length; i++) {
            address token = assets.tokenAddresses[i];
            uint256 balance = assets.tokenBalances[token];

            if (balance == 0) continue;

            // Distribute to active beneficiaries
            uint256 distributed = 0;
            for (uint256 j = 0; j < assets.beneficiaries.length; j++) {
                if (!assets.beneficiaries[j].isActive) continue;

                uint256 amount = (balance * assets.beneficiaries[j].percentage) /
                    10000;
                
                // For the last beneficiary, ensure we transfer the remainder
                if (j == assets.beneficiaries.length - 1) {
                    amount = balance - distributed;
                }

                IERC20(token).safeTransfer(
                    assets.beneficiaries[j].beneficiaryAddress,
                    amount
                );

                distributed += amount;

                emit AssetsTransferred(
                    userAddress,
                    token,
                    assets.beneficiaries[j].beneficiaryAddress,
                    amount
                );
            }

            // Clear balance
            assets.tokenBalances[token] = 0;
        }
    }

    /**
     * @notice Sweep all tokens from a user's vault in one transaction
     * @param userAddress Address of the user (must be DECEASED)
     */
    function sweepWallet(address userAddress) external nonReentrant {
        // Verify user is DECEASED
        (CharonSwitch.UserStatus status, , , , , ) = charonSwitch.getUserInfo(
            userAddress
        );
        if (status != CharonSwitch.UserStatus.DECEASED) {
            revert NotDeceased();
        }

        UserAssets storage assets = userAssets[userAddress];
        require(assets.isInitialized, "Not initialized");

        if (assets.tokenAddresses.length == 0) {
            revert NoAssets();
        }

        if (assets.beneficiaries.length == 0) {
            revert NoBeneficiaries();
        }

        uint256 totalTokensTransferred = 0;

        // Transfer all tokens
        for (uint256 i = 0; i < assets.tokenAddresses.length; i++) {
            address token = assets.tokenAddresses[i];
            uint256 balance = assets.tokenBalances[token];

            if (balance == 0) continue;

            // Distribute to active beneficiaries
            uint256 distributed = 0;
            for (uint256 j = 0; j < assets.beneficiaries.length; j++) {
                if (!assets.beneficiaries[j].isActive) continue;

                uint256 amount = (balance * assets.beneficiaries[j].percentage) /
                    10000;
                
                // For the last beneficiary, ensure we transfer the remainder
                if (j == assets.beneficiaries.length - 1) {
                    amount = balance - distributed;
                }

                IERC20(token).safeTransfer(
                    assets.beneficiaries[j].beneficiaryAddress,
                    amount
                );

                distributed += amount;

                emit AssetsTransferred(
                    userAddress,
                    token,
                    assets.beneficiaries[j].beneficiaryAddress,
                    amount
                );
            }

            totalTokensTransferred += assets.tokenAddresses.length;
            assets.tokenBalances[token] = 0;
        }

        emit SweepExecuted(userAddress, msg.sender, totalTokensTransferred);
    }

    /**
     * @notice Get user's token balance
     */
    function getTokenBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return userAssets[user].tokenBalances[token];
    }

    /**
     * @notice Get all tokens deposited by user
     */
    function getUserTokens(
        address user
    ) external view returns (address[] memory) {
        return userAssets[user].tokenAddresses;
    }

    /**
     * @notice Get user's beneficiaries
     */
    function getBeneficiaries(
        address user
    ) external view returns (Beneficiary[] memory) {
        return userAssets[user].beneficiaries;
    }

    /**
     * @notice Get user's asset summary
     */
    function getUserAssetSummary(
        address user
    )
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory balances,
            Beneficiary[] memory beneficiaries
        )
    {
        UserAssets storage assets = userAssets[user];
        tokens = assets.tokenAddresses;
        balances = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = assets.tokenBalances[tokens[i]];
        }
        
        beneficiaries = assets.beneficiaries;
    }
}

