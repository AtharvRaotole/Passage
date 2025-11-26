"""
Screenshot service for capturing and storing agent screenshots
"""
import base64
import hashlib
from pathlib import Path
from typing import Optional
from datetime import datetime
from PIL import Image, ImageFilter
import io
import logging

logger = logging.getLogger(__name__)


class ScreenshotService:
    """Service for capturing, storing, and blurring screenshots"""

    def __init__(self, storage_dir: Path = None):
        """
        Initialize screenshot service
        
        Args:
            storage_dir: Directory to store screenshots (defaults to ./screenshots)
        """
        if storage_dir is None:
            storage_dir = Path(__file__).parent.parent / "screenshots"
        
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        (self.storage_dir / "raw").mkdir(exist_ok=True)
        (self.storage_dir / "blurred").mkdir(exist_ok=True)

    async def capture_screenshot(
        self, page, execution_id: str, step_name: str
    ) -> Optional[dict]:
        """
        Capture a screenshot from a Playwright page
        
        Args:
            page: Playwright page object
            execution_id: Unique execution identifier
            step_name: Name of the current step
            
        Returns:
            Dictionary with screenshot metadata or None if failed
        """
        try:
            # Capture screenshot as bytes
            screenshot_bytes = await page.screenshot(full_page=True)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"{execution_id}_{step_name}_{timestamp}.png"
            
            # Save raw screenshot
            raw_path = self.storage_dir / "raw" / filename
            raw_path.write_bytes(screenshot_bytes)
            
            # Create blurred version
            blurred_path = self.storage_dir / "blurred" / filename
            blurred_image = self._blur_sensitive_info(screenshot_bytes)
            blurred_path.write_bytes(blurred_image)
            
            # Convert to base64 for WebSocket transmission
            blurred_base64 = base64.b64encode(blurred_image).decode("utf-8")
            
            return {
                "url": f"/api/screenshots/{execution_id}/{filename}",
                "blurred_url": f"/api/screenshots/{execution_id}/blurred/{filename}",
                "base64": blurred_base64,
                "filename": filename,
                "timestamp": datetime.now().isoformat(),
                "step_name": step_name,
            }
        except Exception as e:
            logger.error(f"Error capturing screenshot: {e}")
            return None

    def _blur_sensitive_info(self, image_bytes: bytes) -> bytes:
        """
        Blur sensitive information in screenshot
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Blurred image bytes
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Apply Gaussian blur to entire image (simple approach)
            # In production, you might want to detect and blur specific regions
            blurred = image.filter(ImageFilter.GaussianBlur(radius=2))
            
            # Convert back to bytes
            output = io.BytesIO()
            blurred.save(output, format="PNG")
            return output.getvalue()
        except Exception as e:
            logger.error(f"Error blurring screenshot: {e}")
            # Return original if blurring fails
            return image_bytes

    def get_screenshot_path(self, execution_id: str, filename: str, blurred: bool = False) -> Optional[Path]:
        """
        Get path to a stored screenshot
        
        Args:
            execution_id: Execution ID
            filename: Screenshot filename
            blurred: Whether to get blurred version
            
        Returns:
            Path to screenshot or None if not found
        """
        subdir = "blurred" if blurred else "raw"
        path = self.storage_dir / subdir / filename
        
        if path.exists():
            return path
        return None

    def cleanup_old_screenshots(self, max_age_hours: int = 24):
        """
        Clean up screenshots older than max_age_hours
        
        Args:
            max_age_hours: Maximum age in hours
        """
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        for subdir in ["raw", "blurred"]:
            dir_path = self.storage_dir / subdir
            if not dir_path.exists():
                continue
                
            for file_path in dir_path.iterdir():
                if file_path.is_file():
                    file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if file_time < cutoff_time:
                        try:
                            file_path.unlink()
                            logger.info(f"Deleted old screenshot: {file_path}")
                        except Exception as e:
                            logger.error(f"Error deleting screenshot {file_path}: {e}")


# Global screenshot service instance
screenshot_service = ScreenshotService()

