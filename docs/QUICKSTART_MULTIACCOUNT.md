# Быстрый старт: Мультиаккаунтная система

Автоматическая ротация аккаунтов K2Think для обхода rate limits.

---

## Установка

```bash
npm install  # если ещё не установлен
```

---

## Добавление аккаунтов

### Способ 1: Быстрое добавление (рекомендуется)

```bash
node quick-add.js email@example.com пароль "Название аккаунта"
```

**Пример:**
```bash
node quick-add.js user@gmail.com MyPassword123 "Мой аккаунт"
```

### Способ 2: Интерактивный CLI

```bash
node accounts-cli.js add
```

### Способ 3: Программно

```javascript
const client = require('./client_multi');

await client.addAccount({
  email: 'user@example.com',
  password: 'password123',
  name: 'Аккаунт 1'
});
```

---

## Проверка аккаунтов

### Список всех аккаунтов
```bash
node accounts-cli.js list
```

### Статистика
```bash
node accounts-cli.js stats
```

**Вывод:**
```
=== Account Statistics ===

Total accounts:     5
Active accounts:    5
Success rate:       100.00%
```

---

## Использование

### Базовый пример

```javascript
const K2ThinkMultiClient = require('./client_multi');
const client = new K2ThinkMultiClient();

// Запрос - ротация происходит автоматически!
const response = await client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [{ role: 'user', content: 'Привет!' }]
});

console.log(`Использован аккаунт: ${response._accountId}`);
```

### Массовые запросы (автоматическая ротация)

```javascript
const client = new K2ThinkMultiClient();

for (let i = 1; i <= 20; i++) {
  const response = await client.chat.completions.create({
    model: 'MBZUAI-IFM/K2-Think-v2',
    messages: [{ role: 'user', content: `Вопрос ${i}` }]
  });
  console.log(`Запрос ${i}: аккаунт ${response._accountId}`);
}
```

---

## Настройка ротации

### Стратегии ротации

**round-robin** (по умолчанию) — аккаунты используются по кругу:
```javascript
settings: { rotationStrategy: 'round-robin' }
```

**least-used** — наименее используемый аккаунт:
```javascript
settings: { rotationStrategy: 'least-used' }
```

**random** — случайно:
```javascript
settings: { rotationStrategy: 'random' }
```

**priority** — по приоритету (меньше число = выше приоритет):
```javascript
settings: { rotationStrategy: 'priority' }
```

### Лимиты

```javascript
settings: {
  rateLimitPerAccount: 10,    // Запросов на аккаунт
  rateLimitWindowMs: 60000,   // Окно времени (1 минута)
  cooldownMs: 30000           // Пауза после лимита (30 сек)
}
```

---

## Команды CLI

| Команда | Описание |
|---------|----------|
| `node quick-add.js <email> <password> [name]` | Добавить аккаунт |
| `node accounts-cli.js list` | Список аккаунтов |
| `node accounts-cli.js stats` | Статистика |
| `node accounts-cli.js config` | Конфигурация |
| `node accounts-cli.js reset` | Сброс rate limits |
| `node accounts-cli.js remove <id>` | Удалить аккаунт |

---

## Примеры

### Пример 1: Простой запрос
```bash
node -e "
const c = require('./client_multi');
const client = new c();
client.chat.completions.create({
  model: 'MBZUAI-IFM/K2-Think-v2',
  messages: [{role:'user',content:'Привет!'}]
}).then(r => console.log(r.choices[0].message.content));
"
```

### Пример 2: Запуск теста
```bash
node tests/test_multi_account.js
```

### Пример 3: Демонстрация
```bash
node examples/multi_account_example.js
```

---

## Решение проблем

### Все аккаунты неактивны
```bash
# Сбросить статусы
node -e "
const m = require('./lib/account_manager');
const mgr = new m();
mgr.listAccounts({includeSensitive:true}).forEach(a => {
  mgr.updateAccount(a.id, {status:'active'});
});
console.log('Done');
"
```

### Rate limit
```bash
# Сбросить лимиты
node accounts-cli.js reset
```

### Добавить аккаунт не получается
Используйте `quick-add.js` вместо интерактивного CLI:
```bash
node quick-add.js email@example.com password123
```

---

## Безопасность

1. **Не коммитьте `data/accounts.json`** — содержит зашифрованные пароли
2. **Не коммитьте `data/.encryption_key`** — ключ шифрования
3. **Используйте `.gitignore`** — уже настроен для игнорирования

---

## Документация

- [MULTI_ACCOUNT.md](MULTI_ACCOUNT.md) — Полная документация
- [ACCOUNT_SCHEMA.md](ACCOUNT_SCHEMA.md) — Схема JSON

---

## Поддержка

Если проект полезен, поддержите разработку:

**USDT (TON Network)**
```
UQABR7EgocAi1K4VH3Fg4FHyhmNLC9FPoYuED3YkBJZAFelt
```

**USDT (TRC20)**
```
TKSvGezbzvEz9XpKANUUZE89ej436eiqmd
```
