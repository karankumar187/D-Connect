import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Derives a valid 32-byte key from the environment variable ENCRYPTION_KEY.
 * Falls back to a deterministic SHA-256 hash of SECRET_KEY if ENCRYPTION_KEY is missing.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || process.env.SECRET_KEY || 'default-dev-secret-key-must-be-changed-in-prod';
  
  // If it's a 64-char hex string, decode directly
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  
  // Otherwise SHA-256 hash the string to obtain a consistent 32-byte key
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (all base64-encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts an encrypted payload using AES-256-GCM.
 * Validates integrity via the authentication tag.
 */
export function decrypt(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected iv:authTag:ciphertext');
  }
  
  const [ivBase64, authTagBase64, cipherTextBase64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid IV or auth tag length in encrypted payload');
  }
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(cipherTextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
