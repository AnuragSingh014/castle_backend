// Investor API service

const API_BASE_URL = 'http://localhost:5000/api/investor-dashboard';
const AUTH_BASE_URL = 'http://localhost:5000/api/investor-auth';

class InvestorApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.authUrl = AUTH_BASE_URL;
  }

  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    return this.makeRequest(`${this.authUrl}/signup`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.makeRequest(`${this.authUrl}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async getInvestorProfile(investorId) {
    return this.makeRequest(`${this.authUrl}/investors/${investorId}`);
  }

  // Data methods
  async getInvestorData(investorId) {
    return this.makeRequest(`/${investorId}`);
  }

  async saveComponentData(investorId, component, data) {
    return this.makeRequest(`/${investorId}/component/${component}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteInvestorData(investorId) {
    return this.makeRequest(`/${investorId}`, {
      method: 'DELETE'
    });
  }

  // Add these methods to your existing InvestorApiService class

// Investment Portfolio API methods
async getInvestmentPortfolio(investorId) {
  return this.makeRequest(`/${investorId}/investments`);
}

async addInvestment(investorId, investmentData) {
  return this.makeRequest(`/${investorId}/investments`, {
    method: 'POST',
    body: JSON.stringify(investmentData)
  });
}

async updateInvestment(investorId, investmentId, investmentData) {
  return this.makeRequest(`/${investorId}/investments/${investmentId}`, {
    method: 'PUT',
    body: JSON.stringify(investmentData)
  });
}

async deleteInvestment(investorId, investmentId) {
  return this.makeRequest(`/${investorId}/investments/${investmentId}`, {
    method: 'DELETE'
  });
}


}

// Create and export a singleton instance
const investorApi = new InvestorApiService();
export default investorApi;
