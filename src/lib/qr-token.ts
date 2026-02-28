import { createHmac, randomUUID, timingSafeEqual } from 'crypto'

const QR_TOKEN_TTL_SECONDS = 30

type QrTokenPayload = {
  type: 'entry'
  userId: string
  nonce: string
  exp: number
}

const usedTokenSignatures = new Map<string, number>()

function getSecret() {
  const secret = process.env.QR_TOKEN_SECRET || process.env.CLERK_SECRET_KEY
  if (!secret) {
    throw new Error('QR token secret is not configured')
  }
  return secret
}

function encodePayload(payload: QrTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function signPayload(payloadBase64: string) {
  return createHmac('sha256', getSecret()).update(payloadBase64).digest('base64url')
}

function parsePayload(payloadBase64: string): QrTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as Partial<QrTokenPayload>

    if (
      parsed.type !== 'entry' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null
    }

    return {
      type: 'entry',
      userId: parsed.userId,
      nonce: parsed.nonce,
      exp: parsed.exp,
    }
  } catch {
    return null
  }
}

function hasTokenBeenUsed(signature: string) {
  const now = Date.now()

  for (const [key, expiresAt] of usedTokenSignatures.entries()) {
    if (expiresAt <= now) {
      usedTokenSignatures.delete(key)
    }
  }

  return usedTokenSignatures.has(signature)
}

function markTokenAsUsed(signature: string, expiresAtUnixSeconds: number) {
  usedTokenSignatures.set(signature, expiresAtUnixSeconds * 1000)
}

export function createEntryQrToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + QR_TOKEN_TTL_SECONDS
  const payload: QrTokenPayload = {
    type: 'entry',
    userId,
    nonce: randomUUID(),
    exp,
  }

  const encodedPayload = encodePayload(payload)
  const signature = signPayload(encodedPayload)

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(exp * 1000),
    ttlSeconds: QR_TOKEN_TTL_SECONDS,
  }
}

export function verifyEntryQrToken(rawToken: string) {
  const [payloadBase64, signature] = rawToken.split('.')
  if (!payloadBase64 || !signature) {
    return { ok: false as const, reason: 'MALFORMED' as const }
  }

  const expectedSignature = signPayload(payloadBase64)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { ok: false as const, reason: 'INVALID_SIGNATURE' as const }
  }

  if (hasTokenBeenUsed(signature)) {
    return { ok: false as const, reason: 'TOKEN_REPLAYED' as const }
  }

  const payload = parsePayload(payloadBase64)
  if (!payload) {
    return { ok: false as const, reason: 'INVALID_PAYLOAD' as const }
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    return { ok: false as const, reason: 'TOKEN_EXPIRED' as const }
  }

  markTokenAsUsed(signature, payload.exp)

  return {
    ok: true as const,
    payload,
  }
}
