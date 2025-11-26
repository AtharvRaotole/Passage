"""
WebSocket Manager for real-time execution updates
"""
import json
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.execution_connections: Dict[str, Set[WebSocket]] = {}  # execution_id -> connections

    async def connect(self, websocket: WebSocket, execution_id: Optional[str] = None):
        """Accept a WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        if execution_id:
            if execution_id not in self.execution_connections:
                self.execution_connections[execution_id] = set()
            self.execution_connections[execution_id].add(websocket)
        
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, execution_id: Optional[str] = None):
        """Remove a WebSocket connection"""
        self.active_connections.discard(websocket)
        
        if execution_id and execution_id in self.execution_connections:
            self.execution_connections[execution_id].discard(websocket)
            if not self.execution_connections[execution_id]:
                del self.execution_connections[execution_id]
        
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

    async def send_to_execution(self, execution_id: str, message: dict):
        """Send a message to all connections watching a specific execution"""
        if execution_id not in self.execution_connections:
            return
        
        disconnected = set()
        for connection in self.execution_connections[execution_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to execution connection: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn, execution_id)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()

