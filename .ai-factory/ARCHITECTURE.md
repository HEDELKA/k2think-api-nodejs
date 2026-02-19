# Architecture: Layered Architecture

## Overview

This project uses a **Layered Architecture** pattern with clear separation of concerns. The architecture is optimized for a lightweight API client/proxy library with automatic authentication. Each layer has a single responsibility and depends only on the layer directly below it.

This architecture was chosen because:
- **Simple domain**: API client with straightforward request/response flow
- **Small team**: Single developer or small team
- **High velocity**: Quick iterations and easy testing
- **Clear separation**: Authentication, client logic, and HTTP server are cleanly separated

## Decision Rationale

- **Project type:** API client library + HTTP proxy server
- **Tech stack:** JavaScript (Node.js), Express.js
- **Key factor:** Simple, well-defined domain with clear layers of responsibility

## Folder Structure

```
k2think_api_nodejs/
├── src/                      # Source code (if refactored from current flat structure)
│   ├── layers/
│   │   ├── presentation/     # HTTP server, routes, controllers
│   │   │   ├── routes/
│   │   │   └── controllers/
│   │   ├── service/          # Business logic, API client
│   │   │   ├── client.js     # K2ThinkClient class
│   │   │   └── auth.js       # Authentication service
│   │   └── infrastructure/   # External concerns
│   │       ├── http.js       # HTTP client (axios wrapper)
│   │       └── config.js     # Environment configuration
│   └── index.js              # Main entry point
├── tests/                    # Test files by layer
│   ├── unit/
│   └── integration/
├── examples/                 # Usage examples
├── docs/                     # Documentation
└── .ai-factory/              # AI Factory configuration
```

**Current structure** (flat, but follows layered principles):

```
k2think_api_nodejs/
├── index.js                  # Presentation layer - HTTP server entry
├── server.js                 # Presentation layer - Server config
├── client.js                 # Service layer - Main client logic
├── auth_manager.js           # Service layer - Authentication
├── claude_proxy.js           # Service layer - Alternative client
├── mcp_server.js             # Service layer - MCP implementation
└── test*.js                  # Tests
```

## Dependency Rules

```
Presentation Layer (index.js, server.js)
         ↓
Service Layer (client.js, auth_manager.js)
         ↓
Infrastructure (axios, dotenv, express)
```

- ✅ **Presentation → Service**: Controllers call client methods
- ✅ **Service → Infrastructure**: Client uses axios for HTTP requests
- ❌ **No circular dependencies**: Lower layers don't know about upper layers
- ❌ **No skipping layers**: Routes don't call axios directly

## Layer Communication

### Request Flow (HTTP API Mode)

```
HTTP Request → index.js (route) → client.js (service) → axios (HTTP) → K2Think API
                                                              ↓
Response ← index.js (response) ← client.js (format) ← auth_manager.js (token)
```

### Library Mode

```
User code → client.js (K2ThinkClient) → auth_manager.js → axios → K2Think API
```

## Key Principles

1. **Single Responsibility per Layer**
   - Presentation: HTTP handling, routing, response formatting
   - Service: Business logic, API translation, token management
   - Infrastructure: External dependencies (HTTP client, env vars)

2. **Dependency Inversion at Service Layer**
   - Service layer defines interfaces (auth strategy, HTTP client)
   - Infrastructure implements them
   - Easy to swap implementations (e.g., replace axios with fetch)

3. **Stateless Design**
   - Each request is independent
   - No server-side session storage
   - Tokens managed per-client instance

4. **OpenAI Compatibility**
   - All public APIs match OpenAI SDK format
   - Easy drop-in replacement for OpenAI users

## Code Examples

### Service Layer - Client Class

```javascript
// client.js - Service layer (business logic)
class K2ThinkClient {
  constructor(authManager) {
    this.authManager = authManager; // Dependency injection
  }

  async chat(completions) {
    // Business logic: translate OpenAI format → K2Think format
    const token = await this.authManager.getToken();
    const response = await this.authManager.requestWithAuth({
      method: 'POST',
      url: '/v1/chat/completions',
      data: this.translateRequest(completions)
    });
    return this.formatResponse(response);
  }
}
```

### Presentation Layer - HTTP Route

```javascript
// index.js - Presentation layer (HTTP handling)
app.post('/v1/chat/completions', async (req, res) => {
  try {
    // Call service layer, don't handle HTTP directly
    const response = await client.chat.completions.create(req.body);
    res.json(response); // Format handled by service
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
```

### Dependency Rule - No Skipping

```javascript
// ✅ CORRECT: Route → Client → axios
app.post('/v1/chat', async (req, res) => {
  const result = await client.chat.create(req.body);
  res.json(result);
});

// ❌ WRONG: Route directly calls axios (skips service layer)
app.post('/v1/chat', async (req, res) => {
  const response = await axios.post('/api/chat', req.body); // Don't do this!
  res.json(response.data);
});
```

## Anti-Patterns

- ❌ **Mixing layers**: Don't put authentication logic in routes
- ❌ **Direct HTTP in routes**: Don't call axios from `index.js` - use `client.js`
- ❌ **Hardcoded credentials**: Always use environment variables via `dotenv`
- ❌ **Tight coupling**: Don't import `auth_manager.js` directly in routes - inject via client
- ❌ **Skipping error handling**: Always wrap service calls in try-catch in presentation layer

## Testing Strategy

```
tests/
├── unit/
│   ├── client.test.js      # Test service layer in isolation
│   └── auth.test.js        # Test authentication logic
└── integration/
    └── api.test.js         # Test HTTP endpoints (presentation + service)
```

**Unit tests**: Mock dependencies (axios, env vars)
**Integration tests**: Full HTTP request → response flow
