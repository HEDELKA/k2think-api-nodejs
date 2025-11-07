const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios'); // Make sure this is defined
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Base URL for K2Think API - this was causing an error
const K2THINK_API_BASE = process.env.K2THINK_API_BASE || 'https://www.k2think.ai';

// Helper function to get authorization header
function getAuthHeader(req) {
  const token = req.headers.authorization || req.query.token;
  if (!token) {
    return {};
  }
  
  // Handle both 'Bearer token' and raw token formats
  const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return { Authorization: authValue };
}

// Authentication endpoint - handles sign in
app.post('/api/v1/auths/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          type: 'invalid_request_error',
          param: null,
          code: 'missing_credentials'
        }
      });
    }

    const response = await axios.post(
      `${K2THINK_API_BASE}/api/v1/auths/signin`, // Fixed variable name
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Signin error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.detail || error.message || 'Authentication failed',
        type: 'api_error',
        param: null,
        code: error.response?.status || 'internal_error'
      }
    });
  }
});

// Chat completion endpoint - mirrors OpenAI's API
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const authHeaders = getAuthHeader(req); // Fixed function name
    
    // Transform OpenAI-style request to K2Think format
    const { messages, model, temperature = 1, max_tokens, stream = false } = req.body;
    
    // Find system message or create a default one
    let systemMessage = 'You are a helpful AI assistant.';
    const userMessages = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        userMessages.push(msg);
      }
    }
    
    // Prepare payload for K2Think API
    const k2thinkPayload = {
      model: model || 'default-model', // Use provided model or default
      messages: userMessages,
      system_message: systemMessage,
      temperature: temperature,
      ...(max_tokens && { max_tokens: max_tokens }),
      stream: stream
    };

    const response = await axios.post( // Fixed undefined axios
      `${K2THINK_API_BASE}/api/v1/chat/completions`, // Fixed variable name
      k2thinkPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders // Fixed variable name
        }
      }
    );

    // Transform response to OpenAI format
    const openAIResponse = {
      id: response.data.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: response.data.created || Math.floor(Date.now() / 1000),
      model: model || 'default-model',
      choices: Array.isArray(response.data.choices) ? response.data.choices.map(choice => ({
        index: choice.index || 0,
        message: {
          role: choice.role || 'assistant',
          content: choice.content || choice.text || ''
        },
        finish_reason: choice.finish_reason || 'stop'
      })) : [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.data.content || response.data.text || JSON.stringify(response.data)
        },
        finish_reason: 'stop'
      }],
      usage: response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    res.status(response.status).json(openAIResponse);
  } catch (error) {
    console.error('Chat completion error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.detail || error.message || 'Chat completion failed',
        type: 'api_error',
        param: null,
        code: error.response?.status || 'internal_error'
      }
    });
  }
});

// Completions endpoint - mirrors OpenAI's legacy completions
app.post('/v1/completions', async (req, res) => {
  try {
    const authHeaders = getAuthHeader(req); // Fixed function name
    
    const { prompt, model, temperature = 1, max_tokens, stream = false } = req.body;
    
    const k2thinkPayload = {
      model: model || 'default-model',
      prompt: prompt,
      temperature: temperature,
      ...(max_tokens && { max_tokens: max_tokens }),
      stream: stream
    };

    const response = await axios.post( // Fixed undefined axios
      `${K2THINK_API_BASE}/api/v1/completions`, // Fixed variable name
      k2thinkPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders // Fixed variable name
        }
      }
    );

    // Transform response to OpenAI format
    const openAIResponse = {
      id: response.data.id || `cmpl-${Date.now()}`,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'default-model',
      choices: Array.isArray(response.data.choices) ? response.data.choices.map(choice => ({
        text: choice.text || choice.content || '',
        index: choice.index || 0,
        logprobs: choice.logprobs || null,
        finish_reason: choice.finish_reason || 'stop'
      })) : [{
        text: response.data.content || response.data.text || (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
        index: 0,
        logprobs: null,
        finish_reason: 'stop'
      }],
      usage: response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    res.status(response.status).json(openAIResponse);
  } catch (error) {
    console.error('Completions error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.detail || error.message || 'Completions failed',
        type: 'api_error',
        param: null,
        code: error.response?.status || 'internal_error'
      }
    });
  }
});

// List models endpoint
app.get('/v1/models', async (req, res) => {
  try {
    const authHeaders = getAuthHeader(req); // Fixed function name
    
    const response = await axios.get( // Fixed undefined axios
      `${K2THINK_API_BASE}/api/v1/models`, // Fixed variable name
      {
        headers: {
          'Accept': 'application/json',
          ...authHeaders // Fixed variable name
        }
      }
    );
    
    // Transform to OpenAI models format
    const openAIModels = {
      object: 'list',
      data: Array.isArray(response.data) ? response.data.map(modelData => ({
        id: modelData.id || modelData.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: modelData.owned_by || 'organization',
      })) : []
    };
    
    res.status(response.status).json(openAIModels);
  } catch (error) {
    console.error('Models error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.detail || error.message || 'Failed to list models',
        type: 'api_error',
        param: null,
        code: error.response?.status || 'internal_error'
      }
    });
  }
});

// Embeddings endpoint
app.post('/v1/embeddings', async (req, res) => {
  try {
    const authHeaders = getAuthHeader(req); // Fixed function name
    
    const { input, model } = req.body;
    
    const k2thinkPayload = {
      input: input,
      model: model || 'default-embedding-model'
    };

    const response = await axios.post( // Fixed undefined axios
      `${K2THINK_API_BASE}/api/v1/embeddings`, // Fixed variable name
      k2thinkPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders // Fixed variable name
        }
      }
    );

    // Transform to OpenAI embeddings format
    const openAIEmbeddings = {
      object: 'list',
      model: response.data.model || model,
      data: response.data.data || [],
      usage: response.data.usage || {
        prompt_tokens: 0,
        total_tokens: 0
      }
    };
    
    res.status(response.status).json(openAIEmbeddings);
  } catch (error) {
    console.error('Embeddings error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.detail || error.message || 'Embeddings failed',
        type: 'api_error',
        param: null,
        code: error.response?.status || 'internal_error'
      }
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'K2Think AI API Proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'api_error',
      param: null,
      code: 'internal_error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: `Endpoint ${req.originalUrl} not found`,
      type: 'api_error',
      param: null,
      code: 'not_found'
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`K2Think AI API Proxy server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}`);
});

module.exports = server;