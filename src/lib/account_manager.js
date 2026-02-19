const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const DATA_FILE = path.join(__dirname, '../../data/accounts.json');
const ENCRYPTION_KEY_FILE = path.join(__dirname, '../../data/.encryption_key');

/**
 * Account Manager - CRUD operations for K2Think accounts
 * Stores accounts in JSON file with encrypted passwords
 */
class AccountManager {
  constructor(options = {}) {
    this.dataFile = options.dataFile || DATA_FILE;
    this.encryptionKey = options.encryptionKey || this._loadOrGenerateKey();
    this.data = this._loadData();
  }

  /**
   * Load or generate encryption key
   */
  _loadOrGenerateKey() {
    // Try environment variable first
    if (process.env.ACCOUNT_ENCRYPTION_KEY) {
      return process.env.ACCOUNT_ENCRYPTION_KEY;
    }

    // Try load from file
    if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
      return fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf8').trim();
    }

    // Generate new key
    const newKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(ENCRYPTION_KEY_FILE, newKey, 'utf8');
    console.log('Generated new encryption key. Store ACCOUNT_ENCRYPTION_KEY env var for portability.');
    return newKey;
  }

  /**
   * Load data from JSON file
   */
  _loadData() {
    if (!fs.existsSync(this.dataFile)) {
      // Create default data structure
      const defaultData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accounts: [],
        settings: {
          rotationStrategy: 'round-robin',
          rateLimitPerAccount: 10,
          rateLimitWindowMs: 60000,
          cooldownMs: 30000,
          maxRetries: 3,
          autoValidateOnAdd: true
        }
      };
      this._saveData(defaultData);
      return defaultData;
    }

    const content = fs.readFileSync(this.dataFile, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Save data to JSON file
   */
  _saveData(data = null) {
    const dataToSave = data || this.data;
    dataToSave.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.dataFile, JSON.stringify(dataToSave, null, 2), 'utf8');
  }

  /**
   * Encrypt password using AES-256-GCM
   */
  _encryptPassword(password) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(password, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    // Format: iv:encrypted:authTag
    return `${iv.toString('base64')}:${encrypted}:${authTag}`;
  }

  /**
   * Decrypt password
   */
  _decryptPassword(encryptedPassword) {
    try {
      const parts = encryptedPassword.split(':');
      const iv = Buffer.from(parts[0], 'base64');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'base64');

      const key = Buffer.from(this.encryptionKey, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt password: ' + error.message);
    }
  }

  /**
   * Generate unique account ID
   */
  _generateId() {
    return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add new account
   * @param {Object} options - Account options
   * @param {string} options.email - Account email
   * @param {string} options.password - Account password
   * @param {string} [options.name] - Optional account name
   * @param {number} [options.priority] - Priority (lower = higher priority)
   * @param {boolean} [options.validate] - Validate credentials on add
   * @returns {Promise<Object>} Created account
   */
  async addAccount(options) {
    const { email, password, name, priority = 1, validate = true } = options;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check for duplicate email
    const existing = this.data.accounts.find(a => a.email === email);
    if (existing) {
      throw new Error('Account with this email already exists');
    }

    const account = {
      id: this._generateId(),
      email,
      password: this._encryptPassword(password),
      encryptionMethod: 'aes-256-gcm',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        lastRequestAt: null
      },
      rateLimit: {
        requestsThisMinute: 0,
        windowStart: new Date().toISOString(),
        blockedUntil: null
      },
      priority,
      metadata: {
        name: name || email,
        tags: []
      }
    };

    // Validate credentials if requested
    if (validate) {
      console.log(`Validating account ${email}...`);
      const isValid = await this._validateCredentials(email, password);
      if (!isValid) {
        throw new Error('Invalid credentials for this account');
      }
      console.log(`✓ Account ${email} validated successfully`);
    }

    this.data.accounts.push(account);
    this._saveData();

    console.log(`Added account: ${account.id} (${email})`);
    return this._sanitizeAccount(account);
  }

  /**
   * Validate credentials against K2Think API
   */
  async _validateCredentials(email, password) {
    try {
      const response = await axios.post(
        'https://www.k2think.ai/api/v1/auths/signin',
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      return !!response.data.token;
    } catch (error) {
      console.error(`Validation failed for ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Remove account by ID
   */
  removeAccount(accountId) {
    const index = this.data.accounts.findIndex(a => a.id === accountId);
    if (index === -1) {
      throw new Error(`Account ${accountId} not found`);
    }

    const removed = this.data.accounts.splice(index, 1)[0];
    this._saveData();

    console.log(`Removed account: ${accountId} (${removed.email})`);
    return true;
  }

  /**
   * List all accounts
   * @param {Object} options - List options
   * @param {boolean} [options.includeStats=true] - Include statistics
   * @param {boolean} [options.includeSensitive=false] - Include emails/passwords
   * @returns {Array} List of accounts
   */
  listAccounts(options = {}) {
    const { includeStats = true, includeSensitive = false } = options;

    return this.data.accounts.map(account => {
      const sanitized = this._sanitizeAccount(account, includeStats, includeSensitive);
      return sanitized;
    });
  }

  /**
   * Get account by ID
   */
  getAccount(accountId, includeSensitive = false) {
    const account = this.data.accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    return this._sanitizeAccount(account, true, includeSensitive);
  }

  /**
   * Get account credentials for API use
   */
  getAccountCredentials(accountId) {
    const account = this.data.accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (account.status === 'blocked' || account.status === 'invalid') {
      throw new Error(`Account ${accountId} is ${account.status}`);
    }

    return {
      id: account.id,
      email: account.email,
      password: this._decryptPassword(account.password)
    };
  }

  /**
   * Update account
   */
  updateAccount(accountId, updates) {
    const account = this.data.accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const allowedFields = ['name', 'priority', 'status', 'metadata'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'name' && updates.metadata) {
          account.metadata.name = updates.name;
        } else if (field === 'priority') {
          account.priority = updates.priority;
        } else if (field === 'status') {
          account.status = updates.status;
        } else if (field === 'metadata') {
          account.metadata = { ...account.metadata, ...updates.metadata };
        }
      }
    }

    this._saveData();
    return this._sanitizeAccount(account);
  }

  /**
   * Validate account credentials
   */
  async validateAccount(accountId) {
    const account = this.data.accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const credentials = this.getAccountCredentials(accountId);
    const isValid = await this._validateCredentials(credentials.email, credentials.password);

    if (!isValid) {
      account.status = 'invalid';
      this._saveData();
    }

    return isValid;
  }

  /**
   * Sanitize account for output (remove sensitive data)
   */
  _sanitizeAccount(account, includeStats = true, includeSensitive = false) {
    const sanitized = {
      id: account.id,
      status: account.status,
      priority: account.priority,
      metadata: account.metadata,
      createdAt: account.createdAt,
      lastUsed: account.lastUsed
    };

    if (includeSensitive) {
      sanitized.email = account.email;
    } else {
      // Mask email
      const parts = account.email.split('@');
      sanitized.email = `${parts[0].substring(0, 3)}***@${parts[1]}`;
    }

    if (includeStats) {
      sanitized.stats = account.stats;
      sanitized.rateLimit = account.rateLimit;
    }

    return sanitized;
  }

  /**
   * Get settings
   */
  getSettings() {
    return { ...this.data.settings };
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this._saveData();
    return this.getSettings();
  }

  /**
   * Get statistics across all accounts
   */
  getStatistics() {
    const accounts = this.data.accounts;
    const active = accounts.filter(a => a.status === 'active').length;
    const totalRequests = accounts.reduce((sum, a) => sum + a.stats.totalRequests, 0);
    const successfulRequests = accounts.reduce((sum, a) => sum + a.stats.successfulRequests, 0);
    const rateLimitHits = accounts.reduce((sum, a) => sum + a.stats.rateLimitHits, 0);

    return {
      totalAccounts: accounts.length,
      activeAccounts: active,
      inactiveAccounts: accounts.length - active,
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      rateLimitHits,
      successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset rate limits for all accounts
   */
  resetRateLimits() {
    for (const account of this.data.accounts) {
      account.rateLimit.requestsThisMinute = 0;
      account.rateLimit.windowStart = new Date().toISOString();
      account.rateLimit.blockedUntil = null;
      if (account.status === 'rate-limited') {
        account.status = 'active';
      }
    }
    this._saveData();
    console.log('Rate limits reset for all accounts');
  }
}

module.exports = AccountManager;
