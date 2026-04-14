import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  clearAccountConnection,
  completeAuthCallback,
  createAuthStartUrl,
  encryptCredentials,
  getOAuthPlatforms,
  getProviderConfig,
  verifySignedMediaUrl
} from './server/auth.mjs';
import { getEnvStatus, getRuntimeConfig } from './server/env.mjs';
import { getPublicState, getState, getUploadPath, initialiseStore, saveUploadedFiles, transactState, updateState } from './server/store.mjs';
import { processDuePosts } from './server/scheduler.mjs';
import {
  assertAuthenticated,
  assertContentLengthWithinLimit,
  assertTrustedOrigin,
  buildHeaders,
  buildSessionStatus,
  clearSessionCookie,
  comparePassword,
  createSessionCookie,
  getSecurityConfig,
  httpError
} from './server/security.mjs';
import { platformCatalog } from './shared/platforms.js';
import { normaliseAccount, normalisePost, validatePost } from './shared/validation.js';

const ROOT_DIR = process.cwd();
const runtimeConfig = getRuntimeConfig();
let envStatus = getEnvStatus();
let dueRunPromise = null;

await initialiseStore(envStatus);

const server = http.createServer(async (req, res) => {
  let url = null;

  try {
    url = new URL(req.url, runtimeConfig.baseUrl);
    const securityConfig = getSecurityConfig(runtimeConfig);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url, securityConfig);
      return;
    }

    await serveStatic(res, url.pathname, securityConfig);
  } catch (error) {
    console.error(error);

    if (res.writableEnded) {
      return;
    }

    const statusCode = Number(error?.statusCode || 500);
    const message = statusCode >= 500 ? 'Unexpected server error.' : error.message;

    if (url?.pathname?.startsWith('/api/')) {
      respondJson(res, statusCode, { error: message }, buildHeaders(runtimeConfig));
      return;
    }

    respondText(res, statusCode, message, buildHeaders(runtimeConfig));
  }
});

server.listen(runtimeConfig.port, runtimeConfig.host, () => {
  console.log(`Signal Stack running on ${runtimeConfig.baseUrl}`);
});

setInterval(() => {
  runDueCycle().catch((error) => console.error(error));
}, 30000);

async function handleApi(req, res, url, securityConfig) {
  envStatus = getEnvStatus();
  assertTrustedOrigin(req, runtimeConfig, securityConfig);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    respondJson(res, 200, { ok: true, now: new Date().toISOString() }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/session') {
    respondJson(res, 200, buildSessionStatus(req, securityConfig), buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/session/login') {
    assertContentLengthWithinLimit(req, securityConfig.maxJsonBytes);
    const payload = await readJson(req, securityConfig.maxJsonBytes);

    if (!securityConfig.requireAuth) {
      respondJson(res, 200, { requireAuth: false, authenticated: true }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
      return;
    }

    if (!comparePassword(payload.password, securityConfig.appPassword)) {
      throw httpError(401, 'Invalid password.');
    }

    respondJson(
      res,
      200,
      { requireAuth: true, authenticated: true },
      buildHeaders(runtimeConfig, {
        'Cache-Control': 'no-store',
        'Set-Cookie': createSessionCookie(runtimeConfig, securityConfig)
      })
    );
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/session/logout') {
    respondJson(
      res,
      200,
      { requireAuth: securityConfig.requireAuth, authenticated: false },
      buildHeaders(runtimeConfig, {
        'Cache-Control': 'no-store',
        'Set-Cookie': clearSessionCookie(runtimeConfig)
      })
    );
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/auth/')) {
    const segments = url.pathname.split('/');
    const provider = segments[3];
    const action = segments[4];

    if (!getOAuthPlatforms().includes(provider)) {
      respondJson(res, 404, { error: 'Unsupported auth provider.' }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
      return;
    }

    if (action === 'start') {
      assertAuthenticated(req, securityConfig);
      const providerConfig = getProviderConfig(provider, runtimeConfig);
      if (!providerConfig?.clientId || !providerConfig?.clientSecret || !providerConfig?.callbackUrl) {
        throw httpError(400, `The ${provider} connector is missing required OAuth environment variables.`);
      }

      const accountId = url.searchParams.get('accountId') || '';
      const location = createAuthStartUrl(provider, accountId, runtimeConfig);
      res.writeHead(302, buildHeaders(runtimeConfig, {
        Location: location,
        'Cache-Control': 'no-store'
      }));
      res.end();
      return;
    }

    if (action === 'callback') {
      try {
        const result = await completeAuthCallback(provider, url, runtimeConfig);
        await updateState((draft) => {
          const index = draft.accounts.findIndex((item) => item.id === result.accountId);
          if (index < 0) {
            throw httpError(404, 'The account targeted by this auth flow no longer exists.');
          }

          draft.accounts[index] = normaliseAccount({
            ...draft.accounts[index],
            ...result.patch,
            credentials: encryptCredentials(result.patch.credentials, runtimeConfig)
          }, envStatus);
          return draft;
        }, envStatus);

        redirectToApp(res, {
          auth: 'connected',
          provider,
          accountId: result.accountId
        });
      } catch (error) {
        redirectToApp(res, {
          auth: 'failed',
          provider,
          message: error instanceof Error ? error.message : 'OAuth callback failed.'
        });
      }
      return;
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/public-media/')) {
    const storageId = decodeURIComponent(url.pathname.split('/').pop() || '');
    if (!storageId || !verifySignedMediaUrl(storageId, url, runtimeConfig)) {
      throw httpError(403, 'Media signature rejected.');
    }

    const uploadPath = getUploadPath(storageId);
    try {
      const body = await fs.readFile(uploadPath);
      res.writeHead(200, {
        ...buildHeaders(runtimeConfig, {
          'Content-Type': getMimeType(uploadPath),
          'Cache-Control': 'private, max-age=60'
        })
      });
      res.end(body);
    } catch {
      throw httpError(404, 'Media file not found.');
    }
    return;
  }

  assertAuthenticated(req, securityConfig);

  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    const state = getPublicState();
    respondJson(res, 200, {
      posts: state.posts,
      accounts: state.accounts,
      alerts: state.alerts,
      activity: state.activity,
      config: {
        envStatus,
        platformCatalog,
        runtime: runtimeConfig
      }
    }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/uploads') {
    assertContentLengthWithinLimit(req, securityConfig.maxUploadBytes);
    const formRequest = new Request(`${runtimeConfig.baseUrl}${url.pathname}`, {
      method: req.method,
      headers: req.headers,
      body: req,
      duplex: 'half'
    });
    const formData = await formRequest.formData();
    const files = formData.getAll('files').filter(Boolean);
    const saved = await saveUploadedFiles(files, {
      maxFiles: securityConfig.maxUploadFiles,
      maxBytes: securityConfig.maxUploadBytes
    });
    respondJson(res, 200, { items: saved }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/posts') {
    assertContentLengthWithinLimit(req, securityConfig.maxJsonBytes);
    const payload = await readJson(req, securityConfig.maxJsonBytes);
    await updateState((draft) => {
      const post = normalisePost(payload.post, draft.accounts);
      const existingIndex = draft.posts.findIndex((item) => item.id === post.id);
      post.updatedAt = new Date().toISOString();

      if (existingIndex >= 0) {
        draft.posts[existingIndex] = post;
      } else {
        draft.posts.unshift(post);
      }

      return draft;
    }, envStatus);

    const publicState = getPublicState();
    const saved = publicState.posts.find((item) => item.id === payload.post.id) ?? publicState.posts[0];
    const checks = validatePost(saved, {
      accounts: publicState.accounts,
      posts: publicState.posts,
      envStatus
    });
    respondJson(res, 200, { post: saved, checks }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
    const postId = url.pathname.split('/').pop();
    await updateState((draft) => {
      draft.posts = draft.posts.filter((item) => item.id !== postId);
      return draft;
    }, envStatus);
    respondJson(res, 204, null, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/accounts') {
    assertContentLengthWithinLimit(req, securityConfig.maxJsonBytes);
    const payload = await readJson(req, securityConfig.maxJsonBytes);
    await updateState((draft) => {
      const requested = payload.account || {};
      const existingIndex = draft.accounts.findIndex((item) => item.id === requested.id);
      const merged = existingIndex >= 0
        ? { ...draft.accounts[existingIndex], ...requested }
        : requested;
      const account = normaliseAccount(merged, envStatus);

      if (account.isDefault) {
        draft.accounts = draft.accounts.map((item) => item.platform === account.platform ? { ...item, isDefault: false } : item);
      }

      if (existingIndex >= 0) {
        draft.accounts[existingIndex] = account;
      } else {
        draft.accounts.unshift(account);
      }

      return draft;
    }, envStatus);
    respondJson(res, 200, { accounts: getPublicState().accounts }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/accounts/') && url.pathname.endsWith('/disconnect')) {
    const segments = url.pathname.split('/');
    const accountId = segments[3];
    await updateState((draft) => {
      const index = draft.accounts.findIndex((item) => item.id === accountId);
      if (index >= 0) {
        draft.accounts[index] = normaliseAccount(clearAccountConnection(draft.accounts[index]), envStatus);
      }
      return draft;
    }, envStatus);
    respondJson(res, 200, { accounts: getPublicState().accounts }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/accounts/')) {
    const accountId = url.pathname.split('/').pop();
    await updateState((draft) => {
      draft.accounts = draft.accounts.filter((item) => item.id !== accountId);
      draft.posts = draft.posts.map((post) => {
        const accountTargets = { ...post.accountTargets };
        for (const [platform, targetId] of Object.entries(accountTargets)) {
          if (targetId === accountId) {
            accountTargets[platform] = draft.accounts.find((item) => item.platform === platform && item.id !== accountId)?.id ?? '';
          }
        }

        return { ...post, accountTargets };
      });
      return draft;
    }, envStatus);
    const publicState = getPublicState();
    respondJson(res, 200, { accounts: publicState.accounts, posts: publicState.posts }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/run-due') {
    const outcome = await runDueCycle();
    const publicState = getPublicState();
    respondJson(res, 200, {
      processed: outcome.processed,
      posts: publicState.posts,
      alerts: publicState.alerts,
      activity: publicState.activity
    }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/alerts/resolve') {
    assertContentLengthWithinLimit(req, securityConfig.maxJsonBytes);
    const payload = await readJson(req, securityConfig.maxJsonBytes);
    await updateState((draft) => {
      draft.alerts = draft.alerts.map((alert) => alert.id === payload.alertId ? { ...alert, resolved: true } : alert);
      return draft;
    }, envStatus);
    respondJson(res, 200, { alerts: getPublicState().alerts }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
    return;
  }

  respondJson(res, 404, { error: 'Route not found.' }, buildHeaders(runtimeConfig, { 'Cache-Control': 'no-store' }));
}

async function serveStatic(res, pathname, securityConfig) {
  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(ROOT_DIR, `.${decodeURIComponent(relativePath)}`);

  if (filePath !== ROOT_DIR && !filePath.startsWith(`${ROOT_DIR}${path.sep}`)) {
    respondText(res, 403, 'Forbidden', buildHeaders(runtimeConfig));
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await serveStatic(res, path.join(relativePath, 'index.html').replace(/\\/g, '/'), securityConfig);
      return;
    }

    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      ...buildHeaders(runtimeConfig, {
        'Content-Type': getMimeType(filePath),
        'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=60'
      })
    });
    res.end(body);
  } catch {
    respondText(res, 404, 'Not found', buildHeaders(runtimeConfig));
  }
}

async function readJson(req, maxBytes) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw httpError(413, 'JSON payload exceeds the configured limit.');
    }

    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw httpError(400, 'Invalid JSON payload.');
  }
}

function respondJson(res, status, payload, headers = {}) {
  if (status === 204) {
    res.writeHead(status, headers);
    res.end();
    return;
  }

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function respondText(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers
  });
  res.end(payload);
}

function redirectToApp(res, params) {
  const query = new URLSearchParams(params);
  res.writeHead(302, buildHeaders(runtimeConfig, {
    Location: `/web/?${query.toString()}`,
    'Cache-Control': 'no-store'
  }));
  res.end();
}

async function runDueCycle() {
  if (dueRunPromise) {
    return dueRunPromise;
  }

  dueRunPromise = (async () => {
    envStatus = getEnvStatus();
    const { state, result } = await transactState(async (draft) => {
      const outcome = await processDuePosts(draft, envStatus);
      if (!outcome.processed.length) {
        return {
          persist: false,
          result: {
            processed: [],
            posts: draft.posts,
            alerts: draft.alerts,
            activity: draft.activity
          }
        };
      }

      return {
        nextState: outcome.nextState,
        result: {
          processed: outcome.processed
        }
      };
    }, envStatus);

    return {
      processed: result?.processed || [],
      posts: state.posts,
      alerts: state.alerts,
      activity: state.activity
    };
  })().finally(() => {
    dueRunPromise = null;
  });

  return dueRunPromise;
}

function getMimeType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json') || filePath.endsWith('.webmanifest')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}
