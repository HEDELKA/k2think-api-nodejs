const axios = require('axios');

/**
 * Integration tests for K2Think API Proxy server
 * Tests all HTTP endpoints in API proxy mode
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  model: 'MBZUAI-IFM/K2-Think-v2',  // Use v2 model
  timeout: 60000 // 60 seconds for API calls
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
    console.log(`✓ ${name}`);
  } else {
    results.failed++;
    console.log(`✗ ${name}`);
    if (error) console.log(`  Error: ${error.message}`);
  }
}

/**
 * Test 1: Health check endpoint
 */
async function testHealthCheck() {
  const testName = 'Health check GET /';
  try {
    const response = await axios.get(`${TEST_CONFIG.baseUrl}/`, {
      timeout: 5000
    });

    const passed = response.status === 200 &&
                   response.data.status === 'OK' &&
                   response.data.service;

    logTest(testName, passed, passed ? null : new Error('Invalid health response'));
    return response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest(testName, false, new Error('Server not running. Start with: npm start'));
    } else {
      logTest(testName, false, error);
    }
    throw error;
  }
}

/**
 * Test 2: List models endpoint
 */
async function testListModels() {
  const testName = 'List models GET /v1/models';
  try {
    const response = await axios.get(`${TEST_CONFIG.baseUrl}/v1/models`, {
      timeout: TEST_CONFIG.timeout
    });

    const passed = response.status === 200 &&
                   response.data.object === 'list' &&
                   Array.isArray(response.data.data) &&
                   response.data.data.length > 0;

    logTest(testName, passed, passed ? null : new Error('Invalid models response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 3: Simple chat completion
 */
async function testSimpleChatCompletion() {
  const testName = 'Chat completion POST /v1/chat/completions (simple)';
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: [
          { role: 'user', content: 'Say "Hello" in one word' }
        ]
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const passed = response.status === 200 &&
                   response.data.choices &&
                   response.data.choices.length > 0 &&
                   response.data.choices[0].message.content;

    logTest(testName, passed, passed ? null : new Error('Invalid chat response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 4: Chat completion with context
 */
async function testContextualChatCompletion() {
  const testName = 'Chat completion with context (multi-turn)';
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: [
          { role: 'user', content: 'My favorite color is blue' },
          { role: 'assistant', content: 'That\'s a nice color!' },
          { role: 'user', content: 'What is my favorite color?' }
        ]
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const content = response.data.choices[0].message.content.toLowerCase();
    const passed = response.status === 200 && content.includes('blue');

    logTest(testName, passed, passed ? null : new Error('Context not preserved'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 5: Chat with temperature parameter
 */
async function testTemperatureParameter() {
  const testName = 'Chat completion with temperature parameter';
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: [
          { role: 'user', content: 'Tell me a joke' }
        ],
        temperature: 0.8
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const passed = response.status === 200 &&
                   response.data.choices &&
                   response.data.choices.length > 0;

    logTest(testName, passed, passed ? null : new Error('Invalid response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 6: Chat with max_tokens parameter
 */
async function testMaxTokensParameter() {
  const testName = 'Chat completion with max_tokens parameter';
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: [
          { role: 'user', content: 'Count from 1 to 10' }
        ],
        max_tokens: 50
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const passed = response.status === 200 &&
                   response.data.choices &&
                   response.data.choices.length > 0;

    logTest(testName, passed, passed ? null : new Error('Invalid response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 7: Error handling - invalid request
 */
async function testInvalidRequest() {
  const testName = 'Error handling - empty messages array';
  try {
    await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: []
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    logTest(testName, false, new Error('Should have returned error'));
  } catch (error) {
    const passed = error.response && (error.response.status === 400 || error.response.status === 500);
    logTest(testName, passed, passed ? null : error);
  }
}

/**
 * Test 8: Response format validation (OpenAI compatible)
 */
async function testResponseFormat() {
  const testName = 'Response format validation (OpenAI compatible)';
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/v1/chat/completions`,
      {
        model: TEST_CONFIG.model,
        messages: [
          { role: 'user', content: 'Say hi' }
        ]
      },
      {
        timeout: TEST_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const data = response.data;
    // Validate OpenAI-compatible structure
    const hasId = data.id || data.id === '';
    const hasChoices = Array.isArray(data.choices);
    const hasUsage = data.usage && typeof data.usage === 'object';
    const hasModel = data.model;
    const hasCreated = data.created || data.created === 0;

    const passed = hasId && hasChoices && hasModel && hasCreated;
    logTest(testName, passed, passed ? null : new Error('Invalid response structure'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 9: CORS headers
 */
async function testCorsHeaders() {
  const testName = 'CORS headers present';
  try {
    const response = await axios.options(`${TEST_CONFIG.baseUrl}/v1/chat/completions`, {
      timeout: 5000,
      headers: { 'Origin': 'http://example.com' }
    });

    const hasCorsHeader = response.headers['access-control-allow-origin'];
    const passed = hasCorsHeader === '*' || hasCorsHeader === 'http://example.com';

    logTest(testName, passed, passed ? null : new Error('CORS headers missing'));
    return response;
  } catch (error) {
    // CORS preflight might not be explicitly handled, check regular response
    const regularResponse = await axios.get(`${TEST_CONFIG.baseUrl}/`, {
      timeout: 5000,
      headers: { 'Origin': 'http://example.com' }
    });

    const hasCorsHeader = regularResponse.headers['access-control-allow-origin'];
    const passed = hasCorsHeader === '*' || hasCorsHeader === 'http://example.com';
    logTest(testName, passed, passed ? null : new Error('CORS headers missing'));
  }
}

/**
 * Test 10: 404 handler
 */
async function testNotFoundHandler() {
  const testName = '404 handler for unknown routes';
  try {
    await axios.get(`${TEST_CONFIG.baseUrl}/nonexistent-route`, {
      timeout: 5000
    });
    logTest(testName, false, new Error('Should return 404'));
  } catch (error) {
    const passed = error.response && error.response.status === 404;
    logTest(testName, passed, passed ? null : error);
  }
}

/**
 * Check if server is running before tests
 */
async function checkServerRunning() {
  try {
    await axios.get(`${TEST_CONFIG.baseUrl}/`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=== K2Think API Proxy Integration Tests ===\n');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Model: ${TEST_CONFIG.model}`);
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms\n`);

  // Check if server is running
  console.log('Checking server status...');
  const isRunning = await checkServerRunning();
  if (!isRunning) {
    console.log('❌ Server is not running!');
    console.log('\nStart the server with: npm start');
    console.log('Then run tests again: node tests/api_integration.test.js\n');
    process.exit(1);
  }
  console.log('✓ Server is running\n');

  try {
    // Test 1: Health check
    console.log('--- Health Check ---');
    await testHealthCheck();

    // Test 2: List models
    console.log('\n--- Models Endpoint ---');
    await testListModels();

    // Test 3-6: Core functionality
    console.log('\n--- Chat Completion Endpoints ---');
    await testSimpleChatCompletion();
    await testContextualChatCompletion();
    await testTemperatureParameter();
    await testMaxTokensParameter();

    // Test 7-10: Error handling and validation
    console.log('\n--- Error Handling & Validation ---');
    await testInvalidRequest();
    await testResponseFormat();
    await testCorsHeaders();
    await testNotFoundHandler();

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total: ${results.passed + results.failed}`);

    if (results.failed === 0) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.log('\n=== Test Suite Aborted ===');
    console.log(`Fatal error: ${error.message}`);
    console.log('\nPossible causes:');
    console.log('1. Invalid credentials in .env file');
    console.log('2. Network connectivity issues');
    console.log('3. K2Think API service unavailable');
    console.log('\nCheck .env file and try again.');
    process.exit(1);
  }
}

// Run tests
runTests();
