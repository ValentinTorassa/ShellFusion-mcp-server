# ShellFusion MCP Server

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**

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