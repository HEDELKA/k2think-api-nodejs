require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Create HTTPS agent to bypass proxy issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: true
});

async function checkModels() {
  console.log('=== Checking K2Think Models ===\n');

  try {
    // First authenticate
    console.log('1. Authenticating...');
    const authResponse = await axios.post(
      `${process.env.K2THINK_API_BASE}/api/v1/auths/signin`,
      {
        email: process.env.K2THINK_EMAIL,
        password: process.env.K2THINK_PASSWORD
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        httpsAgent
      }
    );

    const token = authResponse.data.token;
    console.log('✓ Authenticated, token:', token.substring(0, 20) + '...\n');

    // Get models
    console.log('2. Fetching models...');
    const modelsResponse = await axios.get(
      `${process.env.K2THINK_API_BASE}/api/v1/models`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        httpsAgent
      }
    );

    const models = modelsResponse.data.data || modelsResponse.data;
    console.log('✓ Available models:\n');

    models.forEach(model => {
      console.log(`  - ${model.id || model.name}`);
    });

    console.log('\n\n=== Testing chat with first model ===\n');

    const firstModel = models[0].id || models[0].name;
    console.log(`Using model: ${firstModel}`);

    const chatResponse = await axios.post(
      `${process.env.K2THINK_API_BASE}/api/chat/completions`,
      {
        model: firstModel,
        messages: [
          { role: 'user', content: 'Say hello in one word' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        httpsAgent
      }
    );

    console.log('✓ Chat response:');
    console.log('Answer:', chatResponse.data.choices[0].message.content);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Details:', JSON.stringify(error.response.data));
    }
  }
}

checkModels();
