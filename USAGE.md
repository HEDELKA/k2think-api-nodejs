# K2Think API Proxy - Usage Guide

## Overview

This proxy allows you to use K2Think AI exactly like OpenAI API - just set credentials once and forget about authentication!

## Setup (One-time)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure credentials** in `.env`:
   ```env
   K2THINK_EMAIL=your-email@example.com
   K2THINK_PASSWORD=your-password
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

That's it! The API is now ready to use.

## Using the API

### Python Example

```python
import requests

BASE_URL = "http://localhost:3000"

# Simple chat
response = requests.post(f"{BASE_URL}/v1/chat/completions", json={
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [
        {"role": "user", "content": "What is 2+2?"}
    ]
})

answer = response.json()["choices"][0]["message"]["content"]
print(answer)

# Chat with context
response = requests.post(f"{BASE_URL}/v1/chat/completions", json={
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [
        {"role": "user", "content": "My name is Alice"},
        {"role": "assistant", "content": "Nice to meet you, Alice!"},
        {"role": "user", "content": "What is my name?"}
    ]
})

answer = response.json()["choices"][0]["message"]["content"]
print(answer)  # Will correctly say "Alice"
```

### Node.js Example

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function chat(messages) {
  const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
    model: 'MBZUAI-IFM/K2-Think',
    messages: messages
  });
  
  return response.data.choices[0].message.content;
}

// Usage
(async () => {
  const answer1 = await chat([
    { role: 'user', content: 'Hello!' }
  ]);
  console.log(answer1);
  
  const answer2 = await chat([
    { role: 'user', content: 'My favorite color is blue' },
    { role: 'assistant', content: 'Nice choice!' },
    { role: 'user', content: 'What is my favorite color?' }
  ]);
  console.log(answer2);
})();
```

### curl Example

```bash
# Simple question
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# List models
curl http://localhost:3000/v1/models
```

## Features

### ✅ Automatic Authentication
- No need to manually authenticate
- Token refresh handled automatically
- Just start the server and use it

### ✅ Context Preservation
- Multi-turn conversations work perfectly
- Pass message history in `messages` array
- Model remembers previous context

### ✅ OpenAI Compatible
- Use OpenAI client libraries
- Same request/response format
- Drop-in replacement

## Response Format

The API returns OpenAI-compatible responses:

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1762533698,
  "model": "MBZUAI-IFM/K2-Think",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 431,
    "completion_tokens": 69,
    "total_tokens": 500
  }
}
```

## Troubleshooting

### Server won't start
- Check that port 3000 is not in use: `lsof -i:3000`
- Verify `.env` file has correct credentials

### Authentication errors
- Verify `K2THINK_EMAIL` and `K2THINK_PASSWORD` in `.env`
- Check server logs for authentication details

### No response from model
- Check that K2Think service is available
- Verify internet connection
- Check server logs for errors

## Testing

Run the test script to verify everything works:

```bash
node simple_test.js
```

This will test:
- Health check
- Models listing  
- Simple chat
- Context-aware conversation
