# ShellFusion VPS Deployment Guide

This guide covers deploying ShellFusion to your DonWeb/DattaWeb VPS with a simple Continuous Deployment pipeline.

## Overview

This deployment setup includes:

- **GitHub Actions CD pipeline** - Automatically deploys on push to `main`
- **Backend** - Node.js REST API (port 4000)
- **Frontend** - React SPA served via Nginx
- **MCP Server** - Python MCP server with HTTP health endpoint (port 8765)
- **Nginx** - Reverse proxy with HTTPS via Let's Encrypt

## Prerequisites

- VPS with Debian 12
- SSH access with password authentication
- GitHub repository with Actions enabled

## Architecture

```
Internet (HTTPS) → Nginx (443) ┬→ Frontend (/var/www/shellfusion-frontend)
                                ├→ Backend API (/api/* → 127.0.0.1:4000)
                                └→ MCP Health (/mcp/* → 127.0.0.1:8765)
```

## Initial Setup

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
SSH_HOST = vps-5487694-x.dattaweb.com
SSH_PORT = 5529
SSH_USER = root
SSH_PASSWORD = your-vps-root-password
```

### 2. Run Initial Server Setup

SSH into your VPS and run:

```bash
# Clone the repository manually for first time
mkdir -p /opt/shellfusion
cd /opt/shellfusion
git clone https://github.com/ValentinTorassa/ShellFusion-mcp-server.git app
cd app

# Run the initial setup script (installs Node.js, Python, Nginx, etc.)
chmod +x scripts/initial-setup.sh
./scripts/initial-setup.sh
```

This script will:
- Install Node.js 20.x
- Install Python 3 and pip
- Install Nginx
- Install Certbot for SSL
- Copy systemd service files
- Configure Nginx

### 3. Create Environment Files

#### Backend Environment

Create `/opt/shellfusion/app/backend/.env`:

```bash
PORT=4000
NODE_ENV=production
FRONTEND_ORIGIN=https://vps-5487694-x.dattaweb.com
MONGODB_URI=mongodb://localhost:27017/shellfusion_production
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
API_KEY=your-secure-api-key-for-mcp-server
```

#### MCP Environment

Create `/opt/shellfusion/app/mcp/.env`:

```bash
BACKEND_BASE_URL=http://localhost:4000
BACKEND_API_KEY=your-secure-api-key-for-mcp-server
MCP_SERVER_NAME=ShellFusion
MCP_HTTP_PORT=8765
```

**Important**: The `API_KEY` in backend and `BACKEND_API_KEY` in MCP must match!

### 4. Install MongoDB

```bash
# Install MongoDB
apt-get install -y mongodb

# Start MongoDB
systemctl enable mongodb
systemctl start mongodb
```

### 5. Setup Nginx and SSL

```bash
# Copy Nginx config
cp /opt/shellfusion/app/deployment/nginx/shellfusion.conf /etc/nginx/sites-available/shellfusion
ln -s /etc/nginx/sites-available/shellfusion /etc/nginx/sites-enabled/shellfusion

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Get SSL certificate from Let's Encrypt
certbot --nginx -d vps-5487694-x.dattaweb.com

# Certbot will automatically configure SSL and update the Nginx config
```

### 6. Deploy Services

```bash
# Copy systemd service files
cp /opt/shellfusion/app/deployment/systemd/*.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable services to start on boot
systemctl enable shellfusion-backend
systemctl enable shellfusion-mcp

# Trigger a deployment via GitHub Actions or manually:
cd /opt/shellfusion/app
git pull origin main

# Install backend deps and build
cd backend
npm install
npm run build

# Install frontend deps and build
cd ../frontend
npm install
npm run build

# Copy frontend to web root
cp -r dist/* /var/www/shellfusion-frontend/

# Setup MCP Python environment
cd ../mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Set correct permissions
chown -R www-data:www-data /opt/shellfusion/app
chown -R www-data:www-data /var/www/shellfusion-frontend

# Start services
systemctl start shellfusion-backend
systemctl start shellfusion-mcp
```

## Verify Deployment

Check service status:

```bash
systemctl status shellfusion-backend
systemctl status shellfusion-mcp
```

Check logs:

```bash
journalctl -u shellfusion-backend -f
journalctl -u shellfusion-mcp -f
```

Test endpoints:

```bash
# Backend health
curl http://localhost:4000/api/health

# MCP health
curl http://localhost:8765/health

# Via Nginx (HTTPS)
curl https://vps-5487694-x.dattaweb.com/api/health
curl https://vps-5487694-x.dattaweb.com/mcp/health
```

## Continuous Deployment

Once setup is complete, every push to the `main` branch will automatically:

1. Connect to your VPS via SSH
2. Pull the latest code
3. Install dependencies
4. Build backend and frontend
5. Update MCP Python environment
6. Restart services

Monitor deployments in GitHub Actions tab.

## Troubleshooting

### Services won't start

Check the logs:
```bash
journalctl -u shellfusion-backend -n 50
journalctl -u shellfusion-mcp -n 50
```

Common issues:
- Missing or incorrect `.env` files
- MongoDB not running
- Port already in use
- Permission issues

### Nginx errors

```bash
# Check Nginx config
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/shellfusion-error.log
```

### SSL certificate renewal

Certbot should auto-renew. To manually renew:

```bash
certbot renew
systemctl reload nginx
```

## Useful Commands

```bash
# Restart services
systemctl restart shellfusion-backend
systemctl restart shellfusion-mcp

# Stop services
systemctl stop shellfusion-backend
systemctl stop shellfusion-mcp

# View service status
systemctl status shellfusion-backend
systemctl status shellfusion-mcp

# View logs (live)
journalctl -u shellfusion-backend -f
journalctl -u shellfusion-mcp -f

# Reload Nginx
systemctl reload nginx

# Manual deployment
cd /opt/shellfusion/app && git pull && systemctl restart shellfusion-backend shellfusion-mcp
```

## Security Notes

1. Always use strong passwords for SSH and database
2. The API_KEY for MCP should be a strong random string
3. Keep JWT_SECRET secure and random
4. MongoDB should only listen on localhost
5. Consider setting up a firewall (ufw) to only allow ports 80, 443, and your SSH port

## MCP Server Modes

The MCP server supports two modes:

1. **stdio mode** (default) - For Claude Desktop integration
   ```bash
   python server.py
   ```

2. **HTTP mode** - For production deployment with health endpoint
   ```bash
   python server.py --http
   ```

The systemd service automatically uses HTTP mode.
