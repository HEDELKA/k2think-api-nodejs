const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const AuthManager = require('./auth_manager');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize auth manager
const authManager = new AuthManager(process.env.K2THINK_API_BASE || 'https://www.k2think.ai');

// Auto-login with credentials from environment variables on startup
if (process.env.K2THINK_EMAIL && process.env.K2THINK_PASSWORD) {
  authManager.setCredentials(process.env.K2THINK_EMAIL, process.env.K2THINK_PASSWORD);
  console.log('Auto-login configured with credentials from environment');
} else {
  console.warn('Warning: K2THINK_EMAIL and K2THINK_PASSWORD not set in .env file');
  console.warn('API will not work without valid credentials');
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Chat completion endpoint - mirrors OpenAI's API
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature = 1, max_tokens, stream = false } = req.body;
    
    // Prepare payload for K2Think API (uses /api/chat/completions not /api/v1/chat/completions)
    const k2thinkPayload = {
      stream: stream,
      model: model || 'MBZUAI-IFM/K2-Think',
      messages: messages,
      ...(temperature !== undefined && { temperature: temperature }),
      ...(max_tokens && { max_tokens: max_tokens })
    };

    // Make authenticated request using auth manager
    const response = await authManager.makeAuthenticatedRequest(
      `${process.env.K2THINK_API_BASE || 'https://www.k2think.ai'}/api/chat/completions`,
      'POST',
      k2thinkPayload,
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    );

    // K2Think API already returns OpenAI-compatible format, just pass it through
    res.status(200).json(response.data);
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

// List models endpoint - returns available K2Think models
app.get('/v1/models', async (req, res) => {
  try {
    const response = await authManager.makeAuthenticatedRequest(
      `${process.env.K2THINK_API_BASE || 'https://www.k2think.ai'}/api/v1/models`,
      'GET',
      null,
      {
        'Accept': 'application/json'
      }
    );
    
    // K2Think returns array of models, transform to OpenAI format
    const models = Array.isArray(response.data) ? response.data : (response.data.data || []);
    
    const openAIModels = {
      object: 'list',
      data: models.map(model => ({
        id: model.id || model.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: model.owned_by || 'k2think'
      }))
    };
    
    res.status(200).json(openAIModels);
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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'K2Think AI API Proxy with Auto-Auth',
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
  console.log(`K2Think AI API Proxy server with auto-authentication is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}`);
});

module.exports = server;