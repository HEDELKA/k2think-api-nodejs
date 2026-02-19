# Multi-Account System Guide

Automatic account rotation for K2Think API to avoid rate limits and increase throughput.

## Prerequisites

### Get K2Think Accounts

You need at least one K2Think account:

1. **Sign up**: https://www.k2think.ai/auth?mode=signup
2. **Login**: https://www.k2think.ai/auth
3. Save email and password for each account you want to use

**Recommended:** Create 3-5 accounts for better rotation and rate limit avoidance.

## Quick Start

### 1. Add Accounts

**Method 1: Quick Add (Recommended)**

```bash
node quick-add.js email@example.com password123 "Account Name"
```

Example:
```bash
node quick-add.js user@gmail.com MyPassword123 "My Account"
```

**Method 2: CLI Interactive**

```bash
node accounts-cli.js add
```

**Method 3: Programmatically**

```javascript
const K2ThinkMultiClient = require('./client_multi');
const client = new K2ThinkMultiClient();

await client.addAccount({
  email: 'user1@example.com',
  password: 'password123',
  name: 'Primary Account',
  priority: 1,
  validate: false  // Skip validation (network issues)
});
```

### 2. Use Like Regular Client

```javascript
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(`Used account: ${response._accountId}`);
```

Account rotation happens automatically!

---

## CLI Commands

### Add Account
```bash
node accounts-cli.js add
```
Interactive prompt for adding new account.

### List Accounts
```bash
node accounts-cli.js list
```
Shows all configured accounts.

### Remove Account
```bash
node accounts-cli.js remove <account-id>
```

### Test Account
```bash
node accounts-cli.js test <account-id>
```
Validates credentials against K2Think API.

### View Statistics
```bash
node accounts-cli.js stats
```
Shows usage statistics and rate limit status.

### Configure Settings
```bash
# View current config
node accounts-cli.js config

# Update setting
node accounts-cli.js config rotationStrategy round-robin
node accounts-cli.js config rateLimitPerAccount 15
```

### Reset Rate Limits
```bash
node accounts-cli.js reset
```
Clears all rate limits and cooldowns.

---

## Rotation Strategies

### Round-Robin (Default)
Accounts are used in circular order.

```javascript
settings: { rotationStrategy: 'round-robin' }
```

**Best for:** Even distribution of requests

### Least-Used
Selects account with fewest requests in current window.

```javascript
settings: { rotationStrategy: 'least-used' }
```

**Best for:** Avoiding rate limits

### Random
Random selection from available accounts.

```javascript
settings: { rotationStrategy: 'random' }
```

**Best for:** Unpredictable patterns

### Priority
Uses accounts by priority (lower number = higher priority).

```javascript
settings: { rotationStrategy: 'priority' }
```

**Best for:** Primary/backup setup

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rotationStrategy` | string | `'round-robin'` | Account selection strategy |
| `rateLimitPerAccount` | number | `10` | Max requests per account per window |
| `rateLimitWindowMs` | number | `60000` | Time window in ms (1 minute) |
| `cooldownMs` | number | `30000` | Cooldown after hitting rate limit |
| `maxRetries` | number | `3` | Max retries when rate limited |
| `autoValidateOnAdd` | boolean | `true` | Validate credentials when adding |

### Recommended Settings

**Conservative (safe, slower):**
```javascript
{
  rateLimitPerAccount: 5,
  rateLimitWindowMs: 60000,
  cooldownMs: 60000
}
```

**Moderate (balanced):**
```javascript
{
  rateLimitPerAccount: 10,
  rateLimitWindowMs: 60000,
  cooldownMs: 30000
}
```

**Aggressive (faster, more risk):**
```javascript
{
  rateLimitPerAccount: 15,
  rateLimitWindowMs: 60000,
  cooldownMs: 20000
}
```

---

## API Reference

### K2ThinkMultiClient

#### Constructor
```javascript
const client = new K2ThinkMultiClient({
  apiBase: 'https://www.k2think.ai',  // Optional
  model: 'MBZUAI-IFM/K2-Think-v2',    // Optional
  settings: {                          // Optional
    rotationStrategy: 'round-robin',
    rateLimitPerAccount: 10
  }
});
```

#### Methods

**chat.completions.create(options)**
```javascript
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7
});

// Response includes account ID
console.log(response._accountId);
```

**models.list()**
```javascript
const models = await client.models.list();
console.log(models.data);
```

**addAccount(options)**
```javascript
await client.addAccount({
  email: 'user@example.com',
  password: 'password',
  name: 'My Account',
  priority: 1,
  validate: true  // Validate credentials
});
```

**removeAccount(accountId)**
```javascript
client.removeAccount('acc_123456');
```

**listAccounts(options)**
```javascript
const accounts = client.listAccounts({
  includeStats: true,
  includeSensitive: false
});
```

**getStats()**
```javascript
const stats = client.getStats();
console.log(stats.manager);    // Overall statistics
console.log(stats.rotator);    // Rotator status
console.log(stats.lastRequest); // Last request info
```

**getAccountStats()**
```javascript
const accountStats = client.getAccountStats();
console.log(accountStats.accounts);
```

**resetRateLimits()**
```javascript
client.resetRateLimits();
```

**updateSettings(settings)**
```javascript
client.updateSettings({
  rateLimitPerAccount: 15,
  cooldownMs: 20000
});
```

---

## Error Handling

### No Available Accounts
```javascript
try {
  await client.chat.completions.create({...});
} catch (error) {
  if (error.code === 'NO_AVAILABLE_ACCOUNTS') {
    console.log('All accounts are rate-limited or inactive');
    // Wait and retry, or add more accounts
  }
}
```

### All Accounts Rate Limited
```javascript
try {
  await client.chat.completions.create({...});
} catch (error) {
  if (error.code === 'ALL_ACCOUNTS_RATE_LIMITED') {
    console.log('All accounts hit rate limit');
    console.log('Retry after:', error.retryAfter, 'ms');
    
    // Wait for cooldown
    await new Promise(r => setTimeout(r, error.retryAfter));
  }
}
```

### Invalid Account
```javascript
// Account will be automatically marked as 'invalid'
// and excluded from rotation
```

---

## Examples

### Basic Usage
```javascript
const K2ThinkMultiClient = require('./client_multi');
const client = new K2ThinkMultiClient();

// Make requests - rotation is automatic
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### High-Volume Processing
```javascript
const client = new K2ThinkMultiClient({
  settings: {
    rotationStrategy: 'least-used',
    rateLimitPerAccount: 10
  }
});

// Process 100 items
for (let i = 0; i < 100; i++) {
  try {
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think-v2',
      messages: [{ role: 'user', content: `Process item ${i}` }]
    });
    console.log(`Processed ${i} with account ${response._accountId}`);
  } catch (error) {
    console.error(`Failed to process ${i}:`, error.message);
  }
}
```

### Monitor Usage
```javascript
const client = new K2ThinkMultiClient();

// Check stats before making requests
const stats = client.getAccountStats();
console.log(`Active accounts: ${stats.activeAccounts}`);
console.log(`Rate-limited: ${stats.rateLimitedAccounts}`);

// Make request
const response = await client.chat.completions.create({...});

// Check stats after
console.log(client.getStats());
```

### Custom Account Selection
```javascript
const client = new K2ThinkMultiClient();

// Get next available account manually
const account = client.rotator.getNextAccount();
console.log(`Next account: ${account.id}`);
```

---

## Best Practices

### 1. Use Multiple Accounts
Add at least 3-5 accounts for smooth rotation:
```bash
node accounts-cli.js add  # Repeat for each account
```

### 2. Monitor Rate Limits
Check statistics regularly:
```javascript
setInterval(() => {
  const stats = client.getStats();
  console.log(`Active: ${stats.rotator.activeAccounts}/${stats.rotator.totalAccounts}`);
}, 60000); // Every minute
```

### 3. Adjust Settings
Tune rate limits based on K2Think's actual limits:
```javascript
client.updateSettings({
  rateLimitPerAccount: 8,  // Slightly below actual limit
  cooldownMs: 45000        // Give extra buffer
});
```

### 4. Handle Errors Gracefully
```javascript
async function safeRequest(prompt) {
  try {
    return await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think-v2',
      messages: [{ role: 'user', content: prompt }]
    });
  } catch (error) {
    if (error.code === 'NO_AVAILABLE_ACCOUNTS') {
      console.log('Waiting for accounts to cool down...');
      await new Promise(r => setTimeout(r, 30000));
      return safeRequest(prompt); // Retry
    }
    throw error;
  }
}
```

### 5. Use Priority for Important Accounts
```javascript
// Primary account (use first)
await client.addAccount({
  email: 'primary@example.com',
  password: '...',
  priority: 1
});

// Backup accounts
await client.addAccount({
  email: 'backup1@example.com',
  password: '...',
  priority: 5
});
```

---

## Storage

Accounts are stored in `data/accounts.json`.

**Encryption:**
- Passwords are encrypted with AES-256-GCM
- Key stored in `data/.encryption_key`
- Or set `ACCOUNT_ENCRYPTION_KEY` environment variable

**Backup:**
```bash
# Backup accounts (excluding encryption key)
cp data/accounts.json backup.json

# Restore
cp backup.json data/accounts.json
```

**Migration:**
```bash
# Export encryption key
export ACCOUNT_ENCRYPTION_KEY=$(cat data/.encryption_key)

# On new machine
export ACCOUNT_ENCRYPTION_KEY="your-key-here"
```

---

## Troubleshooting

### All requests fail with "No available accounts"
- Add more accounts: `node accounts-cli.js add`
- Reset rate limits: `node accounts-cli.js reset`
- Check account status: `node accounts-cli.js stats`

### Account marked as invalid
- Test credentials: `node accounts-cli.js test <account-id>`
- Re-add with correct password
- Check if account is blocked on K2Think website

### Rate limits hit too often
- Increase `cooldownMs`
- Decrease `rateLimitPerAccount`
- Add more accounts

### Slow performance
- Use `least-used` strategy for better distribution
- Increase `rateLimitPerAccount` (carefully)
- Add more accounts

---

## Security Notes

1. **Protect `data/accounts.json`** - Contains encrypted passwords
2. **Never commit `.encryption_key`** - Store securely
3. **Use environment variables** - Set `ACCOUNT_ENCRYPTION_KEY` in production
4. **Regular credential rotation** - Update passwords periodically

---

## See Also

- [ACCOUNT_SCHEMA.md](ACCOUNT_SCHEMA.md) - JSON schema documentation
- [TEST_RESULTS.md](TEST_RESULTS.md) - Testing guide
