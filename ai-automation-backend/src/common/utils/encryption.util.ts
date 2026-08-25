import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string, secretKey: string): string {
  if (!text) return text;
  
  // Hash key to ensure 32 bytes for AES-256
  const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substring(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string, secretKey: string): string {
  if (!hash) return hash;
  
  const parts = hash.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substring(0, 32);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key),
    Buffer.from(ivHex, 'hex'),
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Creates a cryptographically signed OAuth state parameter tied to the authenticated user.
 */
export function createSignedOAuthState(userId: string, secretKey: string): string {
  const payload = JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(12).toString('hex'),
  });
  
  const b64Payload = Buffer.from(payload, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(b64Payload);
  const signature = hmac.digest('hex');
  
  return `${b64Payload}.${signature}`;
}

/**
 * Validates the HMAC signature and timestamp expiry of an incoming OAuth state parameter.
 * Returns the decoded userId if valid; otherwise throws an error.
 */
export function verifySignedOAuthState(
  state: string,
  secretKey: string,
  maxAgeMs = 15 * 60 * 1000 // 15 minutes validity
): { userId: string } {
  if (!state || typeof state !== 'string') {
    throw new Error('Missing or invalid OAuth state parameter');
  }

  const parts = state.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed OAuth state parameter');
  }

  const [b64Payload, signature] = parts;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(b64Payload);
  const expectedSignature = hmac.digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('OAuth state signature verification failed');
  }

  let decoded: { userId: string; timestamp: number; nonce: string };
  try {
    decoded = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Failed to parse OAuth state payload');
  }

  if (!decoded.userId || !decoded.timestamp) {
    throw new Error('Invalid OAuth state payload structure');
  }

  const age = Date.now() - decoded.timestamp;
  if (age > maxAgeMs || age < -30000) { // allow 30s clock skew
    throw new Error('OAuth state has expired. Please try connecting again.');
  }

  return { userId: decoded.userId };
}
