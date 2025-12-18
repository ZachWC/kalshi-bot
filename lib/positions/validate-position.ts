export function validatePosition(inputs: {
  market_id?: string
  buy_amount?: number
  target_sell_pct?: number
}) {
  const errors: string[] = []

  if (!inputs.market_id || inputs.market_id.trim() === '') {
    errors.push('Market ID is required')
  }

  if (!inputs.buy_amount || inputs.buy_amount <= 0) {
    errors.push('Buy amount must be greater than 0')
  }

  if (inputs.buy_amount && inputs.buy_amount < 0.01) {
    errors.push('Buy amount must be at least $0.01')
  }

  if (!inputs.target_sell_pct || inputs.target_sell_pct <= 0 || inputs.target_sell_pct > 100) {
    errors.push('Target sell percentage must be between 0 and 100')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

