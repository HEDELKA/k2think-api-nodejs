# Project: K2Think AI Client & API Proxy

## Overview

OpenAI-compatible client library and HTTP API proxy for K2Think AI platform. Provides zero-configuration access to K2Think's AI models with automatic authentication, token management, and context preservation. Can be used as a Node.js library or as a standalone HTTP API proxy server.

## Core Features

- **Dual usage modes**: Node.js library (like OpenAI SDK) or HTTP API proxy server
- **Zero-configuration**: Set credentials once in `.env`, authentication handled automatically
- **OpenAI-compatible API**: Same API structure as OpenAI SDK
- **Automatic token management**: Token refresh and session handling
- **Context preservation**: Multi-turn conversations supported
- **RESTful HTTP endpoints**: `/v1/chat/completions`, `/v1/models`

## Tech Stack

- **Language:** JavaScript (Node.js)
- **Framework:** Express.js 4.18
- **Runtime:** Node.js
- **Database:** None (stateless API client)
- **Package Manager:** npm

## Dependencies

### Production
- `express` ^4.18.2 — HTTP server framework
- `axios` ^1.6.0 — HTTP client for API requests
- `cors` ^2.8.5 — CORS middleware
- `dotenv` ^16.3.1 — Environment variables management
- `helmet` ^7.0.0 — Security headers middleware

### Development
- `nodemon` ^3.0.1 — Development auto-restart
- `jest` ^29.7.0 — Testing framework
- `supertest` ^6.3.3 — HTTP testing utilities

## Architecture

### Project Structure

```
k2think_api_nodejs/
├── client.js          # Main library - K2ThinkClient class
├── index.js           # HTTP API proxy server entry point
├── server.js          # Server configuration
├── auth_manager.js    # Authentication & token management
├── claude_proxy.js    # Claude API proxy (optional)
├── mcp_server.js      # MCP server implementation
├── .env.example       # Environment variables template
├── examples/          # Usage examples
└── tests/*.js         # Test files
```

### Key Components

1. **client.js** — Main library exposing `K2ThinkClient` class with OpenAI-compatible API
2. **auth_manager.js** — Handles authentication, token storage, and automatic refresh
3. **index.js** — Express server providing HTTP API endpoints
4. **server.js** — Server configuration and middleware setup

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/v1/chat/completions` | Chat completions (OpenAI compatible) |
| GET | `/v1/models` | List available models |

## Configuration

Environment variables (`.env`):

```env
K2THINK_EMAIL=your-email@example.com
K2THINK_PASSWORD=your-password
PORT=3000
LOG_LEVEL=info
```

## Non-Functional Requirements

- **Logging**: Configurable via `LOG_LEVEL` environment variable
- **Error handling**: Structured error responses in OpenAI format
- **Security**: Helmet security headers, CORS configuration
- **Performance**: Stateless design, connection reuse via axios

## Integration Points

- **K2Think API**: External AI platform (authentication required)
- **OpenAI SDK**: Compatible API format for drop-in replacement

## MCP Servers Recommended

Based on project analysis:

- **GitHub** — Repository is on GitHub (`.git` detected)
- **Filesystem** — For file operations during development

## Skills Recommended

Based on detected patterns:

- **api-patterns** — Express.js API development patterns
- **nodejs-best-practices** — Node.js specific conventions
- **security-checklist** — API security best practices
