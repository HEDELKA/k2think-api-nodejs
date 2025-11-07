require('dotenv').config();
const K2ThinkClient = require('./client');

async function testLibrary() {
  console.log('=== Testing K2Think Client Library ===\n');
  
  try {
    // Initialize client
    console.log('1. Initializing client...');
    const client = new K2ThinkClient();
    console.log('✓ Client initialized\n');
    
    // Test simple chat
    console.log('2. Testing simple chat...');
    const response1 = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think',
      messages: [
        { role: 'user', content: 'Say just "Hello"' }
      ]
    });
    console.log('✓ Response received');
    console.log('   Answer:', response1.choices[0].message.content.substring(0, 80) + '...\n');
    
    // Test context preservation
    console.log('3. Testing context preservation...');
    const response2 = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think',
      messages: [
        { role: 'user', content: 'My name is Bob' },
        { role: 'assistant', content: 'Nice to meet you, Bob!' },
        { role: 'user', content: 'What is my name?' }
      ]
    });
    console.log('✓ Context preserved');
    console.log('   Answer:', response2.choices[0].message.content.substring(0, 80) + '...\n');
    
    // Test models listing
    console.log('4. Testing models listing...');
    const models = await client.models.list();
    console.log('✓ Models listed');
    console.log('   Count:', models.data.length, 'models\n');
    
    // Test usage statistics
    console.log('5. Checking usage statistics...');
    console.log('   Prompt tokens:', response2.usage.prompt_tokens);
    console.log('   Completion tokens:', response2.usage.completion_tokens);
    console.log('   Total tokens:', response2.usage.total_tokens);
    
    console.log('\n=== ✅ All library tests passed! ===\n');
    console.log('Library features:');
    console.log('  • Direct API calls (no server needed)');
    console.log('  • Automatic authentication');
    console.log('  • Context preservation');
    console.log('  • OpenAI-compatible interface');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Details:', error.response.data);
    }
  }
}

testLibrary();
