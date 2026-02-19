const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.CLAUDE_PROXY_PORT || 3001;

app.use(express.json());

// Proxy endpoint that mimics OpenAI API for Claude Code
app.post('/v1/messages', async (req, res) => {
  try {
    // Transform Claude Code request to K2Think format
    const { messages, model = 'MBZUAI-IFM/K2-Think', max_tokens, temperature } = req.body;
    
    // Call our local K2Think API
    const response = await fetch('http://localhost:3000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature
      })
    });
    
    const data = await response.json();
    
    // Transform response back to Claude format
    res.json({
      id: data.id,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: data.choices[0].message.content
        }
      ],
      model: model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: data.usage
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: {
        type: 'api_error',
        message: error.message
      }
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'Claude Code Proxy for K2Think' });
});

app.listen(PORT, () => {
  console.log(`Claude Code proxy running on port ${PORT}`);
  console.log(`Configure Claude Code to use: http://localhost:${PORT}`);
});
