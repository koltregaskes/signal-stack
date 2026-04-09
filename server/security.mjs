import crypto from 'node:crypto';

const SESSION_COOKIE = 'signal_stack_session';

export function getSecurityConfig(runtimeConfig) {
  const sessionTtlSeconds = Math.max(3600, Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7));
  const maxJsonBytes = Math.max(1024, Number(process.env.MAX_JSON_BYTES || 1024 * 1024));
  const maxUploadBytes = Math.max(1024 * 1024, Number(process.env.MAX_UPLOAD_BYTES || 512 * 1024 * 1024));
  const maxUploadFiles = Math.max(1, Number(process.env.MAX_UPLOAD_FILES || 12));
  const appPassword = String(process.env.APP_PASSWORD || '');
  const sessionSecret = String(process.env.SESSION_SECRET || appPassword || runtimeConfig.baseUrl);

  return {
    requireAuth: Boolean(appPassword),
    appPassword,
    sessionSecret,
    sessionTtlSeconds,
    maxJsonBytes,
    maxUploadBytes,
    maxUploadFiles
  };
}

export function buildSessionStatus(req, config) {
  return {
    requireAuth: config.requireAuth,
    authenticated: isAuthenticated(req, config)
  };
}

export function assertAuthenticated(req, config) {
  if (!config.requireAuth) {
    return;
  }

  if (!isAuthenticated(req, config)) {
    throw httpError(401, 'Authentication required.');
  }
}

export function assertTrustedOrigin(req, runtimeConfig, config) {
  if (!config.requireAuth || !isMutatingMethod(req.method)) {
    return;
  }

  const origin = req.headers.origin;
  const expectedOrigin = new URL(runtimeConfig.baseUrl).origin;

  if (!origin || origin !== expectedOrigin) {
    throw httpError(403, 'Request origin rejected.');
  }
}

export function assertContentLengthWithinLimit(req, maxBytes) {
  const rawValue = req.headers['content-length'];
  if (!rawValue) {
    return;
  }

  const contentLength = Number(Array.isArray(rawValue) ? rawValue[0] : rawValue);
  if (!Number.isFinite(contentLength)) {
    throw httpError(400, 'Invalid Content-Length header.');
  }

  if (contentLength > maxBytes) {
    throw httpError(413, `Request body exceeds the ${formatBytes(maxBytes)} limit.`);
  }
}

export function comparePassword(input, expected) {
  const candidate = Buffer.from(String(input ?? ''), 'utf8');
  const target = Buffer.from(String(expected ?? ''), 'utf8');

  if (candidate.length !== target.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidate, target);
}

export function createSessionCookie(runtimeConfig, config, now = Date.now()) {
  const expiresAt = now + config.sessionTtlSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt }), 'utf8').toString('base64url');
  const signature = signPayload(payload, config.sessionSecret);
  return serialiseCookie(runtimeConfig, `${payload}.${signature}`, config.sessionTtlSeconds);
}

export function clearSessionCookie(runtimeConfig) {
  return serialiseCookie(runtimeConfig, '', 0);
}

export function buildHeaders(runtimeConfig, extraHeaders = {}) {
  return {
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': buildContentSecurityPolicy(),
    ...extraHeaders
  };
}

export function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function formatBytes(value) {
  if (!value) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const number = value / (1024 ** power);
  return `${number.toFixed(number >= 10 ? 0 : 1)} ${units[power]}`;
}

function isAuthenticated(req, config, now = Date.now()) {
  if (!config.requireAuth) {
    return true;
  }

  const rawCookie = req.headers.cookie;
  if (!rawCookie) {
    return false;
  }

  const cookies = parseCookies(rawCookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return false;
  }

  const [payload, providedSignature] = token.split('.');
  if (!payload || !providedSignature) {
    return false;
  }

  const expectedSignature = signPayload(payload, config.sessionSecret);
  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(parsed.exp || 0) > now;
  } catch {
    return false;
  }
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function serialiseCookie(runtimeConfig, value, maxAgeSeconds) {
  const isSecure = runtimeConfig.baseUrl.startsWith('https://');
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];

  if (isSecure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function parseCookies(header) {
  return header
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex <= 0) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' blob: data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'"
  ].join('; ');
}

function isMutatingMethod(method = 'GET') {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method).toUpperCase());
}
