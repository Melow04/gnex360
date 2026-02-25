'use client'

import QRCodeSVG from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QRDisplayProps {
  qrCode: string
  userName: string
  size?: number
}

export function QRDisplay({ qrCode, userName, size = 256 }: QRDisplayProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your Gym QR Code</CardTitle>
        <CardDescription>
          Show this code at the entrance for quick entry
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={qrCode} size={size} level="H" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{userName}</p>
          <p className="text-sm text-muted-foreground font-mono">{qrCode}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRDisplay
