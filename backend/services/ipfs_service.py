"""
IPFS Service for storing encrypted memories
"""

import os
import requests
import logging
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class IPFSService:
    """Service for interacting with IPFS"""

    def __init__(self, pinata_api_key: Optional[str] = None, pinata_secret_key: Optional[str] = None):
        """
        Initialize IPFS service
        
        Args:
            pinata_api_key: Pinata API key (optional, uses env var if not provided)
            pinata_secret_key: Pinata secret key (optional, uses env var if not provided)
        """
        self.pinata_api_key = pinata_api_key or os.getenv("PINATA_API_KEY")
        self.pinata_secret_key = pinata_secret_key or os.getenv("PINATA_SECRET_KEY")
        self.pinata_endpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        self.ipfs_gateway = "https://gateway.pinata.cloud/ipfs"

    def upload_file(self, file_path: Path, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Upload a file to IPFS via Pinata
        
        Args:
            file_path: Path to the file to upload
            metadata: Optional metadata to attach
            
        Returns:
            IPFS hash (CID)
        """
        if not self.pinata_api_key or not self.pinata_secret_key:
            logger.warning("Pinata credentials not set, using mock IPFS hash")
            return f"QmMockHash{hash(str(file_path))}"

        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f)}
                headers = {
                    "pinata_api_key": self.pinata_api_key,
                    "pinata_secret_api_key": self.pinata_secret_key,
                }
                
                if metadata:
                    headers["pinata_metadata"] = str(metadata)

                response = requests.post(
                    self.pinata_endpoint,
                    files=files,
                    headers=headers,
                    timeout=30
                )
                response.raise_for_status()
                
                result = response.json()
                ipfs_hash = result["IpfsHash"]
                
                logger.info(f"File uploaded to IPFS: {ipfs_hash}")
                return ipfs_hash

        except Exception as e:
            logger.error(f"Error uploading to IPFS: {e}")
            # Return mock hash for development
            return f"QmMockHash{hash(str(file_path))}"

    def upload_directory(self, directory_path: Path) -> str:
        """
        Upload a directory to IPFS
        
        Args:
            directory_path: Path to directory to upload
            
        Returns:
            IPFS hash of the directory
        """
        # For now, we'll zip the directory and upload
        # In production, use pinata's directory upload endpoint
        import zipfile
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_file:
            zip_path = Path(tmp_file.name)
            
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for file_path in directory_path.rglob("*"):
                    if file_path.is_file():
                        zipf.write(file_path, file_path.relative_to(directory_path))

            return self.upload_file(zip_path)

    def get_file_url(self, ipfs_hash: str) -> str:
        """
        Get the URL to access a file on IPFS
        
        Args:
            ipfs_hash: IPFS hash (CID)
            
        Returns:
            URL to access the file
        """
        return f"{self.ipfs_gateway}/{ipfs_hash}"

