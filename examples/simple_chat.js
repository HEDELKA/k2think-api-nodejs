const K2ThinkClient = require('../client');

// Initialize client
const client = new K2ThinkClient();

// Simple helper function
async function chat(message) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [{ role: 'user', content: message }]
  });
  return response.choices[0].message.content;
}

// Usage
(async () => {
  console.log('Simple Chat Example\n');
  
  const answer1 = await chat('What is 5 * 7?');
  console.log('Q: What is 5 * 7?');
  console.log('A:', answer1);
  console.log();
  
  const answer2 = await chat('Explain async/await in JavaScript in one sentence.');
  console.log('Q: Explain async/await in JavaScript in one sentence.');
  console.log('A:', answer2);
})();
