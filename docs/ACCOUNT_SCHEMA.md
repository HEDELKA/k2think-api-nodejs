# Multi-Account System Schema

## JSON Storage Format

### File: `data/accounts.json`

```json
{
  "version": "1.0",
  "createdAt": "2026-02-19T00:00:00.000Z",
  "updatedAt": "2026-02-19T00:00:00.000Z",
  "accounts": [
    {
      "id": "acc_001",
      "email": "user1@example.com",
      "password": "encrypted_password_here",
      "encryptionMethod": "aes-256-gcm",
      "status": "active",
      "createdAt": "2026-02-19T00:00:00.000Z",
      "lastUsed": "2026-02-19T12:00:00.000Z",
      "stats": {
        "totalRequests": 150,
        "successfulRequests": 148,
        "failedRequests": 2,
        "rateLimitHits": 1,
        "lastRequestAt": "2026-02-19T12:00:00.000Z"
      },
      "rateLimit": {
        "requestsThisMinute": 5,
        "windowStart": "2026-02-19T12:00:00.000Z",
        "blockedUntil": null
      },
      "priority": 1,
      "metadata": {
        "name": "Primary Account",
        "tags": ["production", "primary"]
      }
    }
  ],
  "settings": {
    "rotationStrategy": "round-robin",
    "rateLimitPerAccount": 10,
    "rateLimitWindowMs": 60000,
    "cooldownMs": 30000,
    "maxRetries": 3,
    "autoValidateOnAdd": true,
    "encryptionKey": "env:ACCOUNT_ENCRYPTION_KEY"
  }
}
```

## Account Status Values

| Status | Description | Used in Rotation |
|--------|-------------|------------------|
| `active` | Account is valid and available | ✅ Yes |
| `inactive` | Account temporarily disabled | ❌ No |
| `blocked` | Account blocked by K2Think | ❌ No |
| `rate-limited` | Hit rate limit, cooling down | ❌ No (until cooldown expires) |
| `invalid` | Invalid credentials | ❌ No |

## Rotation Strategies

### round-robin
Accounts are used in circular order. Simple and fair distribution.

```
Account 1 → Account 2 → Account 3 → Account 1 → ...
```

### least-used
Selects the account with the fewest requests in the current window.

```
Best for: Avoiding rate limits
```

### random
Random selection from available accounts.

```
Best for: Unpredictable patterns
```

### priority
Uses accounts by priority value (lower = higher priority).

```
Best for: Primary/backup account setup
```

## Rate Limiting Configuration

### Default Settings
```json
{
  "rateLimitPerAccount": 10,
  "rateLimitWindowMs": 60000,
  "cooldownMs": 30000
}
```

### How it works:
1. Each account tracks requests per minute
2. When `requestsThisMinute >= rateLimitPerAccount`, account is rate-limited
3. Account enters cooldown for `cooldownMs` milliseconds
4. After cooldown, counter resets

### Recommended values for K2Think:
- **Conservative:** 5 requests/minute, 60s cooldown
- **Moderate:** 10 requests/minute, 30s cooldown
- **Aggressive:** 15 requests/minute, 20s cooldown

## Encryption

### Password Storage
Passwords are encrypted using AES-256-GCM.

**Key sources (in order):**
1. `ACCOUNT_ENCRYPTION_KEY` environment variable
2. Auto-generated key stored in `.encryption_key` file
3. Default key (not recommended for production)

### Encryption Format
```
encrypted_password = base64(iv:ciphertext:authTag)
```

## API Methods

### AccountManager

```javascript
// Add new account
await manager.addAccount({ email, password, name?, priority? })

// Remove account
await manager.removeAccount(accountId)

// List all accounts
manager.listAccounts({ includeStats?, includeSensitive? })

// Get single account
manager.getAccount(accountId)

// Update account
await manager.updateAccount(accountId, { priority?, name?, status? })

// Validate credentials
await manager.validateAccount(accountId)

// Export accounts (without passwords)
manager.exportAccounts()
```

### AccountRotator

```javascript
// Get next available account
const account = await rotator.getNextAccount()

// Mark account as busy
rotator.markBusy(accountId)

// Mark account as free
rotator.markFree(accountId)

// Track request for rate limiting
rotator.trackRequest(accountId)

// Check if account is rate limited
rotator.isRateLimited(accountId)

// Get usage statistics
rotator.getStats()
```

### K2ThinkMultiClient

```javascript
// Create client with auto-rotation
const client = new K2ThinkMultiClient()

// Use like regular client (rotation is automatic)
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [...]
})

// Get account used for last request
console.log(response._accountId)

// Get statistics
const stats = client.getStats()

// Reset rate limits
client.resetRateLimits()
```

## Example Usage

### Basic Setup
```javascript
const { K2ThinkMultiClient } = require('./client_multi');

async function main() {
  const client = new K2ThinkMultiClient();
  
  // Make 100 requests with automatic rotation
  for (let i = 0; i < 100; i++) {
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think-v2',
      messages: [{ role: 'user', content: `Question ${i}` }]
    });
    
    console.log(`Request ${i}: Used account ${response._accountId}`);
  }
  
  // Print statistics
  console.log('Usage statistics:', client.getStats());
}

main();
```

### CLI Management
```bash
# Add new account
node accounts-cli.js add
# Enter email: user@example.com
# Enter password: ********
# Enter name (optional): Primary Account

# List accounts
node accounts-cli.js list

# Test account credentials
node accounts-cli.js test acc_001

# View statistics
node accounts-cli.js stats

# Remove account
node accounts-cli.js remove acc_001
```

## Error Handling

### Rate Limit Error
```javascript
try {
  await client.chat.completions.create({...});
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log(`Account ${error.accountId} rate limited. Rotating...`);
    // Automatic rotation happens internally
  }
  throw error;
}
```

### All Accounts Exhausted
```javascript
// When all accounts are rate-limited
error.code === 'NO_AVAILABLE_ACCOUNTS'
error.retryAfter = 30000 // ms until next account available
```
