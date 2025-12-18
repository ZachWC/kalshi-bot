'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Trade } from '@/types/trade'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/trades' 
        : `/api/trades?type=${filter}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setTrades(data.trades || [])
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const totalPnl = trades
    .filter(t => t.trade_type === 'sell' && t.profit_loss !== null)
    .reduce((sum, t) => sum + (t.profit_loss || 0), 0)

  const buyCount = trades.filter(t => t.trade_type === 'buy').length
  const sellCount = trades.filter(t => t.trade_type === 'sell').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Trade History</h1>
        <p className="text-muted-foreground mt-2">
          View all your buy and sell transactions
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('buy')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'buy'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Buys
        </button>
        <button
          onClick={() => setFilter('sell')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'sell'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sells
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No trades found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Date</th>
                      <th className="text-left p-3 text-sm font-semibold">Market</th>
                      <th className="text-left p-3 text-sm font-semibold">Type</th>
                      <th className="text-right p-3 text-sm font-semibold">Shares</th>
                      <th className="text-right p-3 text-sm font-semibold">Price</th>
                      <th className="text-right p-3 text-sm font-semibold">Total</th>
                      <th className="text-right p-3 text-sm font-semibold">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm font-medium">{trade.market_id}</td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.trade_type === 'buy'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {trade.trade_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right">{trade.shares}</td>
                        <td className="p-3 text-sm text-right">
                          ${(trade.price * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 text-sm text-right">
                          ${trade.total_amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {trade.profit_loss !== null ? (
                            <span
                              className={
                                trade.profit_loss >= 0
                                  ? 'text-green-600 font-semibold'
                                  : 'text-red-600 font-semibold'
                              }
                            >
                              {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-muted-foreground">Total trades: </span>
                    <span className="font-semibold">{trades.length}</span>
                    <span className="text-muted-foreground ml-4">
                      ({buyCount} buys, {sellCount} sells)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total P&L: </span>
                    <span
                      className={`font-semibold ${
                        totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



