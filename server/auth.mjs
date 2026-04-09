import crypto from 'node:crypto';

const oauthTransactions = new Map();
const REFRESH_WINDOW_MS = 1000 * 60 * 5;

const providerCatalog = {
  youtube: {
    provider: 'youtube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopeSeparator: ' ',
    supportsPkce: false,
    defaultScopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ]
  },
  instagram: {
    provider: 'instagram',
    authUrl: 'https://www.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopeSeparator: ',',
    supportsPkce: false,
    defaultScopes: [
      'instagram_business_basic',
      'instagram_business_content_publish'
    ]
  },
  tiktok: {
    provider: 'tiktok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    revokeUrl: 'https://open.tiktokapis.com/v2/oauth/revoke/',
    scopeSeparator: ',',
    supportsPkce: true,
    defaultScopes: [
      'user.info.basic',
      'video.publish',
      'video.upload'
    ]
  }
};

export function getAuthProviderForPlatform(platform) {
  if (platform === 'shorts') {
    return 'youtube';
  }

  return platform;
}

export function getOAuthPlatforms() {
  return Object.keys(providerCatalog);
}

export function sanitiseState(state) {
  return {
    ...state,
    accounts: Array.isArray(state.accounts) ? state.accounts.map(sanitiseAccount) : []
  };
}

export function sanitiseAccount(account = {}) {
  const { credentials, ...safe } = account;
  return {
    ...safe,
    tokenStored: Boolean(account.credentials)
  };
}

export function clearAccountConnection(account = {}) {
  return {
    ...account,
    authStatus: 'disconnected',
    lastAuthError: '',
    authUpdatedAt: new Date().toISOString(),
    connectedAt: '',
    expiresAt: '',
    refreshExpiresAt: '',
    lastRefreshAt: '',
    tokenType: '',
    scopes: [],
    capabilities: [],
    providerAccountId: '',
    providerUserId: '',
    credentials: ''
  };
}

export function createAuthStartUrl(platform, accountId, runtimeConfig) {
  const provider = getProviderConfig(platform, runtimeConfig);
  if (!provider) {
    throw new Error(`Unsupported auth provider: ${platform}`);
  }

  const state = crypto.randomUUID();
  const codeVerifier = provider.supportsPkce ? createCodeVerifier() : '';
  const transaction = {
    accountId,
    platform: provider.provider,
    createdAt: Date.now(),
    redirectUri: provider.callbackUrl,
    codeVerifier
  };
  oauthTransactions.set(state, transaction);
  pruneTransactions();

  const query = new URLSearchParams();
  if (provider.provider === 'tiktok') {
    query.set('client_key', provider.clientId);
  } else {
    query.set('client_id', provider.clientId);
  }
  query.set('redirect_uri', provider.callbackUrl);
  query.set('response_type', 'code');
  query.set('scope', provider.scopes.join(provider.scopeSeparator));
  query.set('state', state);

  if (provider.provider === 'youtube') {
    query.set('access_type', 'offline');
    query.set('include_granted_scopes', 'true');
    query.set('prompt', 'consent');
  }

  if (provider.supportsPkce) {
    query.set('code_challenge', createCodeChallenge(codeVerifier));
    query.set('code_challenge_method', 'S256');
  }

  return `${provider.authUrl}?${query.toString()}`;
}

export async function completeAuthCallback(platform, callbackUrl, runtimeConfig) {
  const provider = getProviderConfig(platform, runtimeConfig);
  if (!provider) {
    throw new Error(`Unsupported auth provider: ${platform}`);
  }

  const code = callbackUrl.searchParams.get('code');
  const state = callbackUrl.searchParams.get('state');
  const error = callbackUrl.searchParams.get('error') || callbackUrl.searchParams.get('error_description');

  if (error) {
    throw new Error(String(error));
  }

  if (!code || !state) {
    throw new Error('Missing code or state in OAuth callback.');
  }

  const transaction = oauthTransactions.get(state);
  oauthTransactions.delete(state);
  if (!transaction || transaction.platform !== provider.provider) {
    throw new Error('OAuth state validation failed.');
  }

  const tokenData = await exchangeCodeForToken(provider, code, transaction);
  const profile = await fetchProviderProfile(provider, tokenData.accessToken);

  return {
    accountId: transaction.accountId,
    patch: buildConnectedAccountPatch(provider, tokenData, profile)
  };
}

export async function ensureAccountAccess(account, runtimeConfig) {
  const providerName = getAuthProviderForPlatform(account.platform);
  const provider = providerCatalog[providerName];
  if (!provider) {
    return {
      ok: false,
      retryable: false,
      message: `${account.platform} does not support live OAuth publishing in this build.`,
      accessToken: ''
    };
  }

  const tokenBundle = decryptCredentials(account.credentials, runtimeConfig);
  if (!tokenBundle?.accessToken) {
    return {
      ok: false,
      retryable: false,
      message: `${account.label} is not connected yet. Reconnect the account before using Live API mode.`,
      accessToken: ''
    };
  }

  const expiresAt = tokenBundle.expiresAt ? new Date(tokenBundle.expiresAt).getTime() : 0;
  const needsRefresh = Boolean(tokenBundle.refreshToken) && expiresAt && expiresAt - Date.now() <= REFRESH_WINDOW_MS;

  if (!needsRefresh) {
    return {
      ok: true,
      accessToken: tokenBundle.accessToken,
      tokenType: tokenBundle.tokenType || 'Bearer'
    };
  }

  try {
    const refreshed = await refreshAccessToken(provider, tokenBundle, runtimeConfig);
    account.credentials = encryptCredentials(refreshed, runtimeConfig);
    account.expiresAt = refreshed.expiresAt || '';
    account.refreshExpiresAt = refreshed.refreshExpiresAt || account.refreshExpiresAt || '';
    account.lastRefreshAt = new Date().toISOString();
    account.lastAuthError = '';
    account.authStatus = 'connected';
    account.authUpdatedAt = new Date().toISOString();

    return {
      ok: true,
      accessToken: refreshed.accessToken,
      tokenType: refreshed.tokenType || 'Bearer'
    };
  } catch (error) {
    account.authStatus = 'needs_reauth';
    account.lastAuthError = error instanceof Error ? error.message : 'Token refresh failed.';
    account.authUpdatedAt = new Date().toISOString();
    account.credentials = '';
    return {
      ok: false,
      retryable: false,
      message: account.lastAuthError,
      accessToken: ''
    };
  }
}

export function createSignedMediaUrl(storageId, runtimeConfig, ttlSeconds = 3600) {
  const secret = runtimeConfig.mediaSigningSecret || runtimeConfig.tokenEncryptionKey || runtimeConfig.sessionSecret;
  if (!secret) {
    return '';
  }

  const expires = Date.now() + ttlSeconds * 1000;
  const payload = `${storageId}.${expires}`;
  const sig = signPayload(payload, secret);
  const baseUrl = runtimeConfig.baseUrl.replace(/\/$/, '');
  return `${baseUrl}/api/public-media/${encodeURIComponent(storageId)}?expires=${expires}&sig=${encodeURIComponent(sig)}`;
}

export function verifySignedMediaUrl(storageId, requestUrl, runtimeConfig) {
  const secret = runtimeConfig.mediaSigningSecret || runtimeConfig.tokenEncryptionKey || runtimeConfig.sessionSecret;
  if (!secret) {
    return false;
  }

  const expires = Number(requestUrl.searchParams.get('expires'));
  const sig = String(requestUrl.searchParams.get('sig') || '');
  if (!expires || !sig || expires < Date.now()) {
    return false;
  }

  const payload = `${storageId}.${expires}`;
  return safeCompare(sig, signPayload(payload, secret));
}

export function getProviderConfig(platform, runtimeConfig) {
  const providerName = getAuthProviderForPlatform(platform);
  const base = providerCatalog[providerName];
  if (!base) {
    return null;
  }

  if (providerName === 'youtube') {
    return {
      ...base,
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      callbackUrl: process.env.YOUTUBE_CALLBACK_URL || `${runtimeConfig.baseUrl}/api/auth/youtube/callback`,
      scopes: parseScopes(process.env.YOUTUBE_SCOPES, base.defaultScopes)
    };
  }

  if (providerName === 'instagram') {
    return {
      ...base,
      clientId: process.env.INSTAGRAM_APP_ID || '',
      clientSecret: process.env.INSTAGRAM_APP_SECRET || '',
      callbackUrl: process.env.INSTAGRAM_CALLBACK_URL || `${runtimeConfig.baseUrl}/api/auth/instagram/callback`,
      scopes: parseScopes(process.env.INSTAGRAM_SCOPES, base.defaultScopes)
    };
  }

  return {
    ...base,
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    callbackUrl: process.env.TIKTOK_CALLBACK_URL || `${runtimeConfig.baseUrl}/api/auth/tiktok/callback`,
    scopes: parseScopes(process.env.TIKTOK_SCOPES, base.defaultScopes)
  };
}

export function encryptCredentials(payload, runtimeConfig) {
  const key = normaliseEncryptionKey(runtimeConfig.tokenEncryptionKey);
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is missing or invalid.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload));
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptCredentials(value, runtimeConfig) {
  if (!value) {
    return null;
  }

  const key = normaliseEncryptionKey(runtimeConfig.tokenEncryptionKey);
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is missing or invalid.');
  }

  const [ivPart, authTagPart, encryptedPart] = String(value).split('.');
  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Stored credential payload is invalid.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64url')),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString('utf8'));
}

function buildConnectedAccountPatch(provider, tokenData, profile) {
  const now = new Date().toISOString();
  const capabilities = provider.provider === 'tiktok'
    ? deriveTikTokCapabilities(tokenData.scopes)
    : profile.capabilities;

  return {
    authStatus: 'connected',
    authUpdatedAt: now,
    connectedAt: now,
    lastAuthError: '',
    providerAccountId: profile.providerAccountId || '',
    providerUserId: profile.providerUserId || profile.providerAccountId || '',
    tokenType: tokenData.tokenType || 'Bearer',
    scopes: tokenData.scopes || [],
    capabilities,
    expiresAt: tokenData.expiresAt || '',
    refreshExpiresAt: tokenData.refreshExpiresAt || '',
    credentials: tokenData.credentials,
    handle: profile.handle,
    label: profile.label
  };
}

async function exchangeCodeForToken(provider, code, transaction) {
  const body = new URLSearchParams();

  if (provider.provider === 'tiktok') {
    body.set('client_key', provider.clientId);
  } else {
    body.set('client_id', provider.clientId);
  }

  body.set('client_secret', provider.clientSecret);
  body.set('code', code);
  body.set('grant_type', 'authorization_code');
  body.set('redirect_uri', transaction.redirectUri);

  if (provider.supportsPkce && transaction.codeVerifier) {
    body.set('code_verifier', transaction.codeVerifier);
  }

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.message || 'Token exchange failed.');
  }

  return normaliseTokenResponse(provider, payload);
}

async function refreshAccessToken(provider, tokenBundle, runtimeConfig) {
  if (provider.provider === 'instagram') {
    const response = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(tokenBundle.accessToken)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message || payload.message || 'Instagram token refresh failed.');
    }

    return {
      ...tokenBundle,
      accessToken: payload.access_token || tokenBundle.accessToken,
      tokenType: tokenBundle.tokenType || 'Bearer',
      expiresAt: computeExpiresAt(payload.expires_in, tokenBundle.expiresAt),
      refreshExpiresAt: tokenBundle.refreshExpiresAt || ''
    };
  }

  const authProvider = getProviderConfig(provider.provider, runtimeConfig);
  const body = new URLSearchParams();
  if (provider.provider === 'tiktok') {
    body.set('client_key', authProvider.clientId);
  } else {
    body.set('client_id', authProvider.clientId);
  }
  body.set('client_secret', authProvider.clientSecret);
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', tokenBundle.refreshToken || '');

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.message || 'Token refresh failed.');
  }

  return {
    ...tokenBundle,
    ...normaliseTokenResponse(provider, payload),
    refreshToken: payload.refresh_token || tokenBundle.refreshToken
  };
}

async function fetchProviderProfile(provider, accessToken) {
  if (provider.provider === 'youtube') {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payload = await response.json().catch(() => ({}));
    const item = payload.items?.[0];
    if (!response.ok || !item) {
      throw new Error(payload.error?.message || 'Could not load the connected YouTube channel.');
    }

    return {
      providerAccountId: item.id,
      providerUserId: item.id,
      label: item.snippet?.title || 'YouTube channel',
      handle: item.snippet?.title || 'YouTube channel',
      capabilities: ['youtube', 'shorts']
    };
  }

  if (provider.provider === 'instagram') {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.id) {
      throw new Error(payload.error?.message || 'Could not load the connected Instagram profile.');
    }

    return {
      providerAccountId: payload.id,
      providerUserId: payload.id,
      label: payload.username ? `Instagram @${payload.username}` : 'Instagram account',
      handle: payload.username ? `@${payload.username}` : '@instagram',
      capabilities: ['instagram']
    };
  }

  const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const payload = await response.json().catch(() => ({}));
  const user = payload.data?.user;
  if (!response.ok || !user?.open_id) {
    throw new Error(payload.error?.message || payload.message || 'Could not load the connected TikTok profile.');
  }

  return {
    providerAccountId: user.open_id,
    providerUserId: user.union_id || user.open_id,
    label: user.display_name || 'TikTok account',
    handle: user.display_name ? `@${user.display_name}` : '@tiktok',
    capabilities: ['tiktok']
  };
}

function normaliseTokenResponse(provider, payload) {
  const accessToken = payload.access_token || payload.data?.access_token || '';
  const refreshToken = payload.refresh_token || payload.data?.refresh_token || '';
  const scope = payload.scope || payload.data?.scope || '';
  const expiresIn = payload.expires_in || payload.data?.expires_in || 0;
  const refreshExpiresIn = payload.refresh_expires_in || payload.data?.refresh_expires_in || 0;
  const tokenType = payload.token_type || payload.data?.token_type || 'Bearer';
  const scopes = Array.isArray(scope)
    ? scope
    : String(scope)
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

  const tokenBundle = {
    provider: provider.provider,
    accessToken,
    refreshToken,
    tokenType,
    scopes,
    expiresAt: computeExpiresAt(expiresIn),
    refreshExpiresAt: computeExpiresAt(refreshExpiresIn)
  };

  return {
    ...tokenBundle,
    credentials: tokenBundle
  };
}

function computeExpiresAt(seconds, fallback = '') {
  const safeSeconds = Number(seconds || 0);
  if (!safeSeconds) {
    return fallback || '';
  }

  return new Date(Date.now() + safeSeconds * 1000).toISOString();
}

function parseScopes(value, defaults) {
  if (!value) {
    return defaults;
  }

  return String(value)
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function deriveTikTokCapabilities(scopes = []) {
  const capabilitySet = new Set();
  if (scopes.includes('video.publish')) {
    capabilitySet.add('tiktok');
  }
  if (scopes.includes('video.upload')) {
    capabilitySet.add('tiktok_draft');
  }
  return [...capabilitySet];
}

function createCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function createCodeChallenge(value) {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

function pruneTransactions() {
  const cutoff = Date.now() - 1000 * 60 * 10;
  for (const [state, transaction] of oauthTransactions.entries()) {
    if (transaction.createdAt < cutoff) {
      oauthTransactions.delete(state);
    }
  }
}

function normaliseEncryptionKey(value) {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  try {
    const base64 = trimmed.replaceAll('-', '+').replaceAll('_', '/');
    const buffer = Buffer.from(base64, 'base64');
    return buffer.length === 32 ? buffer : null;
  } catch {
    return null;
  }
}

function signPayload(value, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64url');
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
