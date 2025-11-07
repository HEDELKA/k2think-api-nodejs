# Library vs API Proxy - Comparison

## Quick Comparison

| Feature | Library Mode | API Proxy Mode |
|---------|-------------|----------------|
| **Usage** | `const client = new K2ThinkClient()` | `curl http://localhost:3000/...` |
| **Server Required** | ❌ No | ✅ Yes |
| **Language** | Node.js only | Any (HTTP) |
| **Setup** | Import + use | npm start + HTTP |
| **Best For** | Node.js apps, scripts | Web apps, multi-service |

## Library Mode (client.js)

### ✅ Advantages
- No server to run
- Direct function calls
- Faster (no HTTP overhead)
- Simpler for Node.js apps
- Less memory usage

### ❌ Limitations
- Node.js only
- Must be in same project

### Code Example
```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: [{ role: 'user', content: 'Hello' }]
});

console.log(response.choices[0].message.content);
```

### Use Cases
- CLI tools and scripts
- Backend services
- Automation tasks
- Data processing
- When you control the code

## API Proxy Mode (index.js)

### ✅ Advantages
- Works with any language
- Multiple clients can connect
- Standard HTTP REST API
- Easy to integrate
- Good for microservices

### ❌ Limitations
- Requires running server
- HTTP overhead
- More memory usage

### Code Example
```bash
# Start server once
npm start

# Use from anywhere
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"MBZUAI-IFM/K2-Think","messages":[{"role":"user","content":"Hello"}]}'
```

### Use Cases
- Frontend applications
- Mobile apps
- Python/Ruby/other languages
- Multiple services sharing API
- When you need HTTP REST API

## Performance Comparison

### Library Mode
```
┌─────────────────┐
│  Your Node.js   │
│  Application    │
│                 │
│ ┌─────────────┐ │
│ │ K2ThinkClient│ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
         ▼
   K2Think API
```
**Latency**: ~200-500ms (API only)

### API Proxy Mode
```
┌──────────────┐      ┌──────────────┐
│   Any Client │─────▶│  Proxy Server│
│ (curl/fetch) │ HTTP │  (index.js)  │
└──────────────┘      └──────┬───────┘
                             │
                             ▼
                       K2Think API
```
**Latency**: ~250-550ms (HTTP + API)

## When to Use What?

### Use Library Mode If:
- ✅ You're writing Node.js code
- ✅ You control the application
- ✅ You want simplicity
- ✅ Performance is critical
- ✅ You don't need multi-language support

### Use API Proxy Mode If:
- ✅ You need HTTP REST API
- ✅ Multiple services will connect
- ✅ Using non-Node.js languages
- ✅ Frontend needs to connect
- ✅ You want standard REST interface

## Can I Use Both?

**Yes!** They can coexist:

```javascript
// In Node.js backend - use library
const client = new K2ThinkClient();
await client.chat.completions.create({...});

// For frontend - start proxy server
// npm start
// Then use fetch/axios from browser
```

## Examples

### Library Mode Example: Data Processing Script
```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

// Process 100 texts
const texts = [...]; // your data

for (const text of texts) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [{ role: 'user', content: `Summarize: ${text}` }]
  });
  console.log(response.choices[0].message.content);
}
```

### API Proxy Mode Example: React Frontend
```javascript
// Start proxy: npm start

// In React app
const ChatComponent = () => {
  const [response, setResponse] = useState('');
  
  const ask = async (question) => {
    const res = await fetch('http://localhost:3000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'MBZUAI-IFM/K2-Think',
        messages: [{ role: 'user', content: question }]
      })
    });
    const data = await res.json();
    setResponse(data.choices[0].message.content);
  };
  
  return <div>...</div>;
};
```

## Summary

**Library Mode** = Direct, fast, Node.js only  
**API Proxy Mode** = HTTP REST, any language, more flexible  

Both support:
- ✅ Automatic authentication
- ✅ Token refresh
- ✅ Context preservation
- ✅ OpenAI compatibility
