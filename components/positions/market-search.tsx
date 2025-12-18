'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MarketSearchProps {
  onSelect: (market: any) => void
}

export function MarketSearch({ onSelect }: MarketSearchProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/kalshi/markets?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search markets')
      }

      setResults(data.markets || [])
    } catch (err: any) {
      setError(err.message || 'Failed to search markets')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search Kalshi markets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Button type="button" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          {results.map((market) => (
            <button
              key={market.ticker || market.market_id}
              type="button"
              onClick={() => {
                onSelect(market)
                setResults([])
                setQuery('')
              }}
              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <p className="font-semibold">{market.title || market.ticker}</p>
              <p className="text-sm text-muted-foreground">{market.ticker || market.market_id}</p>
              {market.yes_ask && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: ${(market.yes_ask * 100).toFixed(2)}%
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

