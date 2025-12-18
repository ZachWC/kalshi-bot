'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function KalshiConnection({ hasConnection }: { hasConnection: boolean }) {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tested, setTested] = useState(false)

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/kalshi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection failed')
      }

      setTested(true)
      setSuccess('Connection successful!')
    } catch (err: any) {
      setError(err.message || 'Failed to test connection')
      setTested(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!tested) {
      setError('Please test the connection first')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save credentials')
      }

      setSuccess('Credentials saved successfully!')
      setApiKey('')
      setApiSecret('')
      setTested(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Kalshi account? All active positions will be cancelled.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect')
      }

      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalshi Connection</CardTitle>
        <CardDescription>
          Manage your Kalshi API credentials for automated trading.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasConnection && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Connected - Your Kalshi account is linked
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="text"
              placeholder="KALSHI_API_..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTested(false)
                setSuccess(null)
              }}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              placeholder="sk_live_..."
              value={apiSecret}
              onChange={(e) => {
                setApiSecret(e.target.value)
                setTested(false)
                setSuccess(null)
              }}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={loading || !apiKey || !apiSecret}
            >
              Test Connection
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !tested}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Update API Keys'}
            </Button>
          </div>

          {hasConnection && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full"
            >
              Disconnect Kalshi Account
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



