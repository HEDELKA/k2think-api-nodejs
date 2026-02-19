/**
 * Test single account directly
 */

const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: true });
const axiosInstance = axios.create({ httpsAgent, proxy: false });

const accounts = [
  { email: 'dagmar74@comfythings.com', password: 'RRX-9a3-7XF-nPB' },
  { email: 'hannahsapphire@2200freefonts.com', password: '8F4-BWM-g9u-zxy' },
  { email: 'satucostanzo5542016@gmail.com', password: 'N4r-myq-Jun-wSU' },
  { email: 'giuseppahylton0701946@gmail.com', password: 'ZaS-2PE-kSq-WNZ' }
];

async function testAccount(email, password) {
  console.log(`\nTesting: ${email}`);
  console.log('-'.repeat(50));
  
  try {
    // Login
    console.log('1. Authenticating...');
    const authResponse = await axiosInstance.post(
      'https://www.k2think.ai/api/v1/auths/signin',
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    const token = authResponse.data.token;
    console.log(`   ✅ Auth successful, token: ${token.substring(0, 20)}...`);
    
    // Chat
    console.log('2. Testing chat...');
    const chatResponse = await axiosInstance.post(
      'https://www.k2think.ai/api/chat/completions',
      {
        model: 'MBZUAI-IFM/K2-Think-v2',
        messages: [
          { role: 'user', content: 'Say "Hello" in one word' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );
    
    const content = chatResponse.data.choices[0].message.content;
    console.log(`   ✅ Chat successful!`);
    console.log(`   Response: ${content.substring(0, 80)}...`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      if (error.response.data?.detail) {
        console.log(`   Detail: ${error.response.data.detail}`);
      }
    }
    return false;
  }
}

async function main() {
  console.log('=== Testing K2Think Accounts Directly ===');
  
  const results = [];
  
  for (const account of accounts) {
    const success = await testAccount(account.email, account.password);
    results.push({ email: account.email, success });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('=== Summary ===\n');
  
  for (const r of results) {
    const status = r.success ? '✅ VALID' : '❌ INVALID';
    console.log(`${status}: ${r.email}`);
  }
  
  const validCount = results.filter(r => r.success).length;
  console.log(`\nValid: ${validCount}/${results.length}`);
}

main().catch(console.error);
