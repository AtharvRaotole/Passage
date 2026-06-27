import path from "node:path";
import fs from "node:fs";
import { PKPass } from "passkit-generator";
import { computeRelevantDate } from "./pulseUtils";

export interface WalletPassUser {
  privyUserId: string;
  walletAddress: string;
  email?: string | null;
  displayName?: string | null;
  lastSeenMs?: number | null;
  thresholdSeconds?: number | null;
}

export interface ApplePassConfig {
  passTypeIdentifier: string;
  teamIdentifier: string;
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
}

export function getApplePassConfig(): ApplePassConfig | null {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER;
  const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER;

  const wwdr = readCertEnv("APPLE_WWDR_CERT_PEM", "APPLE_WWDR_CERT_PATH");
  const signerCert = readCertEnv(
    "APPLE_PASS_CERT_PEM",
    "APPLE_PASS_CERT_PATH"
  );
  const signerKey = readCertEnv("APPLE_PASS_KEY_PEM", "APPLE_PASS_KEY_PATH");

  if (
    !passTypeIdentifier ||
    !teamIdentifier ||
    !wwdr ||
    !signerCert ||
    !signerKey
  ) {
    return null;
  }

  return {
    passTypeIdentifier,
    teamIdentifier,
    wwdr,
    signerCert,
    signerKey,
    signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE,
  };
}

function readCertEnv(pemEnv: string, pathEnv: string): Buffer | null {
  const pem = process.env[pemEnv];
  if (pem) {
    return Buffer.from(pem.replace(/\\n/g, "\n"), "utf8");
  }
  const filePath = process.env[pathEnv];
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  return null;
}

function loadPassAssets(): Record<string, Buffer> {
  const assetDir = path.join(process.cwd(), "public", "wallet-pass");
  const assets: Record<string, Buffer> = {};
  const files = ["icon.png", "icon@2x.png", "logo.png", "logo@2x.png"];

  for (const file of files) {
    const filePath = path.join(assetDir, file);
    if (fs.existsSync(filePath)) {
      assets[file] = fs.readFileSync(filePath);
    }
  }

  if (!assets["icon.png"]) {
    throw new Error("Wallet pass icon.png is missing from public/wallet-pass/");
  }

  return assets;
}

export function getServerAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function generateAppleWalletPass(
  user: WalletPassUser
): Promise<Buffer> {
  const config = getApplePassConfig();
  if (!config) {
    throw new Error("wallet_pass_not_configured");
  }

  const pulseUrl = `${getServerAppUrl()}/pulse`;
  const displayName =
    user.displayName || user.email?.split("@")[0] || "Passage Member";
  const lastCheckIn = user.lastSeenMs
    ? new Date(user.lastSeenMs).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not yet";

  const relevantDate = computeRelevantDate(
    user.lastSeenMs ?? null,
    user.thresholdSeconds ?? null
  );

  const pass = new PKPass(
    loadPassAssets(),
    {
      wwdr: config.wwdr,
      signerCert: config.signerCert,
      signerKey: config.signerKey,
      signerKeyPassphrase: config.signerKeyPassphrase,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: config.passTypeIdentifier,
      teamIdentifier: config.teamIdentifier,
      organizationName: "Passage",
      description: "Passage Check-in Pass",
      serialNumber: user.privyUserId.replace(/[^a-zA-Z0-9._-]/g, "_"),
      logoText: "Passage",
      appLaunchURL: pulseUrl,
      backgroundColor: "rgb(23, 23, 23)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(163, 163, 163)",
    }
  );

  pass.type = "generic";
  pass.primaryFields.push({
    key: "member",
    label: "MEMBER",
    value: displayName,
  });
  pass.secondaryFields.push({
    key: "lastCheckIn",
    label: "LAST CHECK-IN",
    value: lastCheckIn,
  });
  pass.auxiliaryFields.push({
    key: "wallet",
    label: "WALLET",
    value: `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
  });
  pass.backFields.push(
    {
      key: "checkIn",
      label: "Check in now",
      value: pulseUrl,
      attributedValue: `<a href="${pulseUrl}">Open check-in</a>`,
    },
    {
      key: "about",
      label: "About",
      value:
        "Tap the link above to confirm you're active. This updates your on-chain heartbeat.",
    }
  );

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: pulseUrl,
    messageEncoding: "iso-8859-1",
    altText: "Check in to Passage",
  });

  if (relevantDate) {
    pass.setRelevantDate(new Date(relevantDate));
  }

  return pass.getAsBuffer();
}

export function isWalletPassConfigured(): boolean {
  return getApplePassConfig() !== null;
}
