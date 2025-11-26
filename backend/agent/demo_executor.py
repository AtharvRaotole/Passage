"""
DemoExecutor - Safe demo executor that uses mock sites instead of real ones
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright, BrowserContext, Browser
from langchain_openai import ChatOpenAI

# Set browser-use config directory before importing
_browser_use_config_dir = Path(__file__).parent.parent / ".browseruse"
os.environ.setdefault("BROWSER_USE_CONFIG_DIR", str(_browser_use_config_dir))
_browser_use_config_dir.mkdir(parents=True, exist_ok=True)

from browser_use import Agent, Browser as BrowserUseBrowser
from core.config import settings
from services.websocket_manager import websocket_manager
from services.screenshot_service import screenshot_service
import uuid

logger = logging.getLogger(__name__)

# Mock site mappings - redirect real sites to safe demo sites
MOCK_SITE_MAPPINGS = {
    "facebook.com": "mock-facebook.com",
    "www.facebook.com": "mock-facebook.com",
    "bankofamerica.com": "mock-bank.com",
    "www.bankofamerica.com": "mock-bank.com",
    "gmail.com": "mock-gmail.com",
    "mail.google.com": "mock-gmail.com",
    "www.gmail.com": "mock-gmail.com",
    "netflix.com": "mock-facebook.com",  # Reuse mock-facebook for Netflix demo
    "www.netflix.com": "mock-facebook.com",
}

# Local mock site URLs (for development)
LOCAL_MOCK_SITES = {
    "mock-facebook.com": "http://localhost:3001",
    "mock-bank.com": "http://localhost:3002",
    "mock-gmail.com": "http://localhost:3003",
}


class DemoExecutor:
    """
    Executes digital tasks using browser-use AI agent but redirects to mock sites
    All actions are logged but not executed on real platforms
    """

    def __init__(self):
        """Initialize the DemoExecutor"""
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.llm: Optional[ChatOpenAI] = None
        self._initialized = False

    async def _initialize(self) -> None:
        """Initialize Playwright and LLM if not already initialized"""
        if self._initialized:
            return

        # Initialize Playwright
        if not self.playwright:
            self.playwright = await async_playwright().start()

        # Launch browser
        if not self.browser:
            self.browser = await self.playwright.chromium.launch(
                headless=settings.HEADLESS,
                args=["--no-sandbox", "--disable-setuid-sandbox"]
            )

        # Initialize LLM
        if not self.llm:
            self.llm = ChatOpenAI(
                model="gpt-4o",
                temperature=0,
                api_key=settings.OPENAI_API_KEY
            )

        self._initialized = True
        logger.info("DemoExecutor initialized")

    def _map_to_mock_site(self, url: str) -> str:
        """
        Map real site URLs to mock site URLs
        
        Args:
            url: Original URL
            
        Returns:
            Mapped URL to mock site
        """
        url_lower = url.lower()
        
        # Check for exact domain matches
        for real_domain, mock_domain in MOCK_SITE_MAPPINGS.items():
            if real_domain in url_lower:
                # Replace the domain with mock domain
                if url_lower.startswith("http://") or url_lower.startswith("https://"):
                    # Extract protocol and path
                    if "://" in url:
                        protocol = url.split("://")[0]
                        path = url.split(real_domain, 1)[1] if real_domain in url else ""
                        # Use local mock site if available
                        mock_url = LOCAL_MOCK_SITES.get(mock_domain, f"{protocol}://{mock_domain}")
                        return f"{mock_url}{path}"
                else:
                    # No protocol, add https
                    return f"http://{mock_domain}"
        
        # If no mapping found, return original (but log warning)
        logger.warning(f"No mock site mapping for {url}, using original")
        return url

    async def _emit_event(self, execution_id: str, event_type: str, data: Dict[str, Any]) -> None:
        """Emit WebSocket event"""
        try:
            await websocket_manager.send_message(execution_id, {
                "type": event_type,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"Failed to emit event: {e}")

    async def run_task(
        self, 
        task_description: str, 
        session_data: Optional[Dict[str, Any]] = None,
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a task using the browser-use AI agent on mock sites
        
        Args:
            task_description: Description of the task to execute
            session_data: Optional dictionary containing session data
            execution_id: Optional execution ID for WebSocket tracking
            
        Returns:
            Dictionary containing execution results
        """
        if execution_id is None:
            execution_id = str(uuid.uuid4())
        
        # Emit execution started event
        await self._emit_event(execution_id, "execution_started", {
            "task_description": f"[DEMO MODE] {task_description}",
            "timestamp": datetime.now().isoformat(),
            "demo_mode": True
        })
        
        if not self._initialized:
            await self._emit_event(execution_id, "initializing", {
                "message": "Initializing demo agent (using mock sites)..."
            })
            await self._initialize()

        context: Optional[BrowserContext] = None
        agent: Optional[Agent] = None

        try:
            # Create browser context
            context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )

            # Map any URLs in session_data to mock sites
            if session_data and "url" in session_data:
                session_data["url"] = self._map_to_mock_site(session_data["url"])

            # Map task description URLs to mock sites
            mapped_task = task_description
            for real_domain, mock_domain in MOCK_SITE_MAPPINGS.items():
                if real_domain in mapped_task.lower():
                    mapped_task = mapped_task.replace(real_domain, mock_domain)
                    mapped_task = mapped_task.replace(real_domain.replace("www.", ""), mock_domain)
                    await self._emit_event(execution_id, "step", {
                        "step": f"Redirecting {real_domain} to {mock_domain} (DEMO MODE)",
                        "status": "in_progress"
                    })

            # Create browser-use browser wrapper
            browser_use = BrowserUseBrowser(
                context=context,
                save_conversation_path=None
            )

            # Create agent with demo mode instructions
            demo_instructions = """
            You are operating in DEMO MODE. You are navigating to MOCK SITES that look real but are safe playgrounds.
            - All actions are logged but NOT executed on real platforms
            - You can click buttons, fill forms, and navigate freely
            - These are demo sites: mock-facebook.com, mock-bank.com, mock-gmail.com
            - Be helpful and demonstrate the functionality, but remember this is a demo
            """
            
            agent = Agent(
                task=mapped_task,
                browser=browser_use,
                llm=self.llm,
                system_instructions=demo_instructions
            )

            await self._emit_event(execution_id, "step", {
                "step": "Starting demo execution on mock sites",
                "status": "in_progress"
            })

            # Run the agent
            result = await agent.run()

            # Take final screenshot
            page = await context.new_page()
            screenshot_path = await screenshot_service.capture_screenshot(
                page,
                execution_id,
                "final_state"
            )
            await page.close()

            await self._emit_event(execution_id, "execution_completed", {
                "success": True,
                "output": f"[DEMO MODE] {result}",
                "demo_mode": True,
                "screenshot": screenshot_path
            })

            return {
                "success": True,
                "output": f"[DEMO MODE] Task completed on mock sites. {result}",
                "demo_mode": True,
                "execution_id": execution_id,
                "screenshots": [screenshot_path] if screenshot_path else []
            }

        except Exception as e:
            logger.error(f"Demo execution error: {e}", exc_info=True)
            await self._emit_event(execution_id, "error", {
                "error": str(e),
                "demo_mode": True
            })
            return {
                "success": False,
                "error": f"[DEMO MODE] {str(e)}",
                "demo_mode": True,
                "execution_id": execution_id
            }
        finally:
            if context:
                await context.close()

    async def cleanup(self) -> None:
        """Cleanup resources"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        self._initialized = False

