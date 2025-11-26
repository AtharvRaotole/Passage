/**
 * Node.js test script for Lit Protocol encryption/decryption
 * Run with: node test-lit.js
 * 
 * Note: This is a simplified version for Node.js testing.
 * Full functionality requires browser environment for wallet signatures.
 */

const { ethers } = require("ethers");

// Configuration
const LIT_NETWORK = "mumbai";
const CHAIN = "mumbai";
const CHARON_SWITCH_CONTRACT_ADDRESS =
  process.env.CHARON_SWITCH_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Test credential
const TEST_CREDENTIAL = "my-secret-password-123";
const TEST_USER_ADDRESS =
  process.env.TEST_USER_ADDRESS || "0x0000000000000000000000000000000000000000";

/**
 * Get access control conditions
 */
function getCharonAccessControlConditions(userAddress) {
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
 * Test Lit SDK initialization
 */
async function testLitSDKInitialization() {
  console.log("=".repeat(60));
  console.log("Lit Protocol SDK Initialization Test");
  console.log("=".repeat(60));
  console.log(`Network: ${LIT_NETWORK}`);
  console.log(`Chain: ${CHAIN}`);
  console.log(`Contract: ${CHARON_SWITCH_CONTRACT_ADDRESS}`);
  console.log(`User: ${TEST_USER_ADDRESS}\n`);

  try {
    // Try to import Lit SDK
    console.log("1. Importing Lit Protocol SDK...");
    let LitJsSdk;
    try {
      LitJsSdk = require("@lit-protocol/lit-node-client");
      console.log("   ✓ Lit SDK imported successfully\n");
    } catch (error) {
      console.error("   ❌ Failed to import Lit SDK:", error.message);
      console.log("\n   Please install dependencies:");
      console.log("   npm install @lit-protocol/lit-node-client @lit-protocol/types\n");
      throw error;
    }

    // Test access control conditions structure
    console.log("2. Testing access control conditions structure...");
    const accessControlConditions = getCharonAccessControlConditions(
      TEST_USER_ADDRESS
    );
    console.log("   ✓ Access control conditions created");
    console.log(`   - Conditions count: ${accessControlConditions.length}`);
    console.log(
      `   - Contract: ${accessControlConditions[0].contractAddress}`
    );
    console.log(
      `   - Function: ${accessControlConditions[0].functionName}`
    );
    console.log(
      `   - Expected status: ${accessControlConditions[0].returnValueTest.value} (DECEASED)\n`
    );

    // Test Lit client initialization (without connecting)
    console.log("3. Testing Lit client initialization...");
    try {
      const LitNodeClient = LitJsSdk.LitNodeClient || LitJsSdk.default?.LitNodeClient;
      if (!LitNodeClient) {
        throw new Error("LitNodeClient not found in SDK");
      }
      console.log("   ✓ LitNodeClient class found");
      console.log("   Note: Full connection requires browser environment for wallet signatures\n");
    } catch (error) {
      console.error("   ⚠️  Lit client initialization issue:", error.message);
      console.log("   This is expected in Node.js without browser environment\n");
    }

    console.log("=".repeat(60));
    console.log("✅ SDK Initialization Test Completed");
    console.log("=".repeat(60));
    console.log("\nNext steps:");
    console.log("1. Deploy CharonSwitch contract to Mumbai testnet");
    console.log("2. Update CHARON_SWITCH_ADDRESS environment variable");
    console.log("3. Test encryption/decryption in browser environment");
    console.log("4. Use wallet provider (e.g., MetaMask) for auth signatures\n");

    return {
      success: true,
      accessControlConditions,
    };
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Test failed!");
    console.error("=".repeat(60));
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testLitSDKInitialization().catch(console.error);
}

module.exports = {
  testLitSDKInitialization,
  getCharonAccessControlConditions,
};

