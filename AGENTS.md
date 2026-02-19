# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview

K2Think AI Client & API Proxy — OpenAI-compatible library and HTTP API proxy for K2Think AI platform with automatic authentication and token management.

## Tech Stack

- **Language:** JavaScript (Node.js)
- **Framework:** Express.js 4.18
- **Database:** None (stateless API client)
- **Package Manager:** npm

## Project Structure

```
k2think_api_nodejs/
├── .ai-factory/           # AI Factory configuration
│   ├── DESCRIPTION.md     # Project specification
│   ├── ARCHITECTURE.md    # Architecture guidelines (generate with /aif-architecture)
│   └── json
├── .qwen/                 # Qwen Code configuration & skills
│   └── skills/            # Installed AI skills
├── examples/              # Usage examples for library mode
│   └── simple_chat.js     # Basic chat example
├── node_modules/          # Dependencies (git-ignored)
├── client.js              # Main library - K2ThinkClient class (Library mode)
├── index.js               # HTTP API proxy server entry point
├── server.js              # Server configuration & middleware
├── auth_manager.js        # Authentication & token management
├── claude_proxy.js        # Claude API proxy implementation
├── mcp_server.js          # MCP server implementation
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies & scripts
├── README.md              # Main documentation
├── LIBRARY.md             # Library usage documentation
├── USAGE.md               # HTTP API usage guide
├── QUICKSTART.md          # Quick start guide (Russian)
├── COMPARISON.md          # Comparison with other solutions
├── SUPPORT.md             # Support & donation info
├── FUNDING.yml            # GitHub funding configuration
└── test*.js               # Test files (simple, basic, final)
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `client.js` | Main library class `K2ThinkClient` — use for direct integration |
| `index.js` | HTTP API proxy server — start with `npm start` |
| `server.js` | Express server configuration and middleware setup |
| `auth_manager.js` | Authentication logic, token storage, and refresh |
| `package.json` | Dependencies, scripts, project metadata |
| `.env.example` | Required environment variables template |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | README.md | Project landing page with quick start |
| Library Docs | LIBRARY.md | Complete library API documentation |
| API Usage | USAGE.md | HTTP API endpoints and examples |
| Quick Start | QUICKSTART.md | Quick start guide (Russian) |
| Comparison | COMPARISON.md | Comparison with alternatives |

## AI Context Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — project structure map |
| `.ai-factory/DESCRIPTION.md` | Project specification and tech stack |
| `.ai-factory/ARCHITECTURE.md` | Architecture decisions and guidelines (run `/aif-architecture` to generate) |
| `.qwen/QWEN.md` | Global development rules and MCP usage |
| `.ai-factory.json` | AI Factory configuration (installed skills, MCP) |

## Development Commands

```bash
npm start        # Start HTTP API proxy server
npm run dev      # Start with auto-restart (nodemon)
npm test         # Run test suite
npm run example  # Run library example
```

## Environment Variables

Required in `.env` (copy from `.env.example`):

```env
K2THINK_EMAIL=your-email@example.com
K2THINK_PASSWORD=your-password
PORT=3000
LOG_LEVEL=info
```
