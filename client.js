const axios = require('axios');

/**
 * K2Think AI Client - Use K2Think like OpenAI SDK
 * No server needed, direct API calls with automatic authentication
 */
class K2ThinkClient {
  constructor(options = {}) {
    this.email = options.email || process.env.K2THINK_EMAIL;
    this.password = options.password || process.env.K2THINK_PASSWORD;
    this.apiBase = options.apiBase || process.env.K2THINK_API_BASE || 'https://www.k2think.ai';
    
    this.authToken = null;
    this.tokenExpiration = null;
    
    if (!this.email || !this.password) {
      throw new Error('K2Think credentials required. Pass {email, password} or set K2THINK_EMAIL and K2THINK_PASSWORD environment variables.');
    }
    
    // OpenAI-style API structure
    this.chat = {
      completions: {
        create: this._createChatCompletion.bind(this)
      }
    };
    
    this.models = {
      list: this._listModels.bind(this)
    };
  }
  
  /**
   * Authenticate with K2Think API
   */
  async _authenticate() {
    try {
      const response = await axios.post(
        `${this.apiBase}/api/v1/auths/signin`,
        { email: this.email, password: this.password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          proxy: false
        }
      );
      
      this.authToken = response.data.token;
      
      if (response.data.expires_in) {
        this.tokenExpiration = new Date(Date.now() + (response.data.expires_in * 1000));
      } else {
        this.tokenExpiration = new Date(Date.now() + (59 * 60 * 1000));
      }
      
      return this.authToken;
    } catch (error) {
      throw new Error(`K2Think authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  }
  
  /**
   * Get valid token, refresh if needed
   */
  async _getValidToken() {
    if (!this.authToken || (this.tokenExpiration && this.tokenExpiration <= new Date())) {
      await this._authenticate();
    }
    return this.authToken;
  }
  
  /**
   * Make authenticated request with auto-retry on auth failure
   */
  async _makeRequest(url, method, data = null) {
    const token = await this._getValidToken();
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      proxy: false
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      // Retry once on auth failure
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        this.authToken = null;
        this.tokenExpiration = null;
        
        const newToken = await this._getValidToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        
        const retryResponse = await axios(config);
        return retryResponse.data;
      }
      
      throw error;
    }
  }
  
  /**
   * Create chat completion (OpenAI compatible)
   * @param {Object} options - Chat completion options
   * @param {string} options.model - Model to use (default: MBZUAI-IFM/K2-Think)
   * @param {Array} options.messages - Array of message objects
   * @param {number} options.temperature - Temperature (0-2)
   * @param {number} options.max_tokens - Max tokens to generate
   * @param {boolean} options.stream - Stream response (not yet supported)
   */
  async _createChatCompletion(options) {
    const { 
      model = 'MBZUAI-IFM/K2-Think', 
      messages, 
      temperature, 
      max_tokens, 
      stream = false 
    } = options;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array is required');
    }
    
    const payload = {
      stream,
      model,
      messages,
      ...(temperature !== undefined && { temperature }),
      ...(max_tokens && { max_tokens })
    };
    
    return await this._makeRequest(
      `${this.apiBase}/api/chat/completions`,
      'POST',
      payload
    );
  }
  
  /**
   * List available models (OpenAI compatible)
   */
  async _listModels() {
    const response = await this._makeRequest(
      `${this.apiBase}/api/v1/models`,
      'GET'
    );
    
    const models = Array.isArray(response) ? response : (response.data || []);
    
    return {
      object: 'list',
      data: models.map(model => ({
        id: model.id || model.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: model.owned_by || 'k2think'
      }))
    };
  }
}

module.exports = K2ThinkClient;
