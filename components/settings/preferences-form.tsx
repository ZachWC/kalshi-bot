'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PreferencesForm() {
  const [timezone, setTimezone] = useState('America/New_York')
  const [defaultTarget, setDefaultTarget] = useState('65')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (response.ok) {
        setTimezone(data.timezone || 'America/New_York')
        setDefaultTarget(data.default_target_pct?.toString() || '65')
        setEmailNotifications(data.email_notifications !== false)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    const targetPct = parseFloat(defaultTarget)
    if (isNaN(targetPct) || targetPct <= 0 || targetPct > 100) {
      setError('Target percentage must be between 0 and 100')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone,
          default_target_pct: targetPct,
          email_notifications: emailNotifications,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      setSuccess('Preferences saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Configure your default settings and notification preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={saving}
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
                disabled={saving}
              />
              <p className="text-sm text-muted-foreground">
                Default percentage at which positions will be automatically sold
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="email_notifications" className="cursor-pointer">
                  Email notifications when positions sell
                </Label>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}



