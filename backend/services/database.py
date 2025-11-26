"""
Mock database service for Digital Will storage
In production, this would connect to Supabase/Postgres
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json

# Mock in-memory database
_digital_wills_db: List[Dict[str, Any]] = []


class DigitalWillService:
    """Service for managing Digital Will entries"""

    @staticmethod
    def save_will(user_address: str, will_data: Dict[str, Any]) -> str:
        """
        Save a digital will entry
        
        Args:
            user_address: User's wallet address
            will_data: Dictionary containing:
                - websiteUrl: str
                - username: str
                - encryptedPassword: str
                - passwordHash: str
                - instruction: str
        
        Returns:
            Will entry ID
        """
        will_entry = {
            "id": f"will_{len(_digital_wills_db) + 1}",
            "userAddress": user_address.lower(),
            "websiteUrl": will_data["websiteUrl"],
            "username": will_data["username"],
            "encryptedPassword": will_data["encryptedPassword"],
            "passwordHash": will_data["passwordHash"],
            "instruction": will_data["instruction"],
            "createdAt": will_data.get("createdAt", datetime.utcnow().isoformat()),
            "totpSecret": will_data.get("totpSecret"),  # Optional TOTP secret for 2FA
        }
        
        _digital_wills_db.append(will_entry)
        print(f"[DB] Saved digital will for {user_address}: {will_entry['id']}")
        return will_entry["id"]

    @staticmethod
    def get_wills_by_user(user_address: str) -> List[Dict[str, Any]]:
        """
        Get all digital wills for a user
        
        Args:
            user_address: User's wallet address
        
        Returns:
            List of will entries
        """
        user_wills = [
            will for will in _digital_wills_db
            if will["userAddress"].lower() == user_address.lower()
        ]
        print(f"[DB] Found {len(user_wills)} will(s) for {user_address}")
        return user_wills

    @staticmethod
    def get_will_by_id(will_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific will entry by ID
        
        Args:
            will_id: Will entry ID
        
        Returns:
            Will entry or None
        """
        for will in _digital_wills_db:
            if will["id"] == will_id:
                return will
        return None

    @staticmethod
    def delete_will(will_id: str) -> bool:
        """
        Delete a will entry
        
        Args:
            will_id: Will entry ID
        
        Returns:
            True if deleted, False if not found
        """
        global _digital_wills_db
        initial_count = len(_digital_wills_db)
        _digital_wills_db = [w for w in _digital_wills_db if w["id"] != will_id]
        deleted = len(_digital_wills_db) < initial_count
        if deleted:
            print(f"[DB] Deleted will entry: {will_id}")
        return deleted

    @staticmethod
    def clear_all() -> None:
        """Clear all will entries (for testing)"""
        global _digital_wills_db
        _digital_wills_db.clear()
        print("[DB] Cleared all will entries")


# Global service instance
digital_will_service = DigitalWillService()

