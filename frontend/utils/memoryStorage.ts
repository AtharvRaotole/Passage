/**
 * Memory storage utilities for IPFS and Lit Protocol encryption
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LitJsSdk = require("lit-js-sdk") as any;
import { getLitClient, getCharonAccessControlConditions } from "./litCharon";
import { apiFetch, getBackendUrl } from "./apiClient";

/**
 * Encrypt a memory file using Lit Protocol
 */
export async function encryptMemory(
  file: File,
  userAddress: string
): Promise<{ encryptedFile: Blob; metadata: any }> {
  const client = await getLitClient();
  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: "mumbai",
  });

  const fileBuffer = await file.arrayBuffer();
  const fileBlob = new Blob([fileBuffer], { type: file.type });

  const accessControlConditions = getCharonAccessControlConditions(userAddress);

  const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({
    file: fileBlob,
  });

  const encryptedSymmetricKey = await client.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain: "mumbai",
  });

  return {
    encryptedFile,
    metadata: {
      encryptedSymmetricKey,
      accessControlConditions,
      originalType: file.type,
      originalName: file.name,
    },
  };
}

/**
 * Upload encrypted memory to IPFS via backend
 */
export async function uploadToIPFS(data: {
  encryptedFile: Blob;
  metadata: any;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", data.encryptedFile, "encrypted-memory");
  formData.append("metadata", JSON.stringify(data.metadata));

  const response = await apiFetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload to IPFS");
  }

  const result = await response.json();
  return result.ipfsHash;
}

/**
 * Decrypt a memory file
 */
export async function decryptMemory(
  ipfsHash: string,
  userAddress: string
): Promise<Blob> {
  const response = await apiFetch(`/api/ipfs/${ipfsHash}`);
  if (!response.ok) {
    throw new Error("Failed to fetch from IPFS");
  }

  const data = await response.json();
  const { encryptedFile, metadata } = data;

  const client = await getLitClient();
  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: "mumbai",
  });

  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions: metadata.accessControlConditions,
    toDecrypt: metadata.encryptedSymmetricKey,
    chain: "mumbai",
    authSig,
  });

  const decryptedFile = await LitJsSdk.decryptFile({
    file: encryptedFile,
    symmetricKey,
  });

  return decryptedFile;
}

export { getBackendUrl };
