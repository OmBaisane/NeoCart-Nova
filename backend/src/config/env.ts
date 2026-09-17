import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/neocart_nova',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie_secret_dev'
};
