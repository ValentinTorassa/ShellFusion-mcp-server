# ShellFusion MCP Server

A full-stack application with a Node.js/Express backend, React frontend, and Python MCP server for AI assistant integration.

## MCP Server Quick Start

This project includes a **Python-based MCP (Model Context Protocol) server** in the `mcp/` directory that allows AI assistants like Claude Desktop and ChatGPT to interact with the ShellFusion backend.

### Available Tools

- **health_check** - Check backend health status
- **list_items** - List all items from the backend
- **create_item** - Create new items

### Setup & Run

1. **Install dependencies**:

```bash
cd mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. **Run the server** (for testing with Inspector):

```bash
mcp dev server.py
```

3. **Configure for Claude Desktop**:

Add to `~/.config/Claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "shellfusion": {
      "command": "/absolute/path/to/ShellFusion-mcp-server/mcp/.venv/bin/python",
      "args": ["server.py"],
      "env": {
        "BACKEND_BASE_URL": "http://localhost:4000"
      }
    }
  }
}
```

Replace `/absolute/path/to/ShellFusion-mcp-server/mcp/` with your actual path. Then restart Claude Desktop.

**Note**: Make sure your backend is running on port 4000 before using the MCP server.

---

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Python** (3.10 or higher) - for MCP server

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Database

```bash
# Start MongoDB with Docker Compose
cd docker
docker-compose up -d
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend (runs on port 3000 by default)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 5173 by default)
cd frontend
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017 (root/example)

## Build for Production

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
npm run preview
```

## Additional Commands

```bash
# Lint code
npm run lint

# Format code
npm run format
```

