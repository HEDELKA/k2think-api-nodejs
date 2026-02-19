#!/usr/bin/env node

/**
 * Quick add account script
 * Usage: node quick-add.js email password [name]
 */

const AccountManager = require('../src/lib/account_manager');

async function main() {
  const [,, email, password, name] = process.argv;

  if (!email || !password) {
    console.log('Usage: node quick-add.js <email> <password> [name]');
    console.log('\nExample:');
    console.log('  node quick-add.js user@example.com password123 "My Account"');
    process.exit(1);
  }

  const manager = new AccountManager();

  try {
    console.log(`Adding account: ${email}...`);
    
    const account = await manager.addAccount({
      email,
      password,
      name: name || email,
      priority: 1,
      validate: false  // Skip validation (network issues)
    });

    console.log('\n✅ Account added successfully!');
    console.log(`  ID: ${account.id}`);
    console.log(`  Email: ${account.email}`);
    console.log(`  Status: ${account.status}`);
    console.log('\nRun "node accounts-cli.js list" to see all accounts');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
