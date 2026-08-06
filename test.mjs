import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptPath = path.join(__dirname, 'prompt.json');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}

const prompt = JSON.parse(await fs.readFile(promptPath, 'utf8'));
const ws = new WebSocket('wss://api.openai.com/v1/responses', {
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

const logEvent = (event, payload) => {
  const timestamp = new Date().toISOString();
  if (payload === undefined) {
    console.log(`[${timestamp}] ${event}`);
    return;
  }

  console.log(`[${timestamp}] ${event} ${payload}`);
};

ws.on('open', () => {
  logEvent('open');

  ws.send(
    JSON.stringify({
      type: 'response.create',
      ...prompt,
    }),
  );
});

ws.on('message', (data, isBinary) => {
  const raw = isBinary ? data : data.toString('utf8');
  logEvent('message', raw);
});

ws.on('error', (error) => {
  logEvent('error', error.message);
});

ws.on('close', (code, reason) => {
  logEvent('close', `code=${code} reason=${reason.toString('utf8')}`);
});

ws.on('ping', (data) => {
  logEvent('ping', data.toString('utf8'));
});

ws.on('pong', (data) => {
  logEvent('pong', data.toString('utf8'));
});

ws.on('unexpected-response', (_req, res) => {
  logEvent('unexpected-response', `statusCode=${res.statusCode} statusMessage=${res.statusMessage}`);
});

ws.on('upgrade', (res) => {
  logEvent('upgrade', `statusCode=${res.statusCode} statusMessage=${res.statusMessage}`);
});
