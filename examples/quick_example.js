require('dotenv').config();
const K2ThinkClient = require('../client');

// Инициализация клиента
const client = new K2ThinkClient();

// Простая функция для вопросов
async function ask(question) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [{ role: 'user', content: question }]
  });
  return response.choices[0].message.content;
}

// Использование
(async () => {
  console.log('🤖 K2Think Client - Quick Example\n');
  
  const answer1 = await ask('Сколько будет 7 * 8?');
  console.log('Q: Сколько будет 7 * 8?');
  console.log('A:', answer1.substring(0, 150), '...\n');
  
  const answer2 = await ask('Что такое Node.js в одном предложении?');
  console.log('Q: Что такое Node.js в одном предложении?');
  console.log('A:', answer2.substring(0, 150), '...\n');
  
  console.log('✅ Готово! Никакого сервера не требуется.');
})();
