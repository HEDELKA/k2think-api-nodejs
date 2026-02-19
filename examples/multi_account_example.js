/**
 * Multi-Account Example - Automatic Rate Limit Avoidance
 * 
 * This example demonstrates how to use multiple K2Think accounts
 * with automatic rotation to avoid rate limits.
 */

const K2ThinkMultiClient = require('./client_multi');

async function main() {
  console.log('=== K2Think Multi-Account Example ===\n');

  // Create client with custom settings
  const client = new K2ThinkMultiClient({
    settings: {
      rotationStrategy: 'round-robin',  // round-robin, least-used, random, priority
      rateLimitPerAccount: 10,          // Requests per account per minute
      rateLimitWindowMs: 60000,         // 1 minute window
      cooldownMs: 30000,                // 30 second cooldown after rate limit
      maxRetries: 3                     // Max retries when rate limited
    }
  });

  // Check if we have accounts
  const accounts = client.listAccounts();
  
  if (accounts.length === 0) {
    console.log('No accounts configured!');
    console.log('\nTo add accounts, run:');
    console.log('  node accounts-cli.js add\n');
    console.log('Or add them programmatically:');
    console.log(`
  await client.addAccount({
    email: 'user@example.com',
    password: 'your-password',
    name: 'My Account',
    priority: 1
  });
    `);
    return;
  }

  console.log(`Using ${accounts.length} account(s)\n`);

  // Example 1: Simple requests with automatic rotation
  console.log('--- Example 1: Automatic Rotation ---\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await client.chat.completions.create({
        model: 'MBZUAI-IFM/K2-Think-v2',
        messages: [
          { role: 'user', content: `Count from 1 to ${i}. Be brief.` }
        ]
      });
      
      console.log(`Request ${i}:`);
      console.log(`  Account: ${response._accountId}`);
      console.log(`  Response: ${response.choices[0].message.content.substring(0, 50)}...`);
      console.log();
    } catch (error) {
      console.error(`Request ${i} failed:`, error.message);
    }
  }

  // Example 2: High-volume requests (demonstrates rate limiting)
  console.log('\n--- Example 2: High Volume (Rate Limit Demo) ---\n');
  console.log('Making 25 rapid requests...\n');
  
  let successCount = 0;
  let failCount = 0;
  const accountUsage = new Map();
  
  for (let i = 1; i <= 25; i++) {
    try {
      const response = await client.chat.completions.create({
        model: 'MBZUAI-IFM/K2-Think-v2',
        messages: [
          { role: 'user', content: `Say "Request ${i}" in one word.` }
        ]
      });
      
      successCount++;
      
      // Track account usage
      const accountId = response._accountId;
      accountUsage.set(accountId, (accountUsage.get(accountId) || 0) + 1);
      
      if (i % 5 === 0 || i === 25) {
        console.log(`Completed ${i}/25 requests...`);
      }
    } catch (error) {
      failCount++;
      console.log(`Request ${i} failed: ${error.code || error.message}`);
    }
  }

  console.log(`\nResults: ${successCount} successful, ${failCount} failed`);
  console.log('\nAccount usage:');
  for (const [accountId, count] of accountUsage) {
    console.log(`  ${accountId}: ${count} requests`);
  }

  // Example 3: Statistics
  console.log('\n--- Example 3: Statistics ---\n');
  
  const stats = client.getStats();
  
  console.log('Overall Statistics:');
  console.log(`  Total accounts:     ${stats.manager.totalAccounts}`);
  console.log(`  Active accounts:    ${stats.manager.activeAccounts}`);
  console.log(`  Total requests:     ${stats.manager.totalRequests}`);
  console.log(`  Success rate:       ${stats.manager.successRate}`);
  console.log(`  Rate limit hits:    ${stats.manager.rateLimitHits}`);
  console.log();
  
  console.log('Rotator Status:');
  console.log(`  Strategy:           ${stats.rotator.strategy}`);
  console.log(`  Active accounts:    ${stats.rotator.activeAccounts}`);
  console.log(`  Busy accounts:      ${stats.rotator.busyAccounts}`);
  console.log(`  Rate-limited:       ${stats.rotator.rateLimitedAccounts}`);
  console.log();

  // Example 4: Per-account details
  console.log('Per-Account Details:');
  for (const account of stats.rotator.accounts) {
    console.log(`  ${account.id}:`);
    console.log(`    Status:  ${account.status}`);
    console.log(`    Requests this minute: ${account.requestsThisMinute}`);
    console.log(`    Total requests: ${account.totalRequests}`);
    if (account.timeUntilAvailable > 0) {
      console.log(`    Cooldown: ${Math.round(account.timeUntilAvailable / 1000)}s`);
    }
  }
  console.log();

  console.log('=== Example Complete ===\n');
}

// Run example
main().catch(console.error);
