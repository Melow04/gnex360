'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCodeSVG from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type QrResponse = {
  qrToken: string
  expiresAt: string
  ttlSeconds: number
  member: {
    name: string
    plan: string
  }
}

export function MemberEntryQrCard() {
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [ttlSeconds, setTtlSeconds] = useState(30)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  }, [expiresAt])

  async function refreshToken(isManual = false) {
    setError(null)
    if (isManual) setIsRefreshing(true)

    try {
      const response = await fetch('/api/entry/qr-token', {
        method: 'POST',
        cache: 'no-store',
      })
      const data = (await response.json()) as Partial<QrResponse> & { error?: string }

      if (!response.ok || !data.qrToken || !data.expiresAt) {
        setError(data.error || 'Unable to generate secure QR token')
        return
      }

      setQrToken(data.qrToken)
      setExpiresAt(new Date(data.expiresAt).getTime())
      setTtlSeconds(data.ttlSeconds || 30)
    } catch {
      setError('Unable to generate secure QR token')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshToken()
  }, [])

  useEffect(() => {
    if (!expiresAt) return

    if (secondsLeft <= 5) {
      refreshToken()
      return
    }

    const interval = window.setInterval(() => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000)
      if (remaining <= 5) {
        window.clearInterval(interval)
        refreshToken()
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [expiresAt, secondsLeft])

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Secure Entry QR</CardTitle>
        <CardDescription>
          This QR rotates every {ttlSeconds}s and is valid for one scan only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Generating secure QR...</p>
        ) : qrToken ? (
          <>
            <div className="inline-flex rounded-lg bg-white p-4">
              <QRCodeSVG value={qrToken} size={220} level="H" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Expires in: {secondsLeft}s</p>
              <p className="text-xs text-muted-foreground">
                Screenshots/copies expire quickly and cannot be reused after a successful scan.
              </p>
            </div>
            <Button variant="outline" onClick={() => refreshToken(true)} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh QR'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-destructive">{error || 'No QR token available.'}</p>
            <Button variant="outline" onClick={() => refreshToken(true)} disabled={isRefreshing}>
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
