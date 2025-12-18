'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Position } from '@/types/position'

interface PositionCardProps {
  position: Position
  onEdit?: () => void
  onForceSell?: () => void
}

export function PositionCard({ position, onEdit, onForceSell }: PositionCardProps) {
  const currentPct = position.current_price ? position.current_price * 100 : 0
  const targetPct = position.target_sell_pct
  const progress = targetPct > 0 ? Math.min((currentPct / targetPct) * 100, 100) : 0

  const currentValue = position.shares_owned && position.current_price
    ? position.shares_owned * position.current_price
    : 0
  const invested = position.buy_amount || 0
  const unrealized = currentValue - invested

  const getStatusColor = () => {
    switch (position.status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{position.market_title || position.market_id}</CardTitle>
            <CardDescription className="mt-1">{position.market_id}</CardDescription>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor()}`}>
            {position.status.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invested</p>
            <p className="font-semibold">${invested.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shares</p>
            <p className="font-semibold">{position.shares_owned || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Buy Price</p>
            <p className="font-semibold">
              {position.avg_buy_price ? `$${(position.avg_buy_price * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Price</p>
            <p className="font-semibold">
              {position.current_price ? `$${(position.current_price * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {position.status === 'active' && (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress to Target</span>
                <span className="font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Current: {currentPct.toFixed(1)}%</span>
                <span>Target: {targetPct.toFixed(1)}%</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="font-semibold">${currentValue.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                  <p className={`font-semibold ${unrealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {position.status === 'active' && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              Edit Target
            </Button>
            <Button variant="destructive" size="sm" onClick={onForceSell} className="flex-1">
              Force Sell
            </Button>
          </div>
        )}

        {position.error_message && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{position.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

