from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json


class KitchenConnectionManager:
    """Manages WebSocket connections for real-time kitchen updates."""

    def __init__(self):
        # Separate pools for kitchen staff and customers
        self.kitchen_connections: Set[WebSocket] = set()
        self.customer_connections: Dict[int, Set[WebSocket]] = {}  # table_number -> connections

    async def connect_kitchen(self, websocket: WebSocket):
        """Connect a kitchen staff client."""
        await websocket.accept()
        self.kitchen_connections.add(websocket)
        print(f"🔌 Kitchen client connected. Total: {len(self.kitchen_connections)}")

    async def connect_customer(self, websocket: WebSocket, table_number: int):
        """Connect a customer client for a specific table."""
        await websocket.accept()
        if table_number not in self.customer_connections:
            self.customer_connections[table_number] = set()
        self.customer_connections[table_number].add(websocket)
        print(f"🔌 Customer connected for table {table_number}")

    def disconnect_kitchen(self, websocket: WebSocket):
        """Disconnect a kitchen staff client."""
        self.kitchen_connections.discard(websocket)
        print(f"🔌 Kitchen client disconnected. Total: {len(self.kitchen_connections)}")

    def disconnect_customer(self, websocket: WebSocket, table_number: int):
        """Disconnect a customer client."""
        if table_number in self.customer_connections:
            self.customer_connections[table_number].discard(websocket)
            if not self.customer_connections[table_number]:
                del self.customer_connections[table_number]

    async def broadcast_to_kitchen(self, message: dict):
        """Send update to all kitchen connections."""
        dead = set()
        for connection in self.kitchen_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.add(connection)
        self.kitchen_connections -= dead

    async def broadcast_to_table(self, table_number: int, message: dict):
        """Send update to all connections for a specific table."""
        if table_number not in self.customer_connections:
            return
        dead = set()
        for connection in self.customer_connections[table_number]:
            try:
                await connection.send_json(message)
            except Exception:
                dead.add(connection)
        self.customer_connections[table_number] -= dead

    async def broadcast_order_update(self, order: dict):
        """Broadcast order status update to both kitchen and customer."""
        message = {
            "type": "order_update",
            "data": order,
        }
        await self.broadcast_to_kitchen(message)
        if "table_number" in order:
            await self.broadcast_to_table(order["table_number"], message)

    async def broadcast_new_order(self, order: dict):
        """Broadcast new order to kitchen."""
        message = {
            "type": "new_order",
            "data": order,
        }
        await self.broadcast_to_kitchen(message)


# Singleton manager instance
manager = KitchenConnectionManager()
