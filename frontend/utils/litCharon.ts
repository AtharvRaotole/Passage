/**
 * Lit Protocol integration for Project Charon
 * Handles encryption/decryption of credentials with access control conditions
 */

import * as LitJsSdk from "lit-js-sdk";
import type { AccessControlConditions } from "lit-js-sdk";

// Lit Protocol configuration
const LIT_NETWORK = "mumbai"; // Mumbai testnet (Polygon)
const CHAIN = "mumbai"; // Polygon Mumbai testnet

// CharonSwitch contract address (update after deployment)
// This should be set from environment variable
const CHARON_SWITCH_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARON_SWITCH_ADDRESS ||
  "0x0000000000000000000000000000000000000000"; // Placeholder

/**
 * Initialize Lit Protocol client
 */
export async function getLitClient(): Promise<LitJsSdk.LitNodeClient> {
  const client = new LitJsSdk.LitNodeClient({
    litNetwork: LIT_NETWORK as any,
    debug: false,
  });
  await client.connect();
  return client;
}

/**
 * Get access control conditions for CharonSwitch
 * Conditions: User owns CharonSwitch NFT OR Smart Contract State is DECEASED
 * 
 * @param userAddress - The user's wallet address
 * @returns Access control conditions array
 */
export function getCharonAccessControlConditions(
  userAddress: string
): AccessControlConditions {
  return [
    {
      // Condition 1: Check if user's status is DECEASED (status = 2) in CharonSwitch contract
      contractAddress: CHARON_SWITCH_CONTRACT_ADDRESS,
      functionName: "getUserInfo",
      functionParams: [userAddress],
      functionAbi: {
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
      chain: CHAIN,
      returnValueTest: {
        key: "status",
        comparator: "=",
        value: "2", // DECEASED status
      },
    },
    {
      // Condition 2: User owns CharonSwitch NFT (placeholder for future NFT implementation)
      // This can be expanded when NFT functionality is added
      contractAddress: CHARON_SWITCH_CONTRACT_ADDRESS,
      functionName: "balanceOf",
      functionParams: [userAddress],
      functionAbi: {
        inputs: [
          {
            internalType: "address",
            name: "account",
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
      chain: CHAIN,
      returnValueTest: {
        key: "",
        comparator: ">",
        value: "0",
      },
    },
  ];
}

/**
 * Encrypt a credential using Lit Protocol
 * 
 * @param credential - The credential string to encrypt
 * @param userAddress - The user's wallet address for access control
 * @returns Object containing encrypted data and dataToEncryptHash
 */
export async function encryptCredential(
  credential: string,
  userAddress: string
): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: AccessControlConditions;
}> {
  try {
    const client = await getLitClient();

    // Get access control conditions
    const accessControlConditions = getCharonAccessControlConditions(userAddress);

    // Convert credential to Uint8Array
    // Using Lit SDK encryption methods
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      credential
    );

    // Convert encrypted string to base64
    const ciphertext = await LitJsSdk.blobToBase64String(encryptedString);

    // Save encryption key with access control conditions
    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });

    const encryptedSymmetricKey = await client.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: CHAIN,
    });

    // Create dataToEncryptHash (hash of the credential for verification)
    const dataToEncryptHash = await LitJsSdk.hashCredential(credential);

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Failed to encrypt credential: ${error}`);
  }
}

/**
 * Decrypt a credential using Lit Protocol
 * 
 * @param ciphertext - The encrypted credential (base64 string)
 * @param dataToEncryptHash - The hash of the original credential
 * @param userAddress - The user's wallet address for access control
 * @returns The decrypted credential string
 */
export async function decryptCredential(
  ciphertext: string,
  dataToEncryptHash: string,
  userAddress: string
): Promise<string> {
  try {
    const client = await getLitClient();

    // Get access control conditions
    const accessControlConditions = getCharonAccessControlConditions(userAddress);

    // Get auth signature
    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });

    // Retrieve the encryption key
    const symmetricKey = await client.getEncryptionKey({
      accessControlConditions,
      toDecrypt: dataToEncryptHash,
      chain: CHAIN,
      authSig,
    });

    // Convert base64 ciphertext back to blob
    const encryptedBlob = await LitJsSdk.base64StringToBlob(ciphertext);

    // Decrypt the credential
    const decryptedString = await LitJsSdk.decryptString(
      encryptedBlob,
      symmetricKey
    );

    return decryptedString;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Failed to decrypt credential: ${error}`);
  }
}

/**
 * Verify access control conditions are met
 * 
 * @param userAddress - The user's wallet address
 * @returns Boolean indicating if access is granted
 */
export async function verifyAccess(
  userAddress: string
): Promise<boolean> {
  try {
    const client = await getLitClient();
    const accessControlConditions = getCharonAccessControlConditions(userAddress);
    const authSig = await checkAndSignAuthMessage({
      chain: CHAIN,
    });

    // Test if user has access (using a dummy hash)
    const testHash = "0x" + "0".repeat(64);
    try {
      await client.getEncryptionKey({
        accessControlConditions,
        toDecrypt: testHash,
        chain: CHAIN,
        authSig,
      });
      return true;
    } catch {
      return false;
    }
  } catch (error) {
    console.error("Access verification error:", error);
    return false;
  }
}

