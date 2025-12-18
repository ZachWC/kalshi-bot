export class KalshiAPI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || process.env.KALSHI_API_BASE_URL || 'https://api.kalshi.com/trade-api/v2';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Kalshi API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Kalshi API error');
    }

    return data.data;
  }

  async testConnection() {
    try {
      await this.getAccountBalance();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAccountBalance() {
    return this.request('/portfolio/balance');
  }

  async getMarket(marketId) {
    return this.request(`/markets/${marketId}`);
  }

  async searchMarkets(query) {
    return this.request(`/markets?search=${encodeURIComponent(query)}`);
  }

  async getMarketPrice(marketId) {
    const market = await this.getMarket(marketId);
    return market.yes_ask || 0;
  }

  async createMarketOrder(order) {
    return this.request('/portfolio/orders', {
      method: 'POST',
      body: JSON.stringify({
        market_id: order.market_id,
        side: order.side,
        type: order.type || 'market',
        quantity: order.quantity,
        ...(order.limit_price && { limit_price: order.limit_price }),
      }),
    });
  }

  async getOrders(marketId) {
    const query = marketId ? `?market_id=${marketId}` : '';
    return this.request(`/portfolio/orders${query}`);
  }

  async getPositions() {
    return this.request('/portfolio/positions');
  }
}



