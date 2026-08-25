import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// Recreate the pure crypto logic to test independently in ES module test runner
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const TEST_KEY = crypto.createHash('sha256').update('test-secret-key-for-unit-tests').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, TEST_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

function decrypt(payload) {
  const [ivBase64, authTagBase64, cipherTextBase64] = payload.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, TEST_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipherTextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

test('AES-256-GCM Encryption and Decryption Round-Trip', () => {
  const originalToken = 'discord_oauth2_access_token_sample_123456789';
  const encrypted = encrypt(originalToken);

  assert.notStrictEqual(encrypted, originalToken);
  assert.strictEqual(encrypted.split(':').length, 3, 'Payload should have iv:authTag:ciphertext');

  const decrypted = decrypt(encrypted);
  assert.strictEqual(decrypted, originalToken, 'Decrypted token must match original exactly');
});

test('AES-256-GCM Tamper Resistance', () => {
  const originalToken = 'secret_refresh_token_987654321';
  const encrypted = encrypt(originalToken);
  const parts = encrypted.split(':');

  // Tamper with the ciphertext
  const tamperedCipher = Buffer.from(parts[2], 'base64');
  tamperedCipher[0] = tamperedCipher[0] ^ 0xff;
  parts[2] = tamperedCipher.toString('base64');

  const tamperedPayload = parts.join(':');

  assert.throws(() => {
    decrypt(tamperedPayload);
  }, /Unsupported state or unable to authenticate data|authentication tag/, 'Tampered payload should fail decryption with auth tag error');
});
