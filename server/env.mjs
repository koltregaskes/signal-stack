import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const ENV_PATH = path.join(ROOT_DIR, '.env');
const OAUTH_SHARED_REQUIREMENTS = ['SESSION_SECRET', 'TOKEN_ENCRYPTION_KEY'];

const ENV_REQUIREMENTS = {
  instagram: ['INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'INSTAGRAM_CALLBACK_URL'],
  tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_CALLBACK_URL'],
  youtube: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_CALLBACK_URL'],
  shorts: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_CALLBACK_URL'],
  x: ['X_CLIENT_ID', 'X_CLIENT_SECRET', 'X_CALLBACK_URL'],
  bluesky: ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'],
  threads: ['THREADS_APP_ID', 'THREADS_APP_SECRET', 'THREADS_CALLBACK_URL']
};

export function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    return process.env;
  }

  const source = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return process.env;
}

export function getRuntimeConfig() {
  loadEnv();
  return {
    port: Number(process.env.PORT || 8032),
    baseUrl: process.env.APP_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8032}`,
    defaultPublishMode: process.env.DEFAULT_PUBLISH_MODE === 'api' ? 'api' : 'dry-run',
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    maxAutoRetries: Math.max(1, Number(process.env.MAX_AUTO_RETRIES || 3)),
    retryBackoffMinutes: String(process.env.RETRY_BACKOFF_MINUTES || '15,60,240')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0),
    appPassword: process.env.APP_PASSWORD || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
    mediaSigningSecret: process.env.MEDIA_SIGNING_SECRET || process.env.SESSION_SECRET || '',
    maxJsonBodyBytes: Math.max(1024, Number(process.env.MAX_JSON_BODY_BYTES || 1024 * 256)),
    maxUploadBytes: Math.max(1024 * 1024, Number(process.env.MAX_UPLOAD_BYTES || 1024 * 1024 * 1024)),
    maxUploadFiles: Math.max(1, Number(process.env.MAX_UPLOAD_FILES || 12))
  };
}

export function getEnvStatus() {
  loadEnv();
  const entries = {};
  const oauthPlatforms = new Set(['instagram', 'tiktok', 'youtube', 'shorts']);

  for (const [platform, keys] of Object.entries(ENV_REQUIREMENTS)) {
    const present = keys.filter((key) => Boolean(process.env[key]));
    const sharedPresent = OAUTH_SHARED_REQUIREMENTS.filter((key) => Boolean(process.env[key]));
    const appReady = present.length === keys.length;
    const secureStorageReady = oauthPlatforms.has(platform)
      ? sharedPresent.length === OAUTH_SHARED_REQUIREMENTS.length
      : true;
    entries[platform] = {
      requiredKeys: keys,
      presentKeys: present,
      sharedRequiredKeys: oauthPlatforms.has(platform) ? OAUTH_SHARED_REQUIREMENTS : [],
      sharedPresentKeys: sharedPresent,
      appReady,
      secureStorageReady,
      ready: appReady && secureStorageReady
    };
  }

  return entries;
}
