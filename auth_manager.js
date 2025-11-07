const axios = require('axios');

class AuthManager {
  constructor(apiBase) {
    this.apiBase = apiBase;
    this.authToken = null;
    this.tokenExpiration = null;
    this.authCredentials = null;
  }

  // Method to store credentials for automatic re-authentication
  setCredentials(email, password) {
    this.authCredentials = { email, password };
  }

  // Method to authenticate and get token
  async authenticate(email, password) {
    try {
      const response = await axios.post(
        `${this.apiBase}/api/v1/auths/signin`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          proxy: false  // Disable proxy to avoid HTTP/HTTPS issues
        }
      );

      // Assuming the response contains the token
      // Adjust based on actual API response structure
      this.authToken = response.data.token || response.data.access_token || response.data.data?.token;
      
      // Calculate expiration time (assuming standard JWT expiration)
      // If we know the expiration from response, use it; otherwise assume 1 hour
      if (response.data.expires_in) {
        this.tokenExpiration = new Date(Date.now() + (response.data.expires_in * 1000));
      } else {
        // 59 minutes default expiration
        this.tokenExpiration = new Date(Date.now() + (59 * 60 * 1000));
      }
      
      return response.data;
    } catch (error) {
      console.error('Authentication failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Authentication failed');
    }
  }

  // Method to get a valid token (refresh if needed)
  async getValidToken() {
    // If we don't have credentials, we can't authenticate
    if (!this.authCredentials) {
      throw new Error('No authentication credentials available for re-authentication');
    }
    
    // If we don't have a token or it's expired, authenticate
    if (!this.authToken || (this.tokenExpiration && this.tokenExpiration <= new Date())) {
      console.log('Token missing or expired, authenticating...');
      await this.authenticate(this.authCredentials.email, this.authCredentials.password);
    }
    
    return this.authToken;
  }

  // Method to make authenticated requests with automatic retry on auth failure
  async makeAuthenticatedRequest(url, method = 'GET', data = null, headers = {}) {
    let token = await this.getValidToken();
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      proxy: false  // Disable proxy to avoid HTTP/HTTPS issues
    };

    // Add data for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      // Check if the error is due to authentication (401 or 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Authentication failed, re-authenticating and retrying request...');
        
        // Clear the invalid token
        this.authToken = null;
        this.tokenExpiration = null;
        
        // Re-authenticate to get a new token
        await this.authenticate(this.authCredentials.email, this.authCredentials.password);
        
        // Get the new token
        const newToken = await this.getValidToken();
        
        // Retry the request with the new token
        config.headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await axios(config);
        return retryResponse;
      }
      
      // Re-throw other errors
      throw error;
    }
  }
}

module.exports = AuthManager;