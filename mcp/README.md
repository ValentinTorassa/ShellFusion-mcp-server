# ShellFusion MCP Server


```bash
cd mcp
python3 -m venv .venv
source .venv/bin/activate  

pip install -r requirements.txt

mcp dev server.py
```

## Configuration for Claude Desktop

Add to `~/.config/Claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "shellfusion": {
      "command": "/Users/valen/Documents/Github/ShellFusion-mcp-server/mcp/.venv/bin/python",
      "args": [
        "/Users/valen/Documents/Github/ShellFusion-mcp-server/mcp/server.py"
      ],
      "env": {
        "BACKEND_BASE_URL": "http://localhost:4000",
        "MCP_SERVER_NAME": "ShellFusion"
      }
    }
  }
}
```
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json