'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PositionCard } from '@/components/dashboard/position-card'
import { AddPositionModal } from '@/components/positions/add-position-modal'
import type { Position } from '@/types/position'
import type { Trade } from '@/types/trade'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DashboardPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [newTargetPct, setNewTargetPct] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [positionsRes, tradesRes] = await Promise.all([
        fetch('/api/positions'),
        fetch('/api/trades'),
      ])

      const positionsData = await positionsRes.json()
      const tradesData = await tradesRes.json()

      setPositions(positionsData.positions || [])
      setTrades(tradesData.trades || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (position: Position) => {
    setSelectedPosition(position)
    setNewTargetPct(position.target_sell_pct.toString())
    setEditModalOpen(true)
  }

  const handleUpdateTarget = async () => {
    if (!selectedPosition || !newTargetPct) return

    const targetPct = parseFloat(newTargetPct)
    if (isNaN(targetPct) || targetPct <= 0 || targetPct > 100) {
      alert('Target percentage must be between 0 and 100')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/positions/${selectedPosition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_sell_pct: targetPct }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update position')
      }

      setEditModalOpen(false)
      setSelectedPosition(null)
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Failed to update position')
    } finally {
      setUpdating(false)
    }
  }

  const handleForceSell = async (position: Position) => {
    if (!confirm(`Are you sure you want to force sell this position?`)) {
      return
    }

    try {
      const response = await fetch(`/api/positions/${position.id}/force-sell`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sell position')
      }

      alert('Position sold successfully')
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Failed to sell position')
    }
  }

  const calculateStats = () => {
    const activePositions = positions.filter(p => p.status === 'active').length
    
    const today = new Date().toISOString().split('T')[0]
    const todayTrades = trades.filter(t => 
      t.trade_type === 'sell' && t.timestamp.startsWith(today)
    )
    const todayPnl = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)

    const allTimePnl = trades
      .filter(t => t.trade_type === 'sell' && t.profit_loss !== null)
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0)

    const sellTrades = trades.filter(t => t.trade_type === 'sell' && t.profit_loss !== null)
    const wins = sellTrades.filter(t => (t.profit_loss || 0) > 0).length
    const winRate = sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0

    return { activePositions, todayPnl, allTimePnl, winRate }
  }

  const stats = calculateStats()
  const activePositions = positions.filter(p => p.status === 'active')
  const recentActivity = trades.slice(0, 5)

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => setModalOpen(true)}>+ Add New Position</Button>
      </div>

      <StatsCards
        activePositions={stats.activePositions}
        todayPnl={stats.todayPnl}
        allTimePnl={stats.allTimePnl}
        winRate={stats.winRate}
      />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Positions</h2>
        {activePositions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground mb-4">No active positions</p>
            <Button onClick={() => setModalOpen(true)}>Create Your First Position</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onEdit={() => handleEdit(position)}
                onForceSell={() => handleForceSell(position)}
              />
            ))}
          </div>
        )}
      </div>

      {recentActivity.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Activity</h2>
            <a href="/history" className="text-sm text-primary hover:underline">
              View All
            </a>
          </div>
          <div className="bg-white border rounded-lg divide-y">
            {recentActivity.map((trade) => (
              <div key={trade.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {trade.trade_type === 'sell' ? '✅ SOLD' : '📈 BOUGHT'}: {trade.market_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trade.shares} shares @ ${(trade.price * 100).toFixed(2)}% |{' '}
                    {new Date(trade.timestamp).toLocaleString()}
                  </p>
                </div>
                {trade.profit_loss !== null && (
                  <div className={`font-semibold ${trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AddPositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchData}
      />

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Target Percentage</DialogTitle>
            <DialogDescription>
              Update the target sell percentage for this position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target_pct">Target Sell %</Label>
              <Input
                id="target_pct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newTargetPct}
                onChange={(e) => setNewTargetPct(e.target.value)}
                disabled={updating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTarget} disabled={updating}>
              {updating ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



