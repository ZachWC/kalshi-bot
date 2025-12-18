interface KalshiConfig {
  apiKey: string
  apiSecret: string
  baseUrl?: string
}

interface MarketOrder {
  market_id: string
  side: 'yes' | 'no'
  quantity: number
  type?: 'market' | 'limit'
  limit_price?: number
}

interface OrderResponse {
  order_id?: string
  avg_price?: number
  filled_quantity?: number
  [key: string]: any
}

interface KalshiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export class KalshiAPI {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string

  constructor(config: KalshiConfig) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.baseUrl = config.baseUrl || process.env.KALSHI_API_BASE_URL || 'https://api.kalshi.com/trade-api/v2'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Kalshi uses basic auth with API key as username and secret as password
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(errorData.message || `Kalshi API error: ${response.statusText}`)
    }

    const data: KalshiResponse<T> = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'Kalshi API error')
    }

    return data.data as T
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccountBalance()
      return true
    } catch (error) {
      return false
    }
  }

  async getAccountBalance() {
    return this.request('/portfolio/balance')
  }

  async getMarket(marketId: string) {
    return this.request(`/markets/${marketId}`)
  }

  async searchMarkets(query: string) {
    return this.request(`/markets?search=${encodeURIComponent(query)}`)
  }

  async getMarketPrice(marketId: string): Promise<number> {
    const market = await this.getMarket(marketId)
    // Kalshi returns yes_ask and no_ask prices
    // For YES contracts, we use yes_ask
    return market.yes_ask || 0
  }

  async createMarketOrder(order: MarketOrder): Promise<OrderResponse> {
    return this.request<OrderResponse>('/portfolio/orders', {
      method: 'POST',
      body: JSON.stringify({
        market_id: order.market_id,
        side: order.side,
        type: order.type || 'market',
        quantity: order.quantity,
        ...(order.limit_price && { limit_price: order.limit_price }),
      }),
    })
  }

  async getOrders(marketId?: string) {
    const query = marketId ? `?market_id=${marketId}` : ''
    return this.request(`/portfolio/orders${query}`)
  }

  async getPositions() {
    return this.request('/portfolio/positions')
  }
}

