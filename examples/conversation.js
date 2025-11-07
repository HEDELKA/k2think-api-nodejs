const K2ThinkClient = require('../client');

const client = new K2ThinkClient();

// Conversation manager
class Conversation {
  constructor() {
    this.messages = [];
  }
  
  addMessage(role, content) {
    this.messages.push({ role, content });
  }
  
  async send(userMessage) {
    this.addMessage('user', userMessage);
    
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think',
      messages: this.messages
    });
    
    const assistantMessage = response.choices[0].message.content;
    this.addMessage('assistant', assistantMessage);
    
    return assistantMessage;
  }
  
  getHistory() {
    return this.messages;
  }
}

// Usage example
(async () => {
  console.log('Conversation Example\n');
  
  const conv = new Conversation();
  
  let reply = await conv.send('My favorite programming language is JavaScript');
  console.log('User: My favorite programming language is JavaScript');
  console.log('Assistant:', reply.substring(0, 100) + '...\n');
  
  reply = await conv.send('What is my favorite language?');
  console.log('User: What is my favorite language?');
  console.log('Assistant:', reply.substring(0, 100) + '...\n');
  
  reply = await conv.send('Why is it popular?');
  console.log('User: Why is it popular?');
  console.log('Assistant:', reply.substring(0, 100) + '...\n');
  
  console.log('Conversation history:', conv.getHistory().length, 'messages');
})();
