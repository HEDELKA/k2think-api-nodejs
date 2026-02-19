const axios = require('axios');
const https = require('https');
const AccountManager = require('./lib/account_manager');
const AccountRotator = require('./lib/account_rotator');

// HTTPS agent to bypass proxy issues
const httpsAgent = new https.Agent({ rejectUnauthorized: true });
const axiosInstance = axios.create({ httpsAgent, proxy: false });

/**
 * K2Think Multi-Account Client
 * Automatic account rotation for rate limit avoidance
 */
class K2ThinkMultiClient {
  constructor(options = {}) {
    this.apiBase = options.apiBase || 'https://www.k2think.ai';
    this.defaultModel = options.model || 'MBZUAI-IFM/K2-Think-v2';
    
    // Initialize account manager and rotator
    this.manager = new AccountManager();
    this.rotator = new AccountRotator({ manager: this.manager });
    
    // Update settings from options
    if (options.settings) {
      this.manager.updateSettings(options.settings);
      this.rotator.settings = this.manager.getSettings();
    }

    // Track last response
    this._lastResponse = null;
    this._lastAccountId = null;
  }

  /**
   * Make authenticated request with automatic account rotation
   */
  async _makeRequest(endpoint, method, data = null, account = null) {
    // Get account if not provided
    let currentAccount = account;
    if (!currentAccount) {
      currentAccount = this.rotator.getNextAccount();
      
      if (!currentAccount) {
        const error = new Error('No available accounts. All accounts may be rate-limited or inactive.');
        error.code = 'NO_AVAILABLE_ACCOUNTS';
        throw error;
      }
    }

    // Mark account as busy
    this.rotator.markBusy(currentAccount.id);
    this._lastAccountId = currentAccount.id;

    try {
      // Get valid token for this account
      const token = await this._authenticate(currentAccount);

      const config = {
        method,
        url: `${this.apiBase}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
      }

      const response = await axiosInstance(config);
      
      // Track successful request
      this.rotator.trackRequest(currentAccount.id);
      this.rotator.markSuccess(currentAccount.id);
      
      // Mark account as free
      this.rotator.markFree(currentAccount.id);
      
      // Store response info
      this._lastResponse = response.data;
      
      return response.data;
    } catch (error) {
      // Track failed request
      this.rotator.markFailed(currentAccount.id, error);
      this.rotator.markFree(currentAccount.id);
      
      // Handle rate limit - try with next account
      if (error.response?.status === 429 || error.response?.status === 403) {
        console.log(`Account ${currentAccount.id} rate limited. Trying next account...`);
        
        // Mark account as rate-limited in manager
        try {
          this.manager.updateAccount(currentAccount.id, { status: 'rate-limited' });
        } catch (e) {}
        
        // Try with next account (with retry limit)
        const retryCount = options.retryCount || 0;
        const maxRetries = this.rotator.settings.maxRetries || 3;
        
        if (retryCount < maxRetries) {
          const nextAccount = this.rotator.getNextAccount();
          if (nextAccount) {
            return this._makeRequest(endpoint, method, data, nextAccount, { retryCount: retryCount + 1 });
          }
        }
        
        const rateLimitError = new Error('All accounts rate limited');
        rateLimitError.code = 'ALL_ACCOUNTS_RATE_LIMITED';
        rateLimitError.originalError = error;
        throw rateLimitError;
      }
      
      throw error;
    }
  }

  /**
   * Authenticate with K2Think API
   */
  async _authenticate(account) {
    // Simple in-memory token cache could be added here
    // For now, authenticate on each request
    try {
      const response = await axiosInstance.post(
        `${this.apiBase}/api/v1/auths/signin`,
        { email: account.email, password: account.password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      return response.data.token;
    } catch (error) {
      if (error.response?.status === 401) {
        // Invalid credentials
        try {
          this.manager.updateAccount(account.id, { status: 'invalid' });
        } catch (e) {}
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Chat completions API (OpenAI compatible)
   */
  async createChatCompletion(options) {
    const {
      model = this.defaultModel,
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

    const response = await this._makeRequest(
      '/api/chat/completions',
      'POST',
      payload
    );

    // Add account info to response
    if (this._lastAccountId) {
      response._accountId = this._lastAccountId;
    }

    return response;
  }

  /**
   * List available models
   */
  async listModels() {
    // Use first available account for this operation
    const account = this.rotator.getNextAccount();
    
    if (!account) {
      throw new Error('No available accounts');
    }

    const response = await this._makeRequest(
      '/api/models',
      'GET',
      null,
      account
    );

    const modelsData = response.data || (Array.isArray(response) ? response : []);

    return {
      object: 'list',
      data: modelsData.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: model.owned_by || 'k2think',
        name: model.name,
        status: model.status
      }))
    };
  }

  /**
   * OpenAI-compatible API structure
   */
  get chat() {
    return {
      completions: {
        create: this.createChatCompletion.bind(this)
      }
    };
  }

  get models() {
    return {
      list: this.listModels.bind(this)
    };
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      manager: this.manager.getStatistics(),
      rotator: this.rotator.getStats(),
      lastRequest: {
        accountId: this._lastAccountId,
        timestamp: this._lastResponse ? new Date().toISOString() : null
      }
    };
  }

  /**
   * Get detailed account statistics
   */
  getAccountStats() {
    return this.rotator.getStats();
  }

  /**
   * Reset all rate limits
   */
  resetRateLimits() {
    this.rotator.resetRateLimits();
    console.log('Rate limits reset for all accounts');
  }

  /**
   * Add new account
   */
  async addAccount(options) {
    return this.manager.addAccount(options);
  }

  /**
   * Remove account
   */
  removeAccount(accountId) {
    return this.manager.removeAccount(accountId);
  }

  /**
   * List accounts
   */
  listAccounts(options = {}) {
    return this.manager.listAccounts(options);
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.manager.updateSettings(settings);
    this.rotator.settings = this.manager.getSettings();
    return this.rotator.settings;
  }
}

module.exports = K2ThinkMultiClient;
