const K2ThinkClient = require('../client');

// Example 1: Simple usage with environment variables
async function example1() {
  console.log('Example 1: Simple Chat\n');
  
  // Create client (uses K2THINK_EMAIL and K2THINK_PASSWORD from .env)
  const client = new K2ThinkClient();
  
  // Send a message
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [
      { role: 'user', content: 'What is 2+2? Answer in one word.' }
    ]
  });
  
  console.log('Response:', response.choices[0].message.content);
  console.log();
}

// Example 2: Chat with context
async function example2() {
  console.log('Example 2: Chat with Context\n');
  
  const client = new K2ThinkClient();
  
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [
      { role: 'user', content: 'My name is Alice' },
      { role: 'assistant', content: 'Nice to meet you, Alice!' },
      { role: 'user', content: 'What is my name?' }
    ]
  });
  
  console.log('Response:', response.choices[0].message.content);
  console.log();
}

// Example 3: Using explicit credentials
async function example3() {
  console.log('Example 3: Explicit Credentials\n');
  
  // Pass credentials directly
  const client = new K2ThinkClient({
    email: 'your-email@example.com',
    password: 'your-password'
  });
  
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [
      { role: 'user', content: 'Say hello' }
    ],
    temperature: 0.7
  });
  
  console.log('Response:', response.choices[0].message.content);
  console.log();
}

// Example 4: List available models
async function example4() {
  console.log('Example 4: List Models\n');
  
  const client = new K2ThinkClient();
  
  const models = await client.models.list();
  
  console.log('Available models:');
  models.data.forEach(model => {
    console.log(`  - ${model.id}`);
  });
  console.log();
}

// Example 5: Extract just the text content
async function example5() {
  console.log('Example 5: Quick Response Helper\n');
  
  const client = new K2ThinkClient();
  
  // Helper function to get just the text
  async function ask(question) {
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think',
      messages: [{ role: 'user', content: question }]
    });
    return response.choices[0].message.content;
  }
  
  const answer = await ask('What is the capital of France?');
  console.log('Answer:', answer);
  console.log();
}

// Run all examples
async function runAllExamples() {
  try {
    await example1();
    await example2();
    await example4();
    await example5();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runAllExamples();
