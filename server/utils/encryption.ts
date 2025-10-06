import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('ENCRYPTION_KEY not set in environment variables. Using default (not secure for production)');
    return 'default-key-change-me-in-production-please-use-32-chars';
  }
  return key;
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    
    const key = await scryptAsync(getEncryptionKey(), salt, KEY_LENGTH) as Buffer;
    
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    const encryptedKey = Buffer.concat([
      cipher.update(apiKey, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      encryptedKey
    ]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

export async function decryptApiKey(encryptedData: string): Promise<string> {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encryptedKey = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const key = await scryptAsync(getEncryptionKey(), salt, KEY_LENGTH) as Buffer;
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decryptedKey = Buffer.concat([
      decipher.update(encryptedKey),
      decipher.final()
    ]);
    
    return decryptedKey.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const visibleStart = 4;
  const visibleEnd = 4;
  const masked = apiKey.substring(0, visibleStart) + 
                 '*'.repeat(apiKey.length - visibleStart - visibleEnd) + 
                 apiKey.substring(apiKey.length - visibleEnd);
  return masked;
}

export function isEncrypted(value: string): boolean {
  try {
    const buffer = Buffer.from(value, 'base64');
    return buffer.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
