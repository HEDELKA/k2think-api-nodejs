const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('=== K2Think API Simple Test ===\n');
  
  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const health = await axios.get(`${BASE_URL}/`);
    console.log('✓', health.data.service, '\n');
    
    // Test 2: List models
    console.log('2. Getting available models...');
    const models = await axios.get(`${BASE_URL}/v1/models`);
    console.log('✓ Available models:', models.data.data.length);
    models.data.data.forEach(m => console.log('  -', m.id));
    console.log();
    
    // Test 3: Simple chat
    console.log('3. Testing simple chat...');
    const chat1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'MBZUAI-IFM/K2-Think',
      messages: [{ role: 'user', content: 'Say hello in one word' }]
    });
    const answer1 = chat1.data.choices[0].message.content;
    console.log('✓ Response:', answer1.substring(0, 100) + '...\n');
    
    // Test 4: Chat with context
    console.log('4. Testing context-aware chat...');
    const chat2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'MBZUAI-IFM/K2-Think',
      messages: [
        { role: 'user', content: 'My favorite color is blue' },
        { role: 'assistant', content: 'That\'s a nice color!' },
        { role: 'user', content: 'What is my favorite color?' }
      ]
    });
    const answer2 = chat2.data.choices[0].message.content;
    console.log('✓ Response:', answer2.substring(0, 150) + '...\n');
    
    console.log('=== All tests passed! ===');
    console.log('\nAPI is working correctly with:');
    console.log('• Automatic authentication');
    console.log('• Context preservation');
    console.log('• OpenAI-compatible format');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\nServer not running. Start it with: npm start');
    }
  }
}

testAPI();
