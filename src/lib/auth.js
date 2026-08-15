import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'saferail_super_secret_key_9922118833';

// Generate a signed session token
export const createSessionToken = (payload) => {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 8 * 60 * 60 * 1000 // 8 hours expiry
  });
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return `${Buffer.from(data).toString('base64')}.${signature}`;
};

// Verify token and return payload
export const verifySessionToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedData, signature] = parts;
  const dataStr = Buffer.from(encodedData, 'base64').toString('utf8');
  
  // Verify signature
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(dataStr).digest('hex');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(dataStr);
    if (Date.now() > payload.exp) return null; // Expired
    return payload;
  } catch (e) {
    return null;
  }
};
