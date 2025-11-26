"""
DigitalExecutor - AI agent executor using browser-use library
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
# Use a directory in the project instead of system config
_browser_use_config_dir = Path(__file__).parent.parent / ".browseruse"
os.environ.setdefault("BROWSER_USE_CONFIG_DIR", str(_browser_use_config_dir))
_browser_use_config_dir.mkdir(parents=True, exist_ok=True)

from browser_use import Agent, Browser as BrowserUseBrowser
from core.config import settings
from services.totp_handler import TotpHandler
from services.websocket_manager import websocket_manager
from services.screenshot_service import screenshot_service
import uuid

logger = logging.getLogger(__name__)


class DigitalExecutor:
    """
    Executes digital tasks using browser-use AI agent with GPT-4o
    """

    def __init__(self):
        """Initialize the DigitalExecutor"""
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.llm: Optional[ChatOpenAI] = None
        self._initialized = False
        self.totp_handler = TotpHandler()

    async def _initialize(self) -> None:
        """Initialize Playwright and LLM if not already initialized"""
        if self._initialized:
            return

        # Initialize Playwright
        if not self.playwright:
            self.playwright = await async_playwright().start()

        # Initialize browser if not already done
        if not self.browser:
            self.browser = await self.playwright.chromium.launch(
                headless=settings.BROWSER_HEADLESS
            )

        # Initialize LLM with GPT-4o
        if not self.llm:
            if not settings.OPENAI_API_KEY:
                raise ValueError(
                    "OPENAI_API_KEY is required. Please set it in your .env file."
                )

            self.llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=0.7,
                openai_api_key=settings.OPENAI_API_KEY,
            )

        self._initialized = True

    async def _create_browser_context(
        self, session_data: Dict[str, Any]
    ) -> BrowserContext:
        """
        Create a secure browser context with session data (cookies, tokens)

        Args:
            session_data: Dictionary containing cookies, localStorage, sessionStorage, etc.

        Returns:
            Configured browser context
        """
        if not self.browser:
            await self._initialize()

        # Create a new browser context
        context = await self.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )

        # Handle cookies from session_data
        if "cookies" in session_data:
            cookies = session_data["cookies"]
            if isinstance(cookies, list):
                # Playwright expects cookies in a specific format
                formatted_cookies = []
                for cookie in cookies:
                    if isinstance(cookie, dict):
                        # Ensure required fields
                        formatted_cookie = {
                            "name": cookie.get("name", ""),
                            "value": cookie.get("value", ""),
                            "domain": cookie.get("domain", ""),
                            "path": cookie.get("path", "/"),
                        }
                        # Add optional fields if present
                        if "expires" in cookie:
                            formatted_cookie["expires"] = cookie["expires"]
                        if "httpOnly" in cookie:
                            formatted_cookie["httpOnly"] = cookie["httpOnly"]
                        if "secure" in cookie:
                            formatted_cookie["secure"] = cookie["secure"]
                        if "sameSite" in cookie:
                            formatted_cookie["sameSite"] = cookie["sameSite"]

                        formatted_cookies.append(formatted_cookie)

                if formatted_cookies:
                    await context.add_cookies(formatted_cookies)

        # Create a new page to set localStorage and sessionStorage
        page = await context.new_page()

        # Handle localStorage
        if "localStorage" in session_data:
            localStorage = session_data["localStorage"]
            if isinstance(localStorage, dict):
                for key, value in localStorage.items():
                    await page.evaluate(
                        f"localStorage.setItem('{key}', '{value}')"
                    )

        # Handle sessionStorage
        if "sessionStorage" in session_data:
            sessionStorage = session_data["sessionStorage"]
            if isinstance(sessionStorage, dict):
                for key, value in sessionStorage.items():
                    await page.evaluate(
                        f"sessionStorage.setItem('{key}', '{value}')"
                    )

        # Handle authentication tokens in headers
        if "headers" in session_data:
            headers = session_data["headers"]
            if isinstance(headers, dict):
                await context.set_extra_http_headers(headers)

        await page.close()

        return context

    async def run_task(
        self, 
        task_description: str, 
        session_data: Optional[Dict[str, Any]] = None,
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a task using the browser-use AI agent

        Args:
            task_description: Description of the task to execute
            session_data: Optional dictionary containing:
                - cookies: List of cookie dictionaries
                - localStorage: Dictionary of localStorage items
                - sessionStorage: Dictionary of sessionStorage items
                - headers: Dictionary of HTTP headers
                - url: Optional starting URL
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Dictionary containing:
                - success: Boolean indicating if task succeeded
                - output: Task execution output
                - error: Optional error message
                - screenshots: Optional list of screenshot paths
        """
        if execution_id is None:
            execution_id = str(uuid.uuid4())
        
        # Emit execution started event
        await self._emit_event(execution_id, "execution_started", {
            "task_description": task_description,
            "timestamp": datetime.now().isoformat()
        })
        
        if not self._initialized:
            await self._emit_event(execution_id, "initializing", {"message": "Initializing agent..."})
            await self._initialize()

        context: Optional[BrowserContext] = None
        agent: Optional[Agent] = None

        try:
            # Create browser context with session data
            await self._emit_event(execution_id, "step", {
                "step": "Creating browser context",
                "status": "in_progress"
            })
            
            if session_data:
                context = await self._create_browser_context(session_data)
            else:
                if not self.browser:
                    await self._initialize()
                context = await self.browser.new_context(
                    viewport={"width": 1920, "height": 1080}
                )
            
            await self._emit_event(execution_id, "step", {
                "step": "Creating browser context",
                "status": "completed"
            })

            # Create BrowserUseBrowser wrapper
            browser_use = BrowserUseBrowser(
                start_url=session_data.get("url", "about:blank")
                if session_data
                else "about:blank",
                browser_context=context,
            )

            # Enhance task description with 2FA handling instructions
            enhanced_task = self._enhance_task_with_2fa(
                task_description, session_data
            )

            await self._emit_event(execution_id, "step", {
                "step": "Initializing AI agent",
                "status": "in_progress"
            })

            # Initialize the Agent with GPT-4o
            agent = Agent(
                task=enhanced_task,
                browser=browser_use,
                llm=self.llm,
            )

            await self._emit_event(execution_id, "step", {
                "step": "Initializing AI agent",
                "status": "completed"
            })

            # Run the task with retry logic
            result = await self._run_task_with_retry(
                agent, context, execution_id, max_retries=3
            )

            return result

        except Exception as e:
            await self._emit_event(execution_id, "error", {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            return {
                "success": False,
                "output": None,
                "error": str(e),
            }

        finally:
            # Clean up context
            if context:
                try:
                    await context.close()
                except Exception:
                    pass

    async def cleanup(self) -> None:
        """Clean up resources"""
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass

        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass

        self._initialized = False
        self.browser = None
        self.playwright = None
        self.llm = None

    async def _run_task_with_retry(
        self,
        agent: Agent,
        context: BrowserContext,
        execution_id: str,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Run task with retry logic and screenshot capture on failure
        
        Args:
            agent: Browser-use agent instance
            context: Browser context
            max_retries: Maximum number of retry attempts
        
        Returns:
            Result dictionary with success status and output/error
        """
        last_error = None
        
        for attempt in range(1, max_retries + 1):
            try:
                await self._emit_event(execution_id, "step", {
                    "step": f"Executing task (attempt {attempt}/{max_retries})",
                    "status": "in_progress",
                    "attempt": attempt
                })
                
                logger.info(f"Attempting task execution (attempt {attempt}/{max_retries})")
                result = await agent.run()
                
                # Capture success screenshot
                pages = context.pages
                if pages:
                    screenshot = await screenshot_service.capture_screenshot(
                        pages[0], execution_id, "success"
                    )
                    if screenshot:
                        await self._emit_event(execution_id, "screenshot", screenshot)
                
                await self._emit_event(execution_id, "step", {
                    "step": f"Executing task (attempt {attempt}/{max_retries})",
                    "status": "completed",
                    "attempt": attempt
                })
                
                await self._emit_event(execution_id, "execution_completed", {
                    "success": True,
                    "output": str(result) if result else "Task completed",
                    "timestamp": datetime.now().isoformat()
                })
                
                logger.info("Task completed successfully")
                return {
                    "success": True,
                    "output": str(result) if result else "Task completed",
                    "error": None,
                    "attempts": attempt,
                }
                
            except Exception as e:
                last_error = e
                logger.warning(
                    f"Task execution failed on attempt {attempt}/{max_retries}: {str(e)}"
                )
                
                await self._emit_event(execution_id, "step", {
                    "step": f"Executing task (attempt {attempt}/{max_retries})",
                    "status": "failed",
                    "attempt": attempt,
                    "error": str(e)
                })
                
                # Capture screenshot on failure
                pages = context.pages
                if pages:
                    screenshot = await screenshot_service.capture_screenshot(
                        pages[0], execution_id, f"failure_attempt_{attempt}"
                    )
                    if screenshot:
                        await self._emit_event(execution_id, "screenshot", screenshot)
                
                if attempt < max_retries:
                    await self._emit_event(execution_id, "retry", {
                        "attempt": attempt,
                        "max_retries": max_retries,
                        "message": "Retrying in 2 seconds..."
                    })
                    logger.info(f"Retrying in 2 seconds...")
                    await asyncio.sleep(2)
                else:
                    await self._emit_event(execution_id, "execution_completed", {
                        "success": False,
                        "error": f"Task failed after {max_retries} attempts: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
                    logger.error(
                        f"Task failed after {max_retries} attempts. "
                    )
        
        # All retries failed
        return {
            "success": False,
            "output": None,
            "error": f"Task failed after {max_retries} attempts: {str(last_error)}",
            "attempts": max_retries,
            "screenshot": screenshot_path if 'screenshot_path' in locals() else None,
        }

    async def _capture_failure_screenshot(
        self, context: BrowserContext, attempt: int
    ) -> Optional[str]:
        """
        Capture screenshot of the current page state on failure
        
        Args:
            context: Browser context
            attempt: Attempt number
        
        Returns:
            Path to screenshot file or None
        """
        try:
            # Get all pages in the context
            pages = context.pages
            
            if not pages:
                logger.warning("No pages available for screenshot")
                return None
            
            # Take screenshot of the first page (usually the main page)
            page = pages[0]
            
            # Create screenshots directory if it doesn't exist
            screenshots_dir = Path(__file__).parent.parent / "screenshots"
            screenshots_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate screenshot filename with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            screenshot_path = screenshots_dir / f"failure_attempt_{attempt}_{timestamp}.png"
            
            # Take screenshot
            await page.screenshot(path=str(screenshot_path), full_page=True)
            
            logger.info(f"Screenshot saved to {screenshot_path}")
            return str(screenshot_path)
            
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")
            return None

    def _enhance_task_with_2fa(
        self, task_description: str, session_data: Optional[Dict[str, Any]]
    ) -> str:
        """
        Enhance task description with 2FA handling instructions
        
        Args:
            task_description: Original task description
            session_data: Session data that may contain TOTP secret
        
        Returns:
            Enhanced task description
        """
        enhanced = task_description

        # Add 2FA handling instructions if TOTP secret is available
        if session_data and session_data.get("totpSecret"):
            totp_secret = session_data["totpSecret"]
            # Generate current TOTP code
            current_code = self.totp_handler.generate_totp(totp_secret)
            
            enhanced += f"""

IMPORTANT - 2FA HANDLING:
If you encounter a Two-Factor Authentication (2FA) or TOTP screen:
1. Look for input fields labeled "verification code", "2FA code", "TOTP", "authenticator code", etc.
2. Use the following TOTP code: {current_code}
3. If the code expires, generate a new one using the TOTP secret: {totp_secret}
4. Enter the code and proceed with the task.

The TOTP code changes every 30 seconds. If you need a new code, wait a moment and generate another one.
"""

        return enhanced

    async def _emit_event(self, execution_id: str, event_type: str, data: Dict[str, Any]):
        """
        Emit a WebSocket event
        
        Args:
            execution_id: Execution ID
            event_type: Type of event (step, screenshot, error, etc.)
            data: Event data
        """
        try:
            message = {
                "type": event_type,
                "execution_id": execution_id,
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
            await websocket_manager.send_to_execution(execution_id, message)
        except Exception as e:
            logger.error(f"Error emitting WebSocket event: {e}")


# Global executor instance
executor = DigitalExecutor()

