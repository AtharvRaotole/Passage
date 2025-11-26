/**
 * Memory storage utilities for IPFS and Lit Protocol encryption
 */

import * as LitJsSdk from "lit-js-sdk";
import { getLitClient, getCharonAccessControlConditions } from "./litCharon";

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

  // Read file as array buffer
  const fileBuffer = await file.arrayBuffer();
  const fileBlob = new Blob([fileBuffer], { type: file.type });

  // Get access control conditions (unlock on DECEASED status)
  const accessControlConditions = getCharonAccessControlConditions(userAddress);

  // Encrypt the file
  const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({
    file: fileBlob,
  });

  // Save encryption key with access control
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
 * Upload encrypted memory to IPFS
 */
export async function uploadToIPFS(data: {
  encryptedFile: Blob;
  metadata: any;
}): Promise<string> {
  // Create form data
  const formData = new FormData();
  formData.append("file", data.encryptedFile, "encrypted-memory");
  formData.append("metadata", JSON.stringify(data.metadata));

  // Upload to IPFS via Pinata or similar service
  // For demo, we'll use a mock IPFS service
  const response = await fetch("/api/ipfs/upload", {
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
  // Fetch from IPFS
  const response = await fetch(`/api/ipfs/${ipfsHash}`);
  if (!response.ok) {
    throw new Error("Failed to fetch from IPFS");
  }

  const data = await response.json();
  const { encryptedFile, metadata } = data;

  // Get Lit client
  const client = await getLitClient();
  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: "mumbai",
  });

  // Retrieve encryption key
  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions: metadata.accessControlConditions,
    toDecrypt: metadata.encryptedSymmetricKey,
    chain: "mumbai",
    authSig,
  });

  // Decrypt file
  const decryptedFile = await LitJsSdk.decryptFile({
    file: encryptedFile,
    symmetricKey,
  });

  return decryptedFile;
}

