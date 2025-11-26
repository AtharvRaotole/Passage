# Project Charon Contracts

Hardhat project for the Dead Man's Switch smart contract with Chainlink Functions integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
CHAINLINK_FUNCTIONS_ROUTER=0x...  # Chainlink Functions Router address
CHAINLINK_DON_ID=0x...  # DON ID for your network
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Deploy to network:
```bash
npm run deploy
```

## Contract Overview

### DeadMansSwitch

Main contract that implements the Dead Man's Switch functionality:

- **createEstate**: Create a new digital estate with beneficiary and heartbeat interval
- **requestHeartbeatVerification**: Request Chainlink Functions to verify user activity
- **updateEncryptedData**: Store encrypted estate data (encrypted via Lit Protocol)
- **activateEstate**: Activate estate and transfer to beneficiary if heartbeat missed

## Chainlink Functions Integration

The contract uses Chainlink Functions to verify user activity via external APIs. You'll need to:

1. Create a Chainlink Functions subscription
2. Fund it with LINK tokens
3. Set the subscription ID on the contract
4. Provide JavaScript source code for the API verification logic

## Network Configuration

Update `hardhat.config.ts` with your network settings. Supported networks:
- Hardhat (local)
- Sepolia (testnet)

