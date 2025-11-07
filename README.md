# K2Think AI Client & API Proxy

OpenAI-compatible client library and API proxy for K2Think AI platform. Use it as a library (like OpenAI SDK) or as HTTP API proxy - no manual authentication needed!

## Two Ways to Use

### 1️⃣ As a Library (No Server Needed!)

```javascript
const K2ThinkClient = require('k2think-api-nodejs');
const client = new K2ThinkClient();

const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### 2️⃣ As HTTP API Proxy

```bash
npm start
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"MBZUAI-IFM/K2-Think","messages":[{"role":"user","content":"Hello"}]}'
```

## Features

- **Zero-configuration**: Set credentials once in `.env`
- **OpenAI-compatible**: Same API as OpenAI
- **Automatic authentication**: Token management handled automatically
- **Context preservation**: Multi-turn conversations work perfectly
- **Two usage modes**: Library or HTTP API

## Installation

```bash
npm install
```

## Quick Start - Library Mode

### 1. Configure credentials

```env
# .env file
K2THINK_EMAIL=your-email@example.com
K2THINK_PASSWORD=your-password
```

### 2. Use in your code

```javascript
require('dotenv').config();
const K2ThinkClient = require('./client');

const client = new K2ThinkClient();

// Simple question
async function ask(question) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [{ role: 'user', content: question }]
  });
  return response.choices[0].message.content;
}

const answer = await ask('What is 2+2?');
console.log(answer);
```

That's it! No server needed.

## Quick Start - API Proxy Mode

### 1. Configure credentials (same `.env`)

### 2. Start server

```bash
npm start
```

### 3. Use HTTP API

#### Simple Chat

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [
      {"role": "user", "content": "Hello! What is 2+2?"}
    ]
  }'
```

#### Chat with Context

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [
      {"role": "user", "content": "My name is Alice"},
      {"role": "assistant", "content": "Nice to meet you, Alice!"},
      {"role": "user", "content": "What is my name?"}
    ]
  }'
```

#### List Available Models

```bash
curl http://localhost:3000/v1/models
```

## API Endpoints

- `GET  /` - Health check
- `POST /v1/chat/completions` - Chat completions (OpenAI compatible)
- `GET  /v1/models` - List available models (OpenAI compatible)

## Which Mode to Use?

### Library Mode (`client.js`)
**Best for:**
- Node.js applications and scripts
- Direct integration in your code
- When you don't need HTTP API

**Example:**
```javascript
const client = new K2ThinkClient();
await client.chat.completions.create({...});
```

### API Proxy Mode (`index.js`)
**Best for:**
- Web applications (frontend)
- Multiple services/languages accessing the API
- When you need REST API

**Example:**
```bash
curl http://localhost:3000/v1/chat/completions ...
```

## How It Works

1. **Automatic Authentication**: Logs in to K2Think API using credentials from `.env`
2. **Token Management**: Automatically refreshes expired tokens
3. **Request Translation**: Converts OpenAI-format requests to K2Think format
4. **Response Formatting**: Returns responses in OpenAI-compatible format

## Response Format

Standard OpenAI-compatible format:

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1762533698,
  "model": "MBZUAI-IFM/K2-Think",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Response here"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 431,
    "completion_tokens": 69,
    "total_tokens": 500
  }
}
```

## Testing

Run the test suite:

```bash
node simple_test.js
```

## Troubleshooting

- **Authentication errors**: Check credentials in `.env`
- **Port already in use**: Change `PORT` in `.env` or stop other service on port 3000
- **No response**: Check K2Think service availability and internet connection

## Files

- `client.js` - **Library mode** - K2ThinkClient class for direct use
- `index.js` - **API proxy mode** - HTTP server with endpoints
- `auth_manager.js` - Authentication and token management
- `examples/` - Usage examples for library mode
- `test_library.js` - Test for library mode
- `simple_test.js` - Test for API proxy mode
- `.env` - Configuration (create from `.env.example`)

## Documentation

- **[LIBRARY.md](LIBRARY.md)** - Complete library documentation with examples
- **[USAGE.md](USAGE.md)** - HTTP API usage guide
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide (Russian)

## Support

If you find this project useful, consider supporting its development:

**USDT (TON Network)**
```
UQABR7EgocAi1K4VH3Fg4FHyhmNLC9FPoYuED3YkBJZAFelt
```

**USDT (TRC20)**
```
TKSvGezbzvEz9XpKANUUZE89ej436eiqmd
```

See [SUPPORT.md](SUPPORT.md) for more ways to help.

## License

MIT