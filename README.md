# ShellFusion MCP Server

A full-stack application with a Node.js/Express backend, React frontend, and Python MCP server for AI assistant integration.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Python** (3.10 or higher) - for MCP server
- **uv** - Python package manager (optional but recommended for MCP server)

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

## MCP Server for AI Integration

This project includes a Python-based MCP (Model Context Protocol) server that allows AI assistants like Claude and ChatGPT to interact with the ShellFusion backend.

### Features

The MCP server exposes tools to:
- Check backend health status
- List all items from the backend
- Create new items

### Quick Start

1. **Install MCP dependencies**:

```bash
cd mcp
uv sync  # or: pip install -e .
```

2. **Configure environment** (optional):

```bash
cd mcp
cp .env.example .env
# Edit .env if your backend runs on a different URL
```

3. **Run the MCP server**:

```bash
cd mcp
uv run mcp dev server.py
```

### Integration with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "shellfusion": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/ShellFusion-mcp-server/mcp",
        "run",
        "mcp",
        "run",
        "server.py"
      ],
      "env": {
        "BACKEND_BASE_URL": "http://localhost:4000"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/ShellFusion-mcp-server/mcp` with your actual path.

For detailed MCP server documentation, see [mcp/README.md](mcp/README.md).