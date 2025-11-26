/**
 * CharonSwitch Contract ABI and Configuration
 */

export const CHARON_SWITCH_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "getUserInfo",
    outputs: [
      {
        internalType: "enum CharonSwitch.UserStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "lastSeen",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256",
      },
      {
        internalType: "address[3]",
        name: "guardians",
        type: "address[3]",
      },
      {
        internalType: "uint256",
        name: "requiredConfirmations",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "confirmationCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pulse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "guardianConfirm",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "guardianAddress",
        type: "address",
      },
    ],
    name: "hasGuardianConfirmed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256",
      },
      {
        internalType: "address[3]",
        name: "guardians",
        type: "address[3]",
      },
      {
        internalType: "uint256",
        name: "requiredConfirmations",
        type: "uint256",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Contract address - update after deployment
export const CHARON_SWITCH_ADDRESS =
  (process.env.NEXT_PUBLIC_CHARON_SWITCH_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

// UserStatus enum values
export enum UserStatus {
  ALIVE = 0,
  PENDING_VERIFICATION = 1,
  DECEASED = 2,
}

/**
 * AssetTransfer Contract ABI and Configuration
 */
export const ASSET_TRANSFER_ABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "beneficiaries",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "percentages",
        type: "uint256[]",
      },
    ],
    name: "initializeBeneficiaries",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "percentage",
        type: "uint256",
      },
    ],
    name: "addBeneficiary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
    ],
    name: "removeBeneficiary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "depositToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "transferAssetsOnDeath",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "sweepWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getTokenBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getBeneficiaries",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "beneficiaryAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "percentage",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct AssetTransfer.Beneficiary[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserAssetSummary",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "balances",
        type: "uint256[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "beneficiaryAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "percentage",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct AssetTransfer.Beneficiary[]",
        name: "beneficiaries",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC-20 ABI for token interactions
export const ERC20_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address - update after deployment
export const ASSET_TRANSFER_ADDRESS =
  (process.env.NEXT_PUBLIC_ASSET_TRANSFER_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

