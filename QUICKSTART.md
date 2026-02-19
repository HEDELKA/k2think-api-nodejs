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

**🪙 USDT (BNB Smart Chain)**
```
0x30C93CEB10c53db8B01ae311db83C2287C431ECd
```

**🪙 USDT (TON Network)**
```
UQDUm3wVVrkcdHgqAZnEIXRbtPwt9KV52M20C6vsMiheKmKV
```

**🪙 USDT (Tron / TRC20)**
```
TJLpsWFGkr26hbpRdHxHwMMzNjUECWKSQc
```

**🪙 USDT (Ethereum)**
```
0x80dCc2DA8ad2A8283F63AAaD94dD490373a48885
```

**🪙 TON (TON Network)**
```
UQDUm3wVVrkcdHgqAZnEIXRbtPwt9KV52M20C6vsMiheKmKV
```
