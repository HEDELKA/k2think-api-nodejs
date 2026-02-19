require('dotenv').config();
const K2ThinkClient = require('../src/client');

async function listModels() {
  console.log('=== K2Think Available Models ===\n');

  try {
    const client = new K2ThinkClient();

    const models = await client.models.list();

    console.log('Available models:\n');
    models.data.forEach((model, index) => {
      console.log(`${index + 1}. ${model.id}`);
      console.log(`   Owned by: ${model.owned_by}`);
      console.log();
    });

    console.log('\n=== Testing with first model ===\n');

    const firstModel = models.data[0].id;
    console.log(`Using model: ${firstModel}`);

    const response = await client.chat.completions.create({
      model: firstModel,
      messages: [
        { role: 'user', content: 'Say hello in one word' }
      ]
    });

    console.log('✓ Response:', response.choices[0].message.content);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Details:', error.response.data);
    }
  }
}

listModels();
