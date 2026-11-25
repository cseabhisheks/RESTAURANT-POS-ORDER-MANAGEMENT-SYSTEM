import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: parseNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_pos',
  jwtSecret: process.env.JWT_SECRET || 'dev-local-pos-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  taxRatePercent: Math.max(0, parseNumber(process.env.TAX_RATE_PERCENT, 5)),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
};

