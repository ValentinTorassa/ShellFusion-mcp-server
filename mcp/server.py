#!/usr/bin/env python3
"""
ShellFusion MCP Server

MCP server that exposes tools to interact with the ShellFusion backend
(via HTTP) using FastMCP.

This server forwards the backend API key to authenticate requests,
but does not require authentication from the LLM client itself.
"""

import os
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# Load environment variables from .env file
load_dotenv()

# Configuration
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:4000")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY")
MCP_SERVER_NAME = os.getenv("MCP_SERVER_NAME", "ShellFusion")

HTTP_TIMEOUT = 30.0

# Warn if API key is missing
if not BACKEND_API_KEY:
    print("⚠️  WARNING: BACKEND_API_KEY is not set in environment!")
    print("⚠️  All backend API requests will fail without the API key.")
    print("⚠️  Please set BACKEND_API_KEY in your .env file.")


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
    Create and return a configured async HTTP client with API key authentication.

    All requests to the backend will include the x-api-key header if BACKEND_API_KEY is set.
    """
    headers = {}
    if BACKEND_API_KEY:
        headers["x-api-key"] = BACKEND_API_KEY

    return httpx.AsyncClient(
        timeout=HTTP_TIMEOUT,
        follow_redirects=True,
        headers=headers
    )


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
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    created_by: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Retrieve all tickets from the ShellFusion backend with optional filters.

    Args:
        status: Filter by status (open, in_progress, resolved, closed)
        priority: Filter by priority (low, medium, high, urgent)
        assigned_to: Filter by assigned user ID
        created_by: Filter by creator user ID
        page: Page number for pagination (default: 1)
        limit: Number of tickets per page (default: 10)

    Returns:
        Dict with status, tickets list, pagination info and backend_url.
    """
    url = _backend_url("/api/tickets")

    # Build query parameters
    params = {"page": page, "limit": limit}
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority
    if assigned_to:
        params["assignedTo"] = assigned_to
    if created_by:
        params["createdBy"] = created_by

    try:
        async with await _http_client() as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        return {
            "status": "ok",
            "tickets": data.get("data", []),
            "pagination": data.get("pagination", {}),
            "count": len(data.get("data", [])),
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }


@mcp.tool()
async def get_ticket(ticket_id: str) -> Dict[str, Any]:
    """
    Retrieve a single ticket by its ID.

    Args:
        ticket_id: The MongoDB ObjectId of the ticket

    Returns:
        Dict with status, ticket data and backend_url.
    """
    url = _backend_url(f"/api/tickets/{ticket_id}")

    try:
        async with await _http_client() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        return {
            "status": "ok",
            "ticket": data.get("data"),
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }


@mcp.tool()
async def create_ticket(
    title: str,
    description: str,
    created_by: str,
    status: str = "open",
    priority: str = "medium",
    assigned_to: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Create a new ticket in the ShellFusion backend.

    Args:
        title: The title of the ticket (required)
        description: The description of the ticket (required)
        created_by: The MongoDB ObjectId of the user creating the ticket (required)
        status: Ticket status (open, in_progress, resolved, closed) - default: "open"
        priority: Ticket priority (low, medium, high, urgent) - default: "medium"
        assigned_to: Optional MongoDB ObjectId of the user to assign the ticket to
        tags: Optional list of tags for categorization

    Returns:
        Dict with status, created ticket and backend_url.
    """
    url = _backend_url("/api/tickets")

    # Build payload with only provided fields
    payload: Dict[str, Any] = {
        "title": title,
        "description": description,
        "createdBy": created_by,
        "status": status,
        "priority": priority,
    }

    if assigned_to:
        payload["assignedTo"] = assigned_to
    if tags:
        payload["tags"] = tags

    try:
        async with await _http_client() as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return {
            "status": "ok",
            "ticket": data.get("data"),
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "payload": payload,
            "backend_url": url,
        }


@mcp.tool()
async def update_ticket(
    ticket_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Update an existing ticket by its ID.

    Args:
        ticket_id: The MongoDB ObjectId of the ticket to update (required)
        title: Optional new title
        description: Optional new description
        status: Optional new status (open, in_progress, resolved, closed)
        priority: Optional new priority (low, medium, high, urgent)
        assigned_to: Optional new assignee user ID (use empty string to unassign)
        tags: Optional new list of tags

    Returns:
        Dict with status, updated ticket and backend_url.
    """
    url = _backend_url(f"/api/tickets/{ticket_id}")

    # Build payload with only provided fields
    payload: Dict[str, Any] = {}

    if title is not None:
        payload["title"] = title
    if description is not None:
        payload["description"] = description
    if status is not None:
        payload["status"] = status
    if priority is not None:
        payload["priority"] = priority
    if assigned_to is not None:
        payload["assignedTo"] = assigned_to
    if tags is not None:
        payload["tags"] = tags

    if not payload:
        return {
            "status": "error",
            "detail": "At least one field must be provided for update",
            "backend_url": url,
        }

    try:
        async with await _http_client() as client:
            resp = await client.patch(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return {
            "status": "ok",
            "ticket": data.get("data"),
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "payload": payload,
            "backend_url": url,
        }


@mcp.tool()
async def delete_ticket(ticket_id: str) -> Dict[str, Any]:
    """
    Delete a ticket by its ID.

    Args:
        ticket_id: The MongoDB ObjectId of the ticket to delete

    Returns:
        Dict with status, deleted ticket info and backend_url.
    """
    url = _backend_url(f"/api/tickets/{ticket_id}")

    try:
        async with await _http_client() as client:
            resp = await client.delete(url)
            resp.raise_for_status()
            data = resp.json()

        return {
            "status": "ok",
            "deleted_ticket": data.get("data"),
            "message": data.get("message", "Ticket deleted successfully"),
            "backend_url": url,
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "backend_url": url,
        }


if __name__ == "__main__":
    mcp.run(transport="stdio")
