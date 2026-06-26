"""
Lit Protocol decryption service for DECEASED will execution.
"""

import json
import logging
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.config import settings

logger = logging.getLogger(__name__)


class LitDecryptionService:
    """Service for decrypting Lit Protocol encrypted credentials."""

    def __init__(self):
        self.node_script_path = Path(__file__).parent.parent / "scripts" / "lit_decrypt.js"
        self._ensure_node_script()

    def _ensure_node_script(self):
        script_dir = self.node_script_path.parent
        script_dir.mkdir(parents=True, exist_ok=True)
        if not self.node_script_path.exists():
            self._create_node_script()

    def _create_node_script(self):
        script_content = """const LitJsSdk = require('lit-js-sdk');
const { LitNodeClient } = LitJsSdk;

async function decrypt() {
  const input = JSON.parse(process.argv[2] || '{}');
  const {
    ciphertext,
    dataToEncryptHash,
    userAddress,
    chain,
    encryptedSymmetricKey,
    accessControlConditions,
  } = input;

  try {
    const litNetwork = chain === 'sepolia' ? 'cayenne' : 'mumbai';
    const client = new LitNodeClient({ litNetwork, debug: false });
    await client.connect();

    const conditions = accessControlConditions || [];
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain || 'sepolia' });

    let symmetricKey;
    if (encryptedSymmetricKey) {
      symmetricKey = await client.getEncryptionKey({
        accessControlConditions: conditions,
        toDecrypt: encryptedSymmetricKey,
        chain: chain || 'sepolia',
        authSig,
      });
    } else {
      symmetricKey = await client.getEncryptionKey({
        accessControlConditions: conditions,
        toDecrypt: dataToEncryptHash,
        chain: chain || 'sepolia',
        authSig,
      });
    }

    const encryptedBlob = await LitJsSdk.base64StringToBlob(ciphertext);
    const decryptedString = await LitJsSdk.decryptString(encryptedBlob, symmetricKey);
    console.log(JSON.stringify({ success: true, decrypted: decryptedString }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

decrypt();
"""
        with open(self.node_script_path, "w") as f:
            f.write(script_content)

    async def decrypt_credential(
        self,
        ciphertext: str,
        data_to_encrypt_hash: str,
        user_address: str,
        chain: str = "sepolia",
        encrypted_symmetric_key: Optional[str] = None,
        access_control_conditions: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[str]:
        if settings.LIT_DEV_MODE:
            logger.warning("[Lit] LIT_DEV_MODE — returning simulated decryption")
            return self._simulate_decryption(ciphertext, data_to_encrypt_hash)

        payload = {
            "ciphertext": ciphertext,
            "dataToEncryptHash": data_to_encrypt_hash,
            "userAddress": user_address,
            "chain": chain,
            "encryptedSymmetricKey": encrypted_symmetric_key,
            "accessControlConditions": access_control_conditions or [],
        }

        try:
            result = subprocess.run(
                ["node", str(self.node_script_path), json.dumps(payload)],
                capture_output=True,
                text=True,
                timeout=120,
                env={
                    **dict(__import__("os").environ),
                    "CHARON_SWITCH_ADDRESS": settings.CHARON_SWITCH_ADDRESS or "",
                },
            )
            if result.returncode != 0:
                logger.error("[Lit] Node decrypt failed: %s", result.stderr)
                if settings.LIT_DEV_MODE:
                    return self._simulate_decryption(ciphertext, data_to_encrypt_hash)
                return None

            output = json.loads(result.stdout.strip().split("\n")[-1])
            if output.get("success"):
                return output.get("decrypted")
            logger.error("[Lit] Decrypt error: %s", output.get("error"))
            return None
        except Exception as exc:
            logger.error("[Lit] Decryption error: %s", exc)
            return None

    def _simulate_decryption(
        self, ciphertext: str, data_to_encrypt_hash: str
    ) -> Optional[str]:
        logger.info("[Lit] Simulated decryption (development mode)")
        return "DECRYPTED_PASSWORD_PLACEHOLDER"


lit_decryption_service = LitDecryptionService()
