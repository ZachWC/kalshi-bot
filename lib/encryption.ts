import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Validate encryption key is 64 hex characters (32 bytes)
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string');
  }

  const KEY_BUFFER = getEncryptionKey();

  // Generate random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    KEY_BUFFER,
    iv
  );
  
  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag (prevents tampering)
  const authTag = cipher.getAuthTag();
  
  // Return: IV:AuthTag:EncryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty string');
  }

  const KEY_BUFFER = getEncryptionKey();

  // Split components
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  
  // Reconstruct
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY_BUFFER,
    iv
  );
  
  // Set auth tag (verifies not tampered)
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

