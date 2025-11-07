# Quick Start - 3 шага

## 1. Настройте credentials

Отредактируйте `.env`:
```bash
K2THINK_EMAIL=ваш-email@example.com
K2THINK_PASSWORD=ваш-пароль
```

## 2. Запустите сервер

```bash
npm start
```

## 3. Используйте как OpenAI API

```bash
# Простой вопрос
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [{"role": "user", "content": "Привет!"}]
  }'

# Диалог с контекстом
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [
      {"role": "user", "content": "Меня зовут Иван"},
      {"role": "assistant", "content": "Приятно познакомиться, Иван!"},
      {"role": "user", "content": "Как меня зовут?"}
    ]
  }'
```

**Вот и всё!** Авторизация, обновление токенов - всё происходит автоматически.

## Тестирование

```bash
node simple_test.js
```

## Python пример

```python
import requests

response = requests.post('http://localhost:3000/v1/chat/completions', json={
    "model": "MBZUAI-IFM/K2-Think",
    "messages": [{"role": "user", "content": "Привет!"}]
})

print(response.json()["choices"][0]["message"]["content"])
```

## Особенности

✅ **Никакой ручной авторизации** - просто запустите и используйте  
✅ **Сохранение контекста** - многоходовые диалоги работают  
✅ **OpenAI-совместимый** - можно использовать клиентские библиотеки OpenAI  
✅ **Автоматическое обновление токенов** - работает без перебоев

## Поддержать проект

Если проект оказался полезным, можете поддержать разработку:

**USDT (TON Network)**
```
UQABR7EgocAi1K4VH3Fg4FHyhmNLC9FPoYuED3YkBJZAFelt
```

**USDT (TRC20)**
```
TKSvGezbzvEz9XpKANUUZE89ej436eiqmd
```
