const K2ThinkClient = require('../client');

/**
 * Integration tests for K2ThinkClient library
 * Tests all major functionality in library mode
 */

// Test configuration
const TEST_CONFIG = {
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
 * Test 1: Client initialization with env vars
 */
async function testClientInitialization() {
  const testName = 'Client initialization with environment variables';
  try {
    const client = new K2ThinkClient();
    logTest(testName, true);
    return client;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 2: Simple chat completion
 */
async function testSimpleChat(client) {
  const testName = 'Simple chat completion';
  try {
    const response = await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: [
        { role: 'user', content: 'Say "Hello" in one word' }
      ]
    });

    const passed = response &&
                   response.choices &&
                   response.choices.length > 0 &&
                   response.choices[0].message.content;

    logTest(testName, passed, passed ? null : new Error('Invalid response format'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 3: Chat with context (multi-turn conversation)
 */
async function testContextualChat(client) {
  const testName = 'Chat with context (multi-turn)';
  try {
    const response = await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: [
        { role: 'user', content: 'My favorite color is blue' },
        { role: 'assistant', content: 'That\'s a nice color!' },
        { role: 'user', content: 'What is my favorite color?' }
      ]
    });

    const content = response.choices[0].message.content.toLowerCase();
    const passed = content.includes('blue');

    logTest(testName, passed, passed ? null : new Error('Context not preserved'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 4: List models
 */
async function testListModels(client) {
  const testName = 'List available models';
  try {
    const response = await client.models.list();

    const passed = response &&
                   response.object === 'list' &&
                   Array.isArray(response.data) &&
                   response.data.length > 0;

    logTest(testName, passed, passed ? null : new Error('Invalid models response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 5: Chat with temperature parameter
 */
async function testTemperatureParameter(client) {
  const testName = 'Chat with temperature parameter';
  try {
    const response = await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: [
        { role: 'user', content: 'Tell me a joke' }
      ],
      temperature: 0.8
    });

    const passed = response && response.choices && response.choices.length > 0;
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
async function testMaxTokensParameter(client) {
  const testName = 'Chat with max_tokens parameter';
  try {
    const response = await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: [
        { role: 'user', content: 'Count from 1 to 10' }
      ],
      max_tokens: 50
    });

    const passed = response && response.choices && response.choices.length > 0;
    logTest(testName, passed, passed ? null : new Error('Invalid response'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Test 7: Error handling - empty messages
 */
async function testEmptyMessagesError(client) {
  const testName = 'Error handling - empty messages array';
  try {
    await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: []
    });
    logTest(testName, false, new Error('Should have thrown error'));
  } catch (error) {
    const passed = error.message.includes('required');
    logTest(testName, passed, passed ? null : error);
  }
}

/**
 * Test 8: Response format validation
 */
async function testResponseFormat(client) {
  const testName = 'Response format validation (OpenAI compatible)';
  try {
    const response = await client.chat.completions.create({
      model: TEST_CONFIG.model,
      messages: [
        { role: 'user', content: 'Say hi' }
      ]
    });

    // Validate OpenAI-compatible structure
    const hasId = response.id || response.id === '';
    const hasChoices = Array.isArray(response.choices);
    const hasUsage = response.usage && typeof response.usage === 'object';
    const hasModel = response.model;
    const hasCreated = response.created || response.created === 0;

    const passed = hasId && hasChoices && hasModel && hasCreated;
    logTest(testName, passed, passed ? null : new Error('Invalid response structure'));
    return response;
  } catch (error) {
    logTest(testName, false, error);
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=== K2ThinkClient Library Integration Tests ===\n');
  console.log(`Model: ${TEST_CONFIG.model}`);
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms\n`);

  try {
    // Test 1: Initialization
    console.log('--- Client Initialization ---');
    const client = await testClientInitialization();

    // Test 2-6: Core functionality
    console.log('\n--- Core Functionality ---');
    await testSimpleChat(client);
    await testContextualChat(client);
    await testListModels(client);
    await testTemperatureParameter(client);
    await testMaxTokensParameter(client);

    // Test 7-8: Error handling and validation
    console.log('\n--- Error Handling & Validation ---');
    await testEmptyMessagesError(client);
    await testResponseFormat(client);

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
