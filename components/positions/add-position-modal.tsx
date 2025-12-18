'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarketSearch } from './market-search'

interface AddPositionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddPositionModal({ open, onOpenChange, onSuccess }: AddPositionModalProps) {
  const [marketId, setMarketId] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [targetPct, setTargetPct] = useState('65')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marketPreview, setMarketPreview] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: marketId,
          buy_amount: parseFloat(buyAmount),
          target_sell_pct: parseFloat(targetPct),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create position')
      }

      // Reset form
      setMarketId('')
      setBuyAmount('')
      setTargetPct('65')
      setMarketPreview(null)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create position')
    } finally {
      setLoading(false)
    }
  }

  const handleMarketSelect = (market: any) => {
    setMarketId(market.ticker || market.market_id)
    setMarketPreview(market)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Position</DialogTitle>
          <DialogDescription>
            Create a new position that will be automatically sold when it reaches your target percentage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="market_id">Market ID</Label>
              <Input
                id="market_id"
                placeholder="NASDAQ-DEC15-B5200"
                value={marketId}
                onChange={(e) => {
                  setMarketId(e.target.value)
                  setMarketPreview(null)
                }}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter a market ID or search below
              </p>
            </div>

            <div className="space-y-2">
              <Label>Search Markets</Label>
              <MarketSearch onSelect={handleMarketSelect} />
            </div>

            {marketPreview && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <h4 className="font-semibold mb-2">Market Preview</h4>
                <p className="text-sm">{marketPreview.title || marketPreview.ticker}</p>
                {marketPreview.yes_ask && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current price: ${(marketPreview.yes_ask * 100).toFixed(2)}%
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="buy_amount">Buy Amount ($)</Label>
              <Input
                id="buy_amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_pct">Target Sell Percentage</Label>
              <Input
                id="target_pct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="65"
                value={targetPct}
                onChange={(e) => setTargetPct(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {marketPreview && buyAmount && targetPct && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <ul className="text-sm space-y-1">
                  <li>• Buying at: ~{marketPreview.yes_ask ? (marketPreview.yes_ask * 100).toFixed(1) : 'N/A'}%</li>
                  <li>• Selling at: {targetPct}%</li>
                  {marketPreview.yes_ask && (
                    <li>• Potential profit: ~{((parseFloat(targetPct) / (marketPreview.yes_ask * 100) - 1) * 100).toFixed(1)}%</li>
                  )}
                  {marketPreview.yes_ask && (
                    <li>• Estimated shares: ~{Math.floor(parseFloat(buyAmount) / marketPreview.yes_ask)}</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !marketId || !buyAmount || !targetPct}>
              {loading ? 'Creating...' : 'Buy & Monitor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

