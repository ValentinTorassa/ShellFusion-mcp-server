#!/usr/bin/env python3
"""
ShellFusion MCP Server

MCP server que expone herramientas para interactuar con el backend de ShellFusion
(vía HTTP) usando FastMCP.
"""

import asyncio
import os
from typing import Any, Dict, List

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from mcp.server.stdio import stdio_server

# Load environment variables from .env file
load_dotenv()

# Configuration
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:4000")
MCP_SERVER_NAME = os.getenv("MCP_SERVER_NAME", "ShellFusion")

HTTP_TIMEOUT = 30.0


def _backend_url(path: str) -> str:
    """
    Build a complete URL for the backend API.
    """
    if not path.startswith("/"):
        path = f"/{path}"
    base = BACKEND_BASE_URL.rstrip("/")
    return f"{base}{path}"


async def _http_client() -> httpx.AsyncClient:
    """
    Create and return a configured async HTTP client.
    """
    return httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True)


# FastMCP server instance (this is what `mcp dev` expects)
mcp = FastMCP(MCP_SERVER_NAME)


@mcp.tool()
async def health_check() -> Dict[str, Any]:
    """
    Check the health status of the ShellFusion backend API.

    Returns:
        Dict with status, backend response (if ok) and backend_url.
    """
    url = _backend_url("/api/health")

    try:
        async with await _http_client() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            backend_data = resp.json()

        return {
            "status": "ok",
            "backend": backend_data,
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }


@mcp.tool()
async def list_items() -> Dict[str, Any]:
    """
    Retrieve all items from the ShellFusion backend.

    Returns:
        Dict with status, count, items and backend_url.
    """
    url = _backend_url("/api/items")

    try:
        async with await _http_client() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            items: List[Dict[str, Any]] = resp.json()

        return {
            "status": "ok",
            "count": len(items),
            "items": items,
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }


@mcp.tool()
async def create_item(name: str) -> Dict[str, Any]:
    """
    Create a new item in the ShellFusion backend.

    Args:
        name: The name of the item to create.

    Returns:
        Dict with status, created item (if ok) and backend_url.
    """
    url = _backend_url("/api/items")

    if not name:
        return {
            "status": "error",
            "detail": "Missing required argument: name",
            "backend_url": url,
        }

    payload = {"name": name}

    try:
        async with await _http_client() as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            item = resp.json()

        return {
            "status": "ok",
            "item": item,
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "payload": payload,
            "backend_url": url,
        }


async def main() -> None:
    """
    Main entrypoint for the MCP server (stdio transport).
    """
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream)


if __name__ == "__main__":
    asyncio.run(main())
