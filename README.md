# K2Think AI Client & API Proxy

OpenAI-compatible client library and API proxy for K2Think AI platform. Use it as a library (like OpenAI SDK) or as HTTP API proxy - no manual authentication needed!

## Two Ways to Use

### 1️⃣ As a Library (No Server Needed!)

```javascript
const K2ThinkClient = require('k2think-api-nodejs');
const client = new K2ThinkClient();

const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',  // Use v2 model
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### 2️⃣ As HTTP API Proxy

```bash
npm start
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"MBZUAI-IFM/K2-Think-v2","messages":[{"role":"user","content":"Hello"}]}'
```

### 3️⃣ Multi-Account Mode (NEW!)

Automatic account rotation to avoid rate limits:

```javascript
const K2ThinkMultiClient = require('./client_multi');
const client = new K2ThinkMultiClient();

// Add accounts via CLI: node accounts-cli.js add

// Rotation happens automatically!
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(`Used account: ${response._accountId}`);
```

See [docs/MULTI_ACCOUNT.md](docs/MULTI_ACCOUNT.md) for full guide.

## Features

- **Zero-configuration**: Set credentials once in `.env`
- **OpenAI-compatible**: Same API as OpenAI
- **Automatic authentication**: Token management handled automatically
- **Context preservation**: Multi-turn conversations work perfectly
- **Two usage modes**: Library or HTTP API
- **Multi-account support**: Automatic rotation to avoid rate limits (NEW!)

## Installation

```bash
npm install
```

## Prerequisites

### Get K2Think Account

Before using this library, you need a K2Think account:

1. **Sign up**: https://www.k2think.ai/auth?mode=signup
2. **Login**: https://www.k2think.ai/auth
3. Save your email and password for configuration

### Configure Credentials

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your K2Think credentials:

```env
K2THINK_EMAIL=your-email@example.com
K2THINK_PASSWORD=your-password
PORT=3000
```

### 2. Use in your code

```javascript
require('dotenv').config();
const K2ThinkClient = require('./client');

const client = new K2ThinkClient();

// Simple question
async function ask(question) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think-v2',  // Updated model name
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
    "model": "MBZUAI-IFM/K2-Think-v2",
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
    "model": "MBZUAI-IFM/K2-Think-v2",
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
# Test library mode
node test_library.js

# Test library with integration tests
node tests/library_integration.test.js

# Test API proxy mode (start server first)
npm start &
node tests/api_integration.test.js
```

See [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) for detailed test results.

## Troubleshooting

- **Authentication errors**: Check credentials in `.env`
- **Model not found**: Use `MBZUAI-IFM/K2-Think-v2` (not `MBZUAI-IFM/K2-Think`)
- **Port already in use**: Change `PORT` in `.env` or stop other service on port 3000
- **No response**: Check K2Think service availability and internet connection
- **Proxy errors**: The library bypasses system proxy automatically

## Available Models

- **MBZUAI-IFM/K2-Think-v2** - Latest K2 Think model with enhanced reasoning

## Files

- `client.js` - **Library mode** - K2ThinkClient class for direct use
- `client_multi.js` - **Multi-account mode** - Automatic account rotation
- `index.js` - **API proxy mode** - HTTP server with endpoints
- `auth_manager.js` - Authentication and token management
- `accounts-cli.js` - CLI utility for managing multiple accounts
- `quick-add.js` - Quick account addition script (recommended)
- `lib/account_manager.js` - Account storage and management
- `lib/account_rotator.js` - Account rotation logic
- `examples/` - Usage examples for library and multi-account modes
- `tests/` - Integration tests for library and API modes
- `test_library.js` - Test for library mode
- `data/accounts.json` - Multi-account storage (encrypted)
- `docs/TEST_RESULTS.md` - Detailed test results and troubleshooting
- `docs/MULTI_ACCOUNT.md` - Multi-account system guide
- `.env` - Configuration (create from `.env.example`)

## Documentation

- **[LIBRARY.md](LIBRARY.md)** - Complete library documentation with examples
- **[USAGE.md](USAGE.md)** - HTTP API usage guide
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide (Russian)
- **[MULTI_ACCOUNT.md](docs/MULTI_ACCOUNT.md)** - Multi-account system guide
- **[ACCOUNT_SCHEMA.md](docs/ACCOUNT_SCHEMA.md)** - JSON storage schema

## Quick Commands

```bash
# Add new account (recommended)
node quick-add.js email@example.com password123 "Account Name"

# List all accounts
node accounts-cli.js list

# View statistics
node accounts-cli.js stats

# Test multi-account system
node tests/test_multi_account.js

# Run example
node examples/multi_account_example.js
```

## Support

If you find this project useful, consider supporting its development:

**🪙 USDT (BNB Smart Chain)**
```
0x30C93CEB10c53db8B01ae311db83C2287C431ECd
```

**🪙 USDT (TON Network)**
```
UQDUm3wVVrkcdHgqAZnEIXRbtPwt9KV52M20C6vsMiheKmKV
```

**🪙 USDT (Tron / TRC20)**
```
TJLpsWFGkr26hbpRdHxHwMMzNjUECWKSQc
```

**🪙 USDT (Ethereum)**
```
0x80dCc2DA8ad2A8283F63AAaD94dD490373a48885
```

**🪙 TON (TON Network)**
```
UQDUm3wVVrkcdHgqAZnEIXRbtPwt9KV52M20C6vsMiheKmKV
```

See [SUPPORT.md](SUPPORT.md) for more ways to help.

## License

MIT