/**
 * Add accounts and test them
 */

const AccountManager = require('../lib/account_manager');

const manager = new AccountManager();

const accounts = [
  {
    email: 'dagmar74@comfythings.com',
    password: 'RRX-9a3-7XF-nPB',
    name: 'Dagmar Account'
  },
  {
    email: 'hannahsapphire@2200freefonts.com',
    password: '8F4-BWM-g9u-zxy',
    name: 'Hannah Account'
  },
  {
    email: 'satucostanzo5542016@gmail.com',
    password: 'N4r-myq-Jun-wSU',
    name: 'Satu Account'
  },
  {
    email: 'giuseppahylton0701946@gmail.com',
    password: 'ZaS-2PE-kSq-WNZ',
    name: 'Giuseppa Account'
  }
];

async function main() {
  console.log('=== Adding K2Think Accounts ===\n');

  for (const account of accounts) {
    console.log(`Adding: ${account.email}...`);
    try {
      const result = await manager.addAccount({
        email: account.email,
        password: account.password,
        name: account.name,
        priority: 1,
        validate: false  // Skip validation during add
      });
      console.log(`✅ Added: ${result.id}\n`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }

  console.log('\n=== Account List ===\n');
  const list = manager.listAccounts({ includeStats: false, includeSensitive: false });
  
  console.log('ID                          | Email                    | Status      | Priority');
  console.log('-'.repeat(80));
  
  for (const account of list) {
    const id = account.id.padEnd(27);
    const email = account.email.padEnd(26);
    const status = account.status.padEnd(11);
    const priority = String(account.priority);
    
    console.log(`${id} | ${email} | ${status} | ${priority}`);
  }

  console.log('\n=== Testing Accounts ===\n');
  
  for (const account of list) {
    const accountId = account.id;
    console.log(`Testing ${accountId}...`);
    
    try {
      const isValid = await manager.validateAccount(accountId);
      
      if (isValid) {
        console.log(`✅ ${accountId} is VALID\n`);
      } else {
        console.log(`❌ ${accountId} is INVALID\n`);
      }
    } catch (error) {
      console.log(`❌ ${accountId} error: ${error.message}\n`);
    }
  }

  console.log('\n=== Statistics ===\n');
  const stats = manager.getStatistics();
  
  console.log(`Total accounts:    ${stats.totalAccounts}`);
  console.log(`Active accounts:   ${stats.activeAccounts}`);
  console.log(`Inactive accounts: ${stats.inactiveAccounts}`);
  console.log(`Success rate:      ${stats.successRate}`);
}

main().catch(console.error);
