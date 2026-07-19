const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY is missing or too short. Set a 64-char hex string in your .env (see .env.example).'
    );
  }
  // Accept either a 64-char hex string or any passphrase — always derive a
  // stable 32-byte key so admins can't shoot themselves in the foot.
  return crypto.createHash('sha256').update(raw).digest();
};

// Returns a single string payload: iv:authTag:ciphertext (all hex)
const encryptApiKey = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptApiKey = (payload) => {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Malformed encrypted API key');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { encryptApiKey, decryptApiKey };
