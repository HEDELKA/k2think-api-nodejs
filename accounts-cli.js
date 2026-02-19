#!/usr/bin/env node

const readline = require('readline');
const AccountManager = require('./lib/account_manager');
const AccountRotator = require('./lib/account_rotator');

const manager = new AccountManager();
const rotator = new AccountRotator({ manager });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt user
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Hide password input
function promptPassword(question) {
  return new Promise(resolve => {
    process.stdin.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let password = '';

    process.stdin.on('data', key => {
      // Ctrl+C
      if (key[0] === 3) {
        process.exit();
      }
      // Enter
      if (key[0] === 13) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeAllListeners('data');
        console.log();
        resolve(password);
        return;
      }
      // Backspace
      if (key[0] === 127 || (key[0] === 8 && key[1] === 0)) {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      password += key;
      process.stdout.write('*');
    });
  });
}

// Commands
const commands = {
  async add(args) {
    console.log('\n=== Add New Account ===\n');
    
    const email = await prompt('Email: ');
    const password = await promptPassword('Password: ');
    const name = await prompt('Name (optional, press Enter to skip): ');
    const priorityStr = await prompt('Priority (1-10, default 1): ');
    
    const priority = parseInt(priorityStr) || 1;
    
    try {
      const account = await manager.addAccount({
        email,
        password,
        name: name || email,
        priority,
        validate: true
      });
      
      console.log('\n✅ Account added successfully!');
      console.log(`ID: ${account.id}`);
      console.log(`Email: ${account.email}`);
      console.log(`Status: ${account.status}`);
    } catch (error) {
      console.error('\n❌ Error:', error.message);
    }
  },

  async list(args) {
    console.log('\n=== Accounts ===\n');
    
    const accounts = manager.listAccounts({ includeStats: true, includeSensitive: false });
    
    if (accounts.length === 0) {
      console.log('No accounts found. Use "add" command to add an account.');
      return;
    }
    
    console.log('ID                          | Email                    | Status      | Priority | Requests');
    console.log('-'.repeat(90));
    
    for (const account of accounts) {
      const id = account.id.padEnd(27);
      const email = account.email.padEnd(26);
      const status = account.status.padEnd(11);
      const priority = String(account.priority).padEnd(8);
      const requests = account.stats?.totalRequests || 0;
      
      console.log(`${id} | ${email} | ${status} | ${priority} | ${requests}`);
    }
    
    console.log();
  },

  async remove(args) {
    const accountId = args[0];
    
    if (!accountId) {
      console.error('Error: Account ID required');
      console.log('Usage: node accounts-cli.js remove <account-id>');
      return;
    }
    
    try {
      const account = manager.getAccount(accountId);
      console.log(`\nRemoving account: ${account.id} (${account.email})`);
      
      const confirm = await prompt('Are you sure? (yes/no): ');
      
      if (confirm.toLowerCase() === 'yes') {
        manager.removeAccount(accountId);
        console.log('✅ Account removed');
      } else {
        console.log('Cancelled');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  },

  async test(args) {
    const accountId = args[0];
    
    if (!accountId) {
      console.error('Error: Account ID required');
      console.log('Usage: node accounts-cli.js test <account-id>');
      return;
    }
    
    try {
      console.log(`\nTesting account: ${accountId}...`);
      
      const isValid = await manager.validateAccount(accountId);
      
      if (isValid) {
        console.log('✅ Account is valid');
      } else {
        console.log('❌ Account is invalid (wrong credentials)');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  },

  async stats(args) {
    console.log('\n=== Account Statistics ===\n');
    
    const stats = manager.getStatistics();
    
    console.log('Overview:');
    console.log(`  Total accounts:     ${stats.totalAccounts}`);
    console.log(`  Active accounts:    ${stats.activeAccounts}`);
    console.log(`  Inactive accounts:  ${stats.inactiveAccounts}`);
    console.log();
    console.log('Requests:');
    console.log(`  Total requests:     ${stats.totalRequests}`);
    console.log(`  Successful:         ${stats.successfulRequests}`);
    console.log(`  Failed:             ${stats.failedRequests}`);
    console.log(`  Rate limit hits:    ${stats.rateLimitHits}`);
    console.log(`  Success rate:       ${stats.successRate}`);
    console.log();
    
    // Per-account stats
    const rotatorStats = rotator.getStats();
    console.log('Per-Account Status:');
    console.log('  ID                          | Status       | Requests/min | Total');
    console.log('  ' + '-'.repeat(75));
    
    for (const account of rotatorStats.accounts) {
      const id = account.id.padEnd(27);
      const status = (account.isRateLimited ? 'rate-limited' : account.status).padEnd(12);
      const rpm = String(account.requestsThisMinute).padEnd(12);
      const total = account.totalRequests;
      
      console.log(`  ${id} | ${status} | ${rpm} | ${total}`);
    }
    
    console.log();
  },

  async config(args) {
    const settings = manager.getSettings();
    
    console.log('\n=== Current Configuration ===\n');
    console.log(`Rotation strategy:    ${settings.rotationStrategy}`);
    console.log(`Rate limit/account:   ${settings.rateLimitPerAccount} requests`);
    console.log(`Rate limit window:    ${settings.rateLimitWindowMs / 1000}s`);
    console.log(`Cooldown:             ${settings.cooldownMs / 1000}s`);
    console.log(`Max retries:          ${settings.maxRetries}`);
    console.log();
    
    // Update if arguments provided
    if (args.length > 0) {
      const [key, value] = args;
      
      if (settings.hasOwnProperty(key)) {
        const newValue = key.includes('ms') ? parseInt(value) : value;
        manager.updateSettings({ [key]: newValue });
        console.log(`✅ Updated ${key} = ${newValue}`);
      } else {
        console.error(`Unknown setting: ${key}`);
      }
    }
  },

  async reset(args) {
    console.log('\nResetting all rate limits...');
    manager.resetRateLimits();
    console.log('✅ Rate limits reset');
  },

  help(args) {
    console.log(`
K2Think Accounts CLI

Usage: node accounts-cli.js <command> [arguments]

Commands:
  add              Add a new account (interactive)
  list             List all accounts
  remove <id>      Remove an account
  test <id>        Test account credentials
  stats            Show usage statistics
  config [key val] View or update configuration
  reset            Reset all rate limits
  help             Show this help message

Examples:
  node accounts-cli.js add
  node accounts-cli.js list
  node accounts-cli.js remove acc_1234567890
  node accounts-cli.js test acc_1234567890
  node accounts-cli.js stats
  node accounts-cli.js config rotationStrategy round-robin
  node accounts-cli.js reset

Configuration options:
  rotationStrategy     round-robin, least-used, random, priority
  rateLimitPerAccount  Number of requests per account per window
  rateLimitWindowMs    Time window in milliseconds (default: 60000)
  cooldownMs           Cooldown after rate limit (default: 30000)
  maxRetries           Max retries when rate limited (default: 3)
`);
  }
};

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const commandArgs = args.slice(1);

  if (commands[command]) {
    await commands[command](commandArgs);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('Use "help" command to see available commands');
  }

  rl.close();
}

main().catch(console.error);
