const AccountManager = require('./account_manager');

/**
 * Account Rotator - Automatic account switching for rate limit avoidance
 * Supports multiple rotation strategies: round-robin, least-used, random, priority
 */
class AccountRotator {
  constructor(options = {}) {
    this.manager = options.manager || new AccountManager();
    this.settings = this.manager.getSettings();
    
    // Runtime state
    this.currentIndex = 0;
    this.busyAccounts = new Set();
    this.lastRequestTime = new Map(); // accountId -> timestamp
  }

  /**
   * Get next available account based on rotation strategy
   * @returns {Object|null} Account credentials or null if none available
   */
  getNextAccount() {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: false });
    const activeAccounts = accounts.filter(a => this._isAccountAvailable(a));

    if (activeAccounts.length === 0) {
      return null;
    }

    let selected;
    const strategy = this.settings.rotationStrategy;

    switch (strategy) {
      case 'round-robin':
        selected = this._selectRoundRobin(activeAccounts);
        break;
      case 'least-used':
        selected = this._selectLeastUsed(activeAccounts);
        break;
      case 'random':
        selected = this._selectRandom(activeAccounts);
        break;
      case 'priority':
        selected = this._selectPriority(activeAccounts);
        break;
      default:
        selected = this._selectRoundRobin(activeAccounts);
    }

    // Get full credentials
    return this.manager.getAccountCredentials(selected.id);
  }

  /**
   * Check if account is available for use
   */
  _isAccountAvailable(account) {
    // Check if account is active
    if (account.status !== 'active') {
      return false;
    }

    // Check if not busy
    if (this.busyAccounts.has(account.id)) {
      return false;
    }

    // Check rate limit
    if (this._isRateLimited(account)) {
      return false;
    }

    return true;
  }

  /**
   * Check if account is rate limited
   */
  _isRateLimited(account) {
    const rateLimit = account.rateLimit;
    const now = new Date();
    const windowStart = new Date(rateLimit.windowStart);
    const windowAge = now - windowStart;

    // Reset window if expired
    if (windowAge >= this.settings.rateLimitWindowMs) {
      return false;
    }

    // Check if blocked until time has passed
    if (rateLimit.blockedUntil) {
      const blockedUntil = new Date(rateLimit.blockedUntil);
      if (now < blockedUntil) {
        return true;
      }
    }

    // Check request count
    return rateLimit.requestsThisMinute >= this.settings.rateLimitPerAccount;
  }

  /**
   * Round-robin selection
   */
  _selectRoundRobin(accounts) {
    // Wrap around index
    if (this.currentIndex >= accounts.length) {
      this.currentIndex = 0;
    }

    const account = accounts[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % accounts.length;
    return account;
  }

  /**
   * Least-used selection (fewest requests in current window)
   */
  _selectLeastUsed(accounts) {
    return accounts.reduce((min, account) => {
      const requests = account.rateLimit?.requestsThisMinute || 0;
      const minRequests = min.rateLimit?.requestsThisMinute || 0;
      return requests < minRequests ? account : min;
    });
  }

  /**
   * Random selection
   */
  _selectRandom(accounts) {
    const index = Math.floor(Math.random() * accounts.length);
    return accounts[index];
  }

  /**
   * Priority selection (lowest priority number = highest priority)
   */
  _selectPriority(accounts) {
    return accounts.reduce((min, account) => {
      return (account.priority || 999) < (min.priority || 999) ? account : min;
    });
  }

  /**
   * Mark account as busy (currently processing request)
   */
  markBusy(accountId) {
    this.busyAccounts.add(accountId);
  }

  /**
   * Mark account as free (request completed)
   */
  markFree(accountId) {
    this.busyAccounts.delete(accountId);
  }

  /**
   * Track request for rate limiting
   */
  trackRequest(accountId) {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: true });
    const account = accounts.find(a => a.email === accountId || a.id === accountId);
    
    if (!account) return;

    const now = new Date();
    const windowStart = new Date(account.rateLimit?.windowStart || now);
    const windowAge = now - windowStart;

    // Reset window if expired
    if (windowAge >= this.settings.rateLimitWindowMs) {
      account.rateLimit = {
        requestsThisMinute: 1,
        windowStart: now.toISOString(),
        blockedUntil: null
      };
    } else {
      account.rateLimit.requestsThisMinute = (account.rateLimit?.requestsThisMinute || 0) + 1;

      // Check if rate limit exceeded
      if (account.rateLimit.requestsThisMinute >= this.settings.rateLimitPerAccount) {
        account.rateLimit.blockedUntil = new Date(now.getTime() + this.settings.cooldownMs).toISOString();
        
        // Update account status
        this.manager.updateAccount(account.id, { status: 'rate-limited' });
      }
    }

    // Update stats
    account.stats.totalRequests = (account.stats?.totalRequests || 0) + 1;
    account.stats.lastRequestAt = now.toISOString();
    account.lastUsed = now.toISOString();

    // Save changes
    this.manager._saveData();
    this.lastRequestTime.set(account.id, now.getTime());
  }

  /**
   * Mark request as successful
   */
  markSuccess(accountId) {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: true });
    const account = accounts.find(a => a.email === accountId || a.id === accountId);
    
    if (account) {
      account.stats.successfulRequests = (account.stats?.successfulRequests || 0) + 1;
      this.manager._saveData();
    }
  }

  /**
   * Mark request as failed
   */
  markFailed(accountId, error) {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: true });
    const account = accounts.find(a => a.email === accountId || a.id === accountId);
    
    if (account) {
      account.stats.failedRequests = (account.stats?.failedRequests || 0) + 1;
      
      // Check if rate limit error
      if (error?.status === 429 || error?.code === 'RATE_LIMIT') {
        account.stats.rateLimitHits = (account.stats?.rateLimitHits || 0) + 1;
      }
      
      this.manager._saveData();
    }
  }

  /**
   * Check if specific account is rate limited
   */
  isRateLimited(accountId) {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: false });
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) return false;
    
    return this._isRateLimited(account);
  }

  /**
   * Get time until account is available (ms)
   */
  getTimeUntilAvailable(accountId) {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: false });
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) return 0;

    if (account.rateLimit?.blockedUntil) {
      const blockedUntil = new Date(account.rateLimit.blockedUntil).getTime();
      const now = Date.now();
      return Math.max(0, blockedUntil - now);
    }

    return 0;
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const accounts = this.manager.listAccounts({ includeStats: true, includeSensitive: false });
    const now = Date.now();

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => this._isAccountAvailable(a)).length,
      busyAccounts: this.busyAccounts.size,
      rateLimitedAccounts: accounts.filter(a => this._isRateLimited(a)).length,
      strategy: this.settings.rotationStrategy,
      settings: {
        rateLimitPerAccount: this.settings.rateLimitPerAccount,
        rateLimitWindowMs: this.settings.rateLimitWindowMs,
        cooldownMs: this.settings.cooldownMs
      },
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.metadata?.name || a.email,
        status: a.status,
        isBusy: this.busyAccounts.has(a.id),
        isRateLimited: this._isRateLimited(a),
        requestsThisMinute: a.rateLimit?.requestsThisMinute || 0,
        totalRequests: a.stats?.totalRequests || 0,
        timeUntilAvailable: this.getTimeUntilAvailable(a.id)
      }))
    };
  }

  /**
   * Reset all rate limits
   */
  resetRateLimits() {
    this.manager.resetRateLimits();
    this.busyAccounts.clear();
    this.lastRequestTime.clear();
    this.currentIndex = 0;
  }

  /**
   * Wait until an account is available
   * @param {number} timeout - Max time to wait in ms (default: 60s)
   * @returns {Promise<Object|null>} Account credentials or null if timeout
   */
  async waitForAvailableAccount(timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const account = this.getNextAccount();
      if (account) {
        return account;
      }

      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return null;
  }
}

module.exports = AccountRotator;
