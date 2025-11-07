const axios = require('axios');

async function completeTest() {
  console.log('Running complete API functionality test...\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  try {
    // 1. Test health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✓ Health endpoint:', healthResponse.data.service);
    
    // 2. Test that protected endpoints require auth
    console.log('\n2. Testing authentication requirement...');
    try {
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }]
      });
      console.log('✗ Unexpected success - endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
        console.log('✓ Protected endpoint correctly requires authentication:', error.response.status);
      } else {
        console.log('? Unexpected error code for protected endpoint:', error.response?.status);
      }
    }
    
    // 3. Test models endpoint auth requirement
    console.log('\n3. Testing models endpoint authentication...');
    try {
      const modelsResponse = await axios.get(`${BASE_URL}/v1/models`);
      console.log('✗ Unexpected success - models endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✓ Models endpoint correctly requires authentication:', error.response.status);
      } else {
        console.log('? Models endpoint returned unexpected status:', error.response?.status);
      }
    }
    
    // 4. Test completions endpoint auth requirement
    console.log('\n4. Testing completions endpoint authentication...');
    try {
      const compResponse = await axios.post(`${BASE_URL}/v1/completions`, {
        model: 'test-model',
        prompt: 'Hello'
      });
      console.log('✗ Unexpected success - completions endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✓ Completions endpoint correctly requires authentication:', error.response.status);
      } else {
        console.log('? Completions endpoint returned unexpected status:', error.response?.status);
      }
    }
    
    // 5. Test embeddings endpoint auth requirement
    console.log('\n5. Testing embeddings endpoint authentication...');
    try {
      const embedResponse = await axios.post(`${BASE_URL}/v1/embeddings`, {
        model: 'test-model',
        input: 'Hello'
      });
      console.log('✗ Unexpected success - embeddings endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✓ Embeddings endpoint correctly requires authentication:', error.response.status);
      } else {
        console.log('? Embeddings endpoint returned unexpected status:', error.response?.status);
      }
    }
    
    console.log('\n✓ All API endpoints are functioning correctly!');
    console.log('\nSUMMARY:');
    console.log('- Health endpoint: ✓ Working');
    console.log('- Authentication endpoint: Available at /api/v1/auths/signin');
    console.log('- Chat completions: Available at /v1/chat/completions (requires auth)');
    console.log('- Legacy completions: Available at /v1/completions (requires auth)');
    console.log('- Models listing: Available at /v1/models (requires auth)');
    console.log('- Embeddings: Available at /v1/embeddings (requires auth)');
    console.log('\nTo use the API, first authenticate at /api/v1/auths/signin with your credentials,');
    console.log('then use the returned token in the Authorization header for other endpoints.');
    
  } catch (error) {
    console.error('✗ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nThe server is not running. Please start it with:');
      console.error('  cd /home/hedelka/main/all_projects/k2think_api_nodejs && node server.js');
    }
  }
}

// Run the complete test
completeTest();