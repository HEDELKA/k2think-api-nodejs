/**
 * Test multi-account client with real API requests
 */

const K2ThinkMultiClient = require('../src/client_multi');

async function main() {
  console.log('=== Testing Multi-Account Client ===\n');

  const client = new K2ThinkMultiClient({
    settings: {
      rotationStrategy: 'round-robin',
      rateLimitPerAccount: 10,
      rateLimitWindowMs: 60000,
      cooldownMs: 30000,
      maxRetries: 3
    }
  });

  // List accounts
  const accounts = client.listAccounts();
  console.log(`Found ${accounts.length} accounts\n`);

  if (accounts.length === 0) {
    console.log('No accounts configured!');
    return;
  }

  console.log('Accounts:');
  for (const acc of accounts) {
    console.log(`  - ${acc.id}: ${acc.email} (${acc.status})`);
  }
  console.log();

  // Test 1: Simple request
  console.log('--- Test 1: Simple Request ---\n');
  try {
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think-v2',
      messages: [
        { role: 'user', content: 'Say "Hello from account test" in one word' }
      ]
    });

    console.log('✅ Request successful!');
    console.log(`   Account: ${response._accountId}`);
    console.log(`   Response: ${response.choices[0].message.content.substring(0, 80)}...\n`);
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}\n`);
  }

  // Test 2: Multiple requests (test rotation)
  console.log('--- Test 2: Multiple Requests (Rotation Test) ---\n');
  
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await client.chat.completions.create({
        model: 'MBZUAI-IFM/K2-Think-v2',
        messages: [
          { role: 'user', content: `Request ${i}: Say the number ${i} in one word` }
        ]
      });

      results.push({
        request: i,
        accountId: response._accountId,
        success: true
      });

      console.log(`Request ${i}: ✅ Account ${response._accountId}`);
    } catch (error) {
      results.push({
        request: i,
        accountId: null,
        success: false,
        error: error.message
      });

      console.log(`Request ${i}: ❌ ${error.code || error.message}`);
    }
  }

  console.log();

  // Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('--- Summary ---\n');
  console.log(`Successful: ${successCount}/${results.length}`);
  console.log(`Failed: ${failCount}/${results.length}`);

  // Account usage
  const accountUsage = new Map();
  for (const r of results) {
    if (r.accountId) {
      accountUsage.set(r.accountId, (accountUsage.get(r.accountId) || 0) + 1);
    }
  }

  if (accountUsage.size > 0) {
    console.log('\nAccount usage:');
    for (const [accountId, count] of accountUsage) {
      console.log(`  ${accountId}: ${count} requests`);
    }
  }

  // Statistics
  console.log('\n--- Statistics ---\n');
  const stats = client.getStats();
  
  console.log('Manager stats:');
  console.log(`  Total accounts:    ${stats.manager.totalAccounts}`);
  console.log(`  Active accounts:   ${stats.manager.activeAccounts}`);
  console.log(`  Total requests:    ${stats.manager.totalRequests}`);
  console.log(`  Successful:        ${stats.manager.successfulRequests}`);
  console.log(`  Failed:            ${stats.manager.failedRequests}`);
  console.log(`  Success rate:      ${stats.manager.successRate}`);
  
  console.log('\nRotator stats:');
  console.log(`  Strategy:          ${stats.rotator.strategy}`);
  console.log(`  Active accounts:   ${stats.rotator.activeAccounts}`);
  console.log(`  Rate-limited:      ${stats.rotator.rateLimitedAccounts}`);

  console.log('\n=== Test Complete ===\n');
}

main().catch(console.error);
