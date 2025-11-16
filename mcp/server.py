#!/usr/bin/env python3
"""
ShellFusion MCP Server

An MCP server that provides tools to interact with the ShellFusion Node.js backend via HTTP.
Exposes tools for health checking, listing items, and creating items.
"""

import asyncio
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# Load environment variables from .env file
load_dotenv()

# Configuration
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:4000")
MCP_SERVER_NAME = os.getenv("MCP_SERVER_NAME", "ShellFusion")

# HTTP client configuration
HTTP_TIMEOUT = 30.0


def _backend_url(path: str) -> str:
    """
    Build a complete URL for the backend API.

    Args:
        path: API path (e.g., "/api/health" or "api/items")

    Returns:
        Complete URL string
    """
    # Ensure path starts with /
    if not path.startswith("/"):
        path = f"/{path}"

    # Remove trailing slash from base URL if present
    base = BACKEND_BASE_URL.rstrip("/")

    return f"{base}{path}"


async def _http_client() -> httpx.AsyncClient:
    """
    Create and return a configured async HTTP client.

    Returns:
        Configured httpx.AsyncClient instance
    """
    return httpx.AsyncClient(timeout=HTTP_TIMEOUT)


# Initialize MCP server
app = Server(MCP_SERVER_NAME)


@app.list_tools()
async def list_tools() -> list[Tool]:
    """
    List all available tools exposed by this MCP server.

    Returns:
        List of Tool definitions
    """
    return [
        Tool(
            name="health_check",
            description="Check the health status of the ShellFusion backend API",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        Tool(
            name="list_items",
            description="Retrieve all items from the ShellFusion backend",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        Tool(
            name="create_item",
            description="Create a new item in the ShellFusion backend",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the item to create",
                    }
                },
                "required": ["name"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """
    Handle tool execution requests.

    Args:
        name: Name of the tool to execute
        arguments: Tool arguments (dict)

    Returns:
        List of TextContent with the tool results
    """
    if name == "health_check":
        return await _tool_health_check()
    elif name == "list_items":
        return await _tool_list_items()
    elif name == "create_item":
        return await _tool_create_item(arguments)
    else:
        return [
            TextContent(
                type="text",
                text=f"Error: Unknown tool '{name}'",
            )
        ]


async def _tool_health_check() -> list[TextContent]:
    """
    Health check tool implementation.

    Calls GET /api/health on the backend and returns the status.

    Returns:
        List containing TextContent with health check result
    """
    url = _backend_url("/api/health")

    try:
        async with await _http_client() as client:
            response = await client.get(url)
            response.raise_for_status()
            backend_data = response.json()

            result = {
                "status": "ok",
                "backend": backend_data,
                "backend_url": url,
            }

            return [
                TextContent(
                    type="text",
                    text=f"Health check successful: {result}",
                )
            ]

    except Exception as e:
        error_result = {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }

        return [
            TextContent(
                type="text",
                text=f"Health check failed: {error_result}",
            )
        ]


async def _tool_list_items() -> list[TextContent]:
    """
    List items tool implementation.

    Calls GET /api/items on the backend and returns the items list.

    Returns:
        List containing TextContent with items data
    """
    url = _backend_url("/api/items")

    try:
        async with await _http_client() as client:
            response = await client.get(url)
            response.raise_for_status()
            items = response.json()

            result = {
                "status": "ok",
                "count": len(items),
                "items": items,
                "backend_url": url,
            }

            return [
                TextContent(
                    type="text",
                    text=f"Retrieved {len(items)} items: {result}",
                )
            ]

    except Exception as e:
        error_result = {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }

        return [
            TextContent(
                type="text",
                text=f"Failed to list items: {error_result}",
            )
        ]


async def _tool_create_item(arguments: dict[str, Any]) -> list[TextContent]:
    """
    Create item tool implementation.

    Calls POST /api/items on the backend with the provided name.

    Args:
        arguments: Dictionary containing 'name' field

    Returns:
        List containing TextContent with creation result
    """
    url = _backend_url("/api/items")
    name = arguments.get("name")

    if not name:
        error_result = {
            "status": "error",
            "detail": "Missing required argument: name",
            "backend_url": url,
        }

        return [
            TextContent(
                type="text",
                text=f"Failed to create item: {error_result}",
            )
        ]

    payload = {"name": name}

    try:
        async with await _http_client() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            item = response.json()

            result = {
                "status": "ok",
                "item": item,
                "backend_url": url,
            }

            return [
                TextContent(
                    type="text",
                    text=f"Item created successfully: {result}",
                )
            ]

    except Exception as e:
        error_result = {
            "status": "error",
            "detail": str(e),
            "payload": payload,
            "backend_url": url,
        }

        return [
            TextContent(
                type="text",
                text=f"Failed to create item: {error_result}",
            )
        ]


async def main():
    """
    Main entrypoint for the MCP server.

    Runs the server using stdio transport for communication with MCP clients.
    """
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
