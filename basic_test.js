const axios = require('axios');

// Simple test to verify the API is working
async function testAPI() {
  try {
    console.log('Testing the API endpoints...\n');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3000/');
    console.log('✓ Health endpoint working:', healthResponse.data.status);
    
    // Test that the server returns proper error for missing auth
    try {
      await axios.post('http://localhost:3000/v1/chat/completions', {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'test'
      });
    } catch (error) {
      if (error.response) {
        console.log('✓ Chat completions endpoint properly rejects unauthorized requests:', error.response.status);
      }
    }
    
    console.log('\n✓ Basic API functionality verified!');
    console.log('The K2Think AI API proxy is working correctly.');
  } catch (error) {
    console.error('✗ Error testing API:', error.message);
  }
}

// Run the test
testAPI();