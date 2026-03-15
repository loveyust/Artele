import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const parseBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const splitList = (value, fallback) => {
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

export const config = {
  host: process.env.SOCKET_HOST || '0.0.0.0',
  port: Number(process.env.SOCKET_PORT || process.env.PORT || 3001),
  corsOrigins: splitList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
  slackToken: process.env.SLACK_TOKEN || '',
  receiver: {
    enabled: parseBool(process.env.RECEIVER_ENABLED, false),
    ip: process.env.RECEIVER_IP || '',
    defaultInput: process.env.RECEIVER_INPUT || 'GAME'
  },
  cec: {
    enabled: parseBool(process.env.CEC_ENABLED, false)
  }
};
