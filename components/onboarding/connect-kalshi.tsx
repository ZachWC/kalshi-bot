'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ConnectKalshi({ onNext }: { onNext: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tested, setTested] = useState(false)

  const handleTest = async () => {
    setError(null)
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

      onNext()
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Connect Your Kalshi Account</CardTitle>
        <CardDescription>
          To automate trading, we need access to your Kalshi account via API keys.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">How to get your API keys:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Go to kalshi.com/settings/api</li>
            <li>Click &quot;Generate New API Key&quot;</li>
            <li>Copy both the key and secret</li>
            <li>Paste them below</li>
          </ol>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {tested && (
          <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
            ✓ Connection successful! You can proceed to save.
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
              }}
              disabled={loading}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">🔒 Security:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Encrypted & stored securely</li>
              <li>We never see your password</li>
              <li>You can revoke access anytime</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={loading || !apiKey || !apiSecret}
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !tested}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

