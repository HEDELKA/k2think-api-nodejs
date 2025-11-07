# K2Think Client Library

## Использование как библиотека (без сервера!)

Можно использовать K2Think напрямую в коде, без запуска отдельного сервера.

## Установка

```bash
npm install
```

## Быстрый старт

### 1. Настройте credentials

В `.env`:
```env
K2THINK_EMAIL=your-email@example.com
K2THINK_PASSWORD=your-password
```

### 2. Используйте в коде

```javascript
const K2ThinkClient = require('./client');

// Инициализация (использует credentials из .env)
const client = new K2ThinkClient();

// Отправка сообщения
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: [
    { role: 'user', content: 'Привет!' }
  ]
});

console.log(response.choices[0].message.content);
```

## Примеры использования

### Простой запрос

```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

async function ask(question) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think',
    messages: [{ role: 'user', content: question }]
  });
  return response.choices[0].message.content;
}

const answer = await ask('Что такое JavaScript?');
console.log(answer);
```

### Диалог с контекстом

```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

// Создаем историю диалога
const messages = [];

// Первое сообщение
messages.push({ role: 'user', content: 'Меня зовут Иван' });

let response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: messages
});

// Добавляем ответ в историю
messages.push({
  role: 'assistant',
  content: response.choices[0].message.content
});

// Второе сообщение (модель помнит имя!)
messages.push({ role: 'user', content: 'Как меня зовут?' });

response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: messages
});

console.log(response.choices[0].message.content); // Ответит "Иван"
```

### Управление разговором

```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

class Conversation {
  constructor() {
    this.messages = [];
  }
  
  async send(userMessage) {
    this.messages.push({ role: 'user', content: userMessage });
    
    const response = await client.chat.completions.create({
      model: 'MBZUAI-IFM/K2-Think',
      messages: this.messages
    });
    
    const reply = response.choices[0].message.content;
    this.messages.push({ role: 'assistant', content: reply });
    
    return reply;
  }
}

// Использование
const conv = new Conversation();

await conv.send('Привет! Меня зовут Алиса');
await conv.send('Что я тебе только что сказала?'); // Помнит имя
await conv.send('Расскажи анекдот'); // Продолжает диалог
```

### Явные credentials

```javascript
const K2ThinkClient = require('./client');

// Передать credentials напрямую
const client = new K2ThinkClient({
  email: 'your-email@example.com',
  password: 'your-password'
});

const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Список моделей

```javascript
const K2ThinkClient = require('./client');
const client = new K2ThinkClient();

const models = await client.models.list();

console.log('Доступные модели:');
models.data.forEach(model => {
  console.log(`  - ${model.id}`);
});
```

### Параметры запроса

```javascript
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think',
  messages: [{ role: 'user', content: 'Расскажи шутку' }],
  temperature: 0.8,      // Креативность (0-2)
  max_tokens: 500        // Максимум токенов в ответе
});
```

## API Reference

### K2ThinkClient

#### Constructor

```javascript
new K2ThinkClient(options?)
```

**Options:**
- `email` (string) - Email для K2Think (или из `K2THINK_EMAIL`)
- `password` (string) - Пароль (или из `K2THINK_PASSWORD`)
- `apiBase` (string) - Base URL API (default: `https://www.k2think.ai`)

#### Methods

##### chat.completions.create(options)

Создает chat completion (как в OpenAI).

**Options:**
- `model` (string) - Модель (default: `'MBZUAI-IFM/K2-Think'`)
- `messages` (array) - Массив сообщений `[{role, content}]`
- `temperature` (number) - Температура 0-2 (optional)
- `max_tokens` (number) - Макс токенов (optional)

**Returns:** OpenAI-совместимый response object

##### models.list()

Получает список доступных моделей.

**Returns:** Object с массивом `data` моделей

## Преимущества библиотеки

✅ **Без сервера** - прямые вызовы API  
✅ **Автоматическая авторизация** - не нужно думать о токенах  
✅ **OpenAI-совместимый** - тот же интерфейс  
✅ **Контекст** - многоходовые диалоги работают  
✅ **Простота** - всего несколько строк кода

## Сравнение: Библиотека vs Сервер

### Библиотека (client.js)
```javascript
const client = new K2ThinkClient();
const response = await client.chat.completions.create({...});
```
**Когда использовать:**
- В Node.js приложениях
- Для скриптов и автоматизации
- Когда не нужен HTTP API

### Сервер (index.js)
```bash
npm start
# curl http://localhost:3000/v1/chat/completions ...
```
**Когда использовать:**
- Для веб-приложений (фронтенд)
- Для интеграции с другими сервисами
- Когда нужен HTTP REST API

## Тестирование

```bash
node test_library.js
```

## Примеры

Смотрите папку `examples/`:
- `simple_chat.js` - простой пример
- `conversation.js` - диалог с контекстом
- `library_usage.js` - все возможности

Запустить пример:
```bash
node examples/simple_chat.js
```
