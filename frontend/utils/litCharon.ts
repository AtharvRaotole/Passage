/**
 * Lit Protocol integration for Project Charon
 * Handles encryption/decryption of credentials with access control conditions
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LitJsSdk = require("lit-js-sdk") as any;
type AccessControlConditions = any;

const CHARON_SWITCH_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARON_SWITCH_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

/** Map wagmi chain id to Lit chain string */
function resolveLitChain(): string {
  const explicit = process.env.NEXT_PUBLIC_LIT_CHAIN;
  if (explicit) return explicit;
  const chainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
  if (chainId === "11155111") return "sepolia";
  if (chainId === "80001") return "mumbai";
  if (chainId === "137") return "polygon";
  return "sepolia";
}

function resolveLitNetwork(): string {
  const explicit = process.env.NEXT_PUBLIC_LIT_NETWORK;
  if (explicit) return explicit;
  const chain = resolveLitChain();
  if (chain === "sepolia" || chain === "ethereum") return "cayenne";
  return "mumbai";
}

const CHAIN = resolveLitChain();
const LIT_NETWORK = resolveLitNetwork();

let litClientPromise: Promise<any> | null = null;

/**
 * Initialize Lit Protocol client (singleton — avoids reconnect latency)
 */
export async function getLitClient(): Promise<any> {
  if (!litClientPromise) {
    litClientPromise = (async () => {
      const client = new LitJsSdk.LitNodeClient({
        litNetwork: LIT_NETWORK as any,
        debug: false,
      });
      await client.connect();
      return client;
    })();
  }
  return litClientPromise;
}

/** Prefetch Lit connection on will page mount */
export function prefetchLitClient(): void {
  if (process.env.NEXT_PUBLIC_WILL_SKIP_LIT === "true") return;
  getLitClient().catch(() => {
    litClientPromise = null;
  });
}

export function getLitChain(): string {
  return CHAIN;
}

export function isWillLitEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WILL_SKIP_LIT !== "true";
}

/**
 * Get access control conditions for CharonSwitch (unlock on DECEASED status = 2)
 */
export function getCharonAccessControlConditions(
  userAddress: string
): AccessControlConditions {
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
        value: "2",
      },
    },
  ];
}

export async function encryptCredential(
  credential: string,
  userAddress: string
): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  encryptedSymmetricKey: string;
  accessControlConditions: AccessControlConditions;
}> {
  try {
    const client = await getLitClient();
    const accessControlConditions = getCharonAccessControlConditions(userAddress);

    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      credential
    );
    const ciphertext = await LitJsSdk.blobToBase64String(encryptedString);

    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });

    const encryptedSymmetricKey = await client.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: CHAIN,
    });

    const dataToEncryptHash = await LitJsSdk.hashCredential(credential);

    return {
      ciphertext,
      dataToEncryptHash,
      encryptedSymmetricKey,
      accessControlConditions,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Failed to encrypt credential: ${error}`);
  }
}

/** Dev-only: base64 encode without Lit (when NEXT_PUBLIC_WILL_SKIP_LIT=true) */
export function encryptCredentialDev(credential: string, userAddress: string) {
  const ciphertext = btoa(credential);
  const dataToEncryptHash = `dev_${Date.now()}`;
  return {
    ciphertext,
    dataToEncryptHash,
    encryptedSymmetricKey: "dev_symmetric_key",
    accessControlConditions: getCharonAccessControlConditions(userAddress),
  };
}

export async function decryptCredential(
  ciphertext: string,
  dataToEncryptHash: string,
  userAddress: string
): Promise<string> {
  try {
    const client = await getLitClient();
    const accessControlConditions = getCharonAccessControlConditions(userAddress);

    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: CHAIN,
    });

    const symmetricKey = await client.getEncryptionKey({
      accessControlConditions,
      toDecrypt: dataToEncryptHash,
      chain: CHAIN,
      authSig,
    });

    const encryptedBlob = await LitJsSdk.base64StringToBlob(ciphertext);
    return await LitJsSdk.decryptString(encryptedBlob, symmetricKey);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Failed to decrypt credential: ${error}`);
  }
}

export async function verifyAccess(userAddress: string): Promise<boolean> {
  try {
    const client = await getLitClient();
    const accessControlConditions = getCharonAccessControlConditions(userAddress);
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: CHAIN });
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
  } catch {
    return false;
  }
}
