// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockChainlinkOracle
 * @notice Minimal mock for CharonSwitch verification tests
 */
contract MockChainlinkOracle {
    uint256 private _nonce;

    function requestDeathVerification(
        address,
        bytes calldata,
        bytes calldata
    ) external returns (bytes32 requestId) {
        _nonce++;
        return keccak256(abi.encodePacked(block.timestamp, _nonce));
    }

    function canUserQuery(address) external pure returns (bool canQuery, uint256 timeUntilNext) {
        return (true, 0);
    }
}
