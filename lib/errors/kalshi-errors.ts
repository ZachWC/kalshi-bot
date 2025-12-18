export class KalshiAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'KalshiAPIError'
  }
}

export function handleKalshiError(error: any): never {
  if (error.message?.includes('unauthorized') || error.message?.includes('invalid')) {
    throw new KalshiAPIError('Invalid Kalshi API credentials', 'INVALID_CREDENTIALS', 401)
  }

  if (error.message?.includes('insufficient funds')) {
    throw new KalshiAPIError('Insufficient funds in Kalshi account', 'INSUFFICIENT_FUNDS', 400)
  }

  if (error.message?.includes('rate limit')) {
    throw new KalshiAPIError('Rate limit exceeded', 'RATE_LIMIT', 429)
  }

  if (error.statusCode === 503 || error.message?.includes('timeout')) {
    throw new KalshiAPIError('Kalshi API is temporarily unavailable', 'SERVICE_UNAVAILABLE', 503)
  }

  throw new KalshiAPIError(
    error.message || 'Kalshi API error',
    'UNKNOWN_ERROR',
    error.statusCode || 500
  )
}



