'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Preferences({ onComplete }: { onComplete: () => void }) {
  const [timezone, setTimezone] = useState('America/New_York')
  const [defaultTarget, setDefaultTarget] = useState('65')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    setLoading(true)

    const targetPct = parseFloat(defaultTarget)
    if (isNaN(targetPct) || targetPct <= 0 || targetPct > 100) {
      setError('Target percentage must be between 0 and 100')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone,
          default_target_pct: targetPct,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Set Your Preferences</CardTitle>
        <CardDescription>
          Configure your default settings. You can change these anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={loading}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_target">Default Target Sell %</Label>
            <Input
              id="default_target"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={defaultTarget}
              onChange={(e) => setDefaultTarget(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Default percentage at which positions will be automatically sold
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </CardContent>
    </Card>
  )
}

