"""
Memory Scraper - Agent extension to automatically scrape photos and albums
from Google Photos, Facebook, etc. when user status becomes DECEASED
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

from agent.executor import DigitalExecutor
from services.memory_book_generator import MemoryBookGenerator
from services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class MemoryScraper:
    """Scrapes user's photos and albums to create a memory book"""

    def __init__(self):
        self.executor = DigitalExecutor()
        self.memory_generator = MemoryBookGenerator()
        self.playwright = None
        self.browser: Optional[Browser] = None

    async def _initialize(self) -> None:
        """Initialize browser"""
        if not self.playwright:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)

    async def scrape_google_photos(
        self,
        user_credentials: Dict[str, Any],
        execution_id: str
    ) -> List[Dict[str, Any]]:
        """
        Scrape photos from Google Photos
        
        Args:
            user_credentials: Dictionary with email/password or session data
            execution_id: Execution ID for WebSocket updates
            
        Returns:
            List of memory objects
        """
        await self._initialize()
        context = await self.browser.new_context()
        page = await context.new_page()

        memories = []

        try:
            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Accessing Google Photos",
                    "status": "in_progress"
                },
                "timestamp": datetime.now().isoformat()
            })

            # Navigate to Google Photos
            await page.goto("https://photos.google.com")
            await page.wait_for_timeout(2000)

            # Login if needed (using credentials or session)
            if "email" in user_credentials and "password" in user_credentials:
                # Login flow
                await page.fill('input[type="email"]', user_credentials["email"])
                await page.click('button:has-text("Next")')
                await page.wait_for_timeout(1000)
                await page.fill('input[type="password"]', user_credentials["password"])
                await page.click('button:has-text("Next")')
                await page.wait_for_timeout(3000)

            # Scrape photo albums
            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Scraping photo albums",
                    "status": "in_progress"
                },
                "timestamp": datetime.now().isoformat()
            })

            # Find all photo elements (this is a simplified version)
            # In production, you'd need to handle Google Photos' dynamic loading
            photo_elements = await page.query_selector_all('img[data-photo-id]')
            
            for i, photo_elem in enumerate(photo_elements[:50]):  # Limit to 50 for demo
                try:
                    # Get photo URL
                    photo_url = await photo_elem.get_attribute('src')
                    if not photo_url:
                        continue

                    # Get photo metadata (title, date, etc.)
                    title = await photo_elem.get_attribute('alt') or f"Photo {i+1}"
                    
                    # Create memory object
                    memory = {
                        "title": title,
                        "description": f"Photo from Google Photos album",
                        "date": datetime.now().isoformat(),
                        "type": "photo",
                        "source_url": photo_url,
                        "source": "google_photos"
                    }
                    memories.append(memory)

                except Exception as e:
                    logger.error(f"Error scraping photo {i}: {e}")
                    continue

            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": f"Found {len(memories)} photos from Google Photos",
                    "status": "completed"
                },
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Error scraping Google Photos: {e}")
            await websocket_manager.send_message(execution_id, {
                "type": "error",
                "data": {
                    "error": f"Failed to scrape Google Photos: {str(e)}"
                },
                "timestamp": datetime.now().isoformat()
            })
        finally:
            await context.close()

        return memories

    async def scrape_facebook_albums(
        self,
        user_credentials: Dict[str, Any],
        execution_id: str
    ) -> List[Dict[str, Any]]:
        """
        Scrape photos from Facebook albums
        
        Args:
            user_credentials: Dictionary with email/password or session data
            execution_id: Execution ID for WebSocket updates
            
        Returns:
            List of memory objects
        """
        await self._initialize()
        context = await self.browser.new_context()
        page = await context.new_page()

        memories = []

        try:
            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Accessing Facebook",
                    "status": "in_progress"
                },
                "timestamp": datetime.now().isoformat()
            })

            # Navigate to Facebook
            await page.goto("https://www.facebook.com")
            await page.wait_for_timeout(2000)

            # Login if needed
            if "email" in user_credentials and "password" in user_credentials:
                await page.fill('input[name="email"]', user_credentials["email"])
                await page.fill('input[name="pass"]', user_credentials["password"])
                await page.click('button[name="login"]')
                await page.wait_for_timeout(3000)

            # Navigate to photos
            await page.goto("https://www.facebook.com/photos")
            await page.wait_for_timeout(2000)

            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Scraping Facebook albums",
                    "status": "in_progress"
                },
                "timestamp": datetime.now().isoformat()
            })

            # Find photo elements
            photo_elements = await page.query_selector_all('img[data-imgperflogname]')
            
            for i, photo_elem in enumerate(photo_elements[:50]):  # Limit to 50
                try:
                    photo_url = await photo_elem.get_attribute('src')
                    if not photo_url:
                        continue

                    title = await photo_elem.get_attribute('alt') or f"Facebook Photo {i+1}"
                    
                    memory = {
                        "title": title,
                        "description": f"Photo from Facebook album",
                        "date": datetime.now().isoformat(),
                        "type": "photo",
                        "source_url": photo_url,
                        "source": "facebook"
                    }
                    memories.append(memory)

                except Exception as e:
                    logger.error(f"Error scraping Facebook photo {i}: {e}")
                    continue

            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": f"Found {len(memories)} photos from Facebook",
                    "status": "completed"
                },
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Error scraping Facebook: {e}")
            await websocket_manager.send_message(execution_id, {
                "type": "error",
                "data": {
                    "error": f"Failed to scrape Facebook: {str(e)}"
                },
                "timestamp": datetime.now().isoformat()
            })
        finally:
            await context.close()

        return memories

    async def create_memory_book(
        self,
        user_address: str,
        user_name: str,
        memories: List[Dict[str, Any]],
        execution_id: str,
        ens_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a digital memory book from scraped memories
        
        Args:
            user_address: User's wallet address
            user_name: User's name
            memories: List of memory objects
            execution_id: Execution ID for updates
            ens_domain: Optional ENS domain
            
        Returns:
            Dictionary with memory book info
        """
        try:
            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Generating memory book",
                    "status": "in_progress"
                },
                "timestamp": datetime.now().isoformat()
            })

            # Generate the static site
            result = self.memory_generator.generate_memory_book(
                user_address=user_address,
                user_name=user_name,
                memories=memories,
                ens_domain=ens_domain
            )

            await websocket_manager.send_message(execution_id, {
                "type": "step",
                "data": {
                    "step": "Memory book generated successfully",
                    "status": "completed"
                },
                "timestamp": datetime.now().isoformat()
            })

            return result

        except Exception as e:
            logger.error(f"Error creating memory book: {e}")
            raise

    async def cleanup(self) -> None:
        """Cleanup resources"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

