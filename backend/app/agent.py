"""
Browser-use AI agent integration
"""

import os
from typing import Dict, Any, Optional
from browser_use import Browser, Agent
from playwright.async_api import async_playwright


class BrowserAgent:
    """Wrapper for browser-use AI agent"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.agent: Optional[Agent] = None
        self._initialized = False

    async def _initialize(self):
        """Initialize browser and agent"""
        if self._initialized:
            return

        try:
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=True)
            context = await browser.new_context()

            self.browser = Browser(
                start_url="about:blank",
                browser_context=context,
            )

            # Initialize agent with LLM
            # Note: You'll need to configure your LLM API key
            llm_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
            if not llm_api_key:
                print("Warning: No LLM API key found. Agent may not work properly.")

            self.agent = Agent(
                task="",
                browser=self.browser,
                llm=llm_api_key,  # Configure based on your LLM provider
            )

            self._initialized = True
        except Exception as e:
            print(f"Warning: Browser agent initialization failed: {e}")
            self._initialized = False

    async def verify_activity(
        self, api_source: str, verification_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify user activity via external API using browser-use agent

        Args:
            api_source: URL or API endpoint to check
            verification_params: Parameters for verification (e.g., API keys, tokens)

        Returns:
            Dictionary with verification result
        """
        await self._initialize()

        if not self._initialized:
            return {
                "verified": False,
                "timestamp": "",
                "details": {"error": "Agent not initialized"},
            }

        try:
            # Create a task for the agent to verify activity
            task = f"""
            Navigate to {api_source} and verify user activity.
            Check for recent activity indicators such as:
            - Recent posts, messages, or updates
            - Last login timestamp
            - Activity status
            Use the provided parameters: {verification_params}
            Return True if activity is recent (within the expected timeframe), False otherwise.
            """

            result = await self.agent.run(task)

            # Parse the result
            verified = "true" in str(result).lower() or "active" in str(result).lower()

            from datetime import datetime

            return {
                "verified": verified,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {
                    "api_source": api_source,
                    "agent_output": str(result),
                },
            }
        except Exception as e:
            return {
                "verified": False,
                "timestamp": "",
                "details": {"error": str(e)},
            }

    async def execute_task(
        self, task_description: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a general task using the browser-use agent

        Args:
            task_description: Description of the task to execute
            context: Additional context for the task

        Returns:
            Dictionary with task execution result
        """
        await self._initialize()

        if not self._initialized:
            return {
                "success": False,
                "output": "Agent not initialized",
                "screenshots": [],
            }

        try:
            # Enhance task description with context
            enhanced_task = f"{task_description}\n\nContext: {context}"

            result = await self.agent.run(enhanced_task)

            return {
                "success": True,
                "output": str(result),
                "screenshots": [],  # Could capture screenshots if needed
            }
        except Exception as e:
            return {
                "success": False,
                "output": f"Task execution failed: {e}",
                "screenshots": [],
            }

    def is_ready(self) -> bool:
        """Check if the agent is ready"""
        return self._initialized

