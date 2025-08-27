import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this';

export function encryptPrivateKey(privateKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptPrivateKey(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateRandomToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

export function encryptData(data: any): string {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', KEY_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string): any {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', KEY_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}