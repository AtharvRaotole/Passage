/**
 * Test script for Lit Protocol encryption/decryption
 * Run with: npx ts-node test-lit.ts
 */

import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";

// Configuration
const LIT_NETWORK = "mumbai";
const CHAIN = "mumbai";
const CHARON_SWITCH_CONTRACT_ADDRESS =
  process.env.CHARON_SWITCH_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Test credential
const TEST_CREDENTIAL = "my-secret-password-123";
const TEST_USER_ADDRESS = process.env.TEST_USER_ADDRESS || "0x0000000000000000000000000000000000000000";

/**
 * Get access control conditions
 */
function getCharonAccessControlConditions(userAddress: string) {
  return [
    {
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
  ];
}

/**
 * Test encryption
 */
async function testEncryption() {
  console.log("🔐 Testing Lit Protocol Encryption...\n");

  try {
    // Initialize Lit client
    console.log("1. Initializing Lit Protocol client...");
    const client = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK as any,
      debug: true,
    });
    await client.connect();
    console.log("   ✓ Lit client connected\n");

    // Get access control conditions
    console.log("2. Setting up access control conditions...");
    const accessControlConditions = getCharonAccessControlConditions(
      TEST_USER_ADDRESS
    );
    console.log("   ✓ Access control conditions configured\n");

    // Encrypt the credential
    console.log("3. Encrypting credential...");
    console.log(`   Original: ${TEST_CREDENTIAL}`);
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      TEST_CREDENTIAL
    );
    const ciphertext = await LitJsSdk.blobToBase64String(encryptedString);
    console.log(`   ✓ Encrypted to base64 (length: ${ciphertext.length})\n`);

    // Get auth signature (this will prompt for wallet connection in browser)
    console.log("4. Getting auth signature...");
    console.log("   Note: In browser, this will prompt for wallet signature");
    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });
    console.log("   ✓ Auth signature obtained\n");

    // Save encryption key
    console.log("5. Saving encryption key with access control...");
    const encryptedSymmetricKey = await client.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: CHAIN,
    });
    console.log("   ✓ Encryption key saved\n");

    // Create hash
    console.log("6. Creating credential hash...");
    const dataToEncryptHash = await LitJsSdk.hashCredential(TEST_CREDENTIAL);
    console.log(`   ✓ Hash: ${dataToEncryptHash}\n`);

    console.log("✅ Encryption test completed successfully!\n");
    console.log("Results:");
    console.log(`  - Ciphertext length: ${ciphertext.length} characters`);
    console.log(`  - Hash: ${dataToEncryptHash}`);
    console.log(`  - Access conditions: ${accessControlConditions.length} condition(s)\n`);

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    };
  } catch (error: any) {
    console.error("❌ Encryption test failed:", error);
    throw error;
  }
}

/**
 * Test decryption
 */
async function testDecryption(
  ciphertext: string,
  dataToEncryptHash: string,
  userAddress: string
) {
  console.log("🔓 Testing Lit Protocol Decryption...\n");

  try {
    // Initialize Lit client
    console.log("1. Initializing Lit Protocol client...");
    const client = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK as any,
      debug: true,
    });
    await client.connect();
    console.log("   ✓ Lit client connected\n");

    // Get access control conditions
    console.log("2. Setting up access control conditions...");
    const accessControlConditions = getCharonAccessControlConditions(
      userAddress
    );
    console.log("   ✓ Access control conditions configured\n");

    // Get auth signature
    console.log("3. Getting auth signature...");
    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });
    console.log("   ✓ Auth signature obtained\n");

    // Retrieve encryption key
    console.log("4. Retrieving encryption key...");
    const symmetricKey = await client.getEncryptionKey({
      accessControlConditions,
      toDecrypt: dataToEncryptHash,
      chain: CHAIN,
      authSig,
    });
    console.log("   ✓ Encryption key retrieved\n");

    // Decrypt
    console.log("5. Decrypting credential...");
    const encryptedBlob = await LitJsSdk.base64StringToBlob(ciphertext);
    const decryptedString = await LitJsSdk.decryptString(
      encryptedBlob,
      symmetricKey
    );
    console.log(`   ✓ Decrypted: ${decryptedString}\n`);

    // Verify
    if (decryptedString === TEST_CREDENTIAL) {
      console.log("✅ Decryption test passed! Credential matches original.\n");
      return decryptedString;
    } else {
      throw new Error("Decrypted credential does not match original!");
    }
  } catch (error: any) {
    console.error("❌ Decryption test failed:", error);
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Lit Protocol Test Suite for Project Charon");
  console.log("=".repeat(60));
  console.log(`Network: ${LIT_NETWORK}`);
  console.log(`Chain: ${CHAIN}`);
  console.log(`Contract: ${CHARON_SWITCH_CONTRACT_ADDRESS}`);
  console.log(`User: ${TEST_USER_ADDRESS}\n`);

  try {
    // Test encryption
    const { ciphertext, dataToEncryptHash, accessControlConditions } =
      await testEncryption();

    // Test decryption
    await testDecryption(ciphertext, dataToEncryptHash, TEST_USER_ADDRESS);

    console.log("=".repeat(60));
    console.log("✅ All tests passed!");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Test suite failed!");
    console.error("=".repeat(60));
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

export { testEncryption, testDecryption, getCharonAccessControlConditions };

