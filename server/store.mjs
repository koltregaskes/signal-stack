import fs from 'node:fs/promises';
import path from 'node:path';

import { createSeedState } from './seed.mjs';
import { getRuntimeConfig } from './env.mjs';
import { normaliseAccount, normalisePost } from '../shared/validation.js';
import { sanitiseState } from './auth.mjs';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, '.local', 'data');
const UPLOAD_DIR = path.join(ROOT_DIR, '.local', 'uploads');
const STATE_PATH = path.join(DATA_DIR, 'app-state.json');

let memoryState = null;
let mutationChain = Promise.resolve();

export async function initialiseStore(envStatus) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    memoryState = hydrateState(parsed, envStatus);
  } catch {
    memoryState = hydrateState(createSeedState(getRuntimeConfig()), envStatus);
    await persistState();
  }

  return memoryState;
}

export function getState() {
  return structuredClone(memoryState);
}

export function getPublicState() {
  return sanitiseState(getState());
}

export async function updateState(mutator, envStatus) {
  const { state } = await transactState(async (draft) => ({
    nextState: await mutator(draft) || draft
  }), envStatus);
  return state;
}

export async function transactState(worker, envStatus) {
  const task = mutationChain.then(async () => {
    const draft = structuredClone(memoryState);
    const outcome = await worker(draft) || {};

    if (outcome.persist === false) {
      return {
        state: getState(),
        result: outcome.result
      };
    }

    const nextState = outcome.nextState ?? draft;
    memoryState = hydrateState(nextState, envStatus);
    await persistStateLocked();
    return {
      state: getState(),
      result: outcome.result
    };
  });

  mutationChain = task.then(() => undefined, () => undefined);
  return task;
}

export async function saveUploadedFiles(files = [], limits = {}) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const saved = [];
  const maxFiles = Math.max(1, Number(limits.maxFiles || files.length || 1));
  const maxBytes = Math.max(1024 * 1024, Number(limits.maxBytes || 512 * 1024 * 1024));

  if (files.length > maxFiles) {
    throw new Error(`Upload exceeds the ${maxFiles} file limit.`);
  }

  for (const file of files) {
    const contentType = String(file.type || '');
    const sizeBytes = Number(file.size || 0);

    if (!contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('audio/')) {
      throw new Error(`Unsupported upload type: ${contentType || 'unknown'}.`);
    }

    if (sizeBytes > maxBytes) {
      throw new Error(`Upload exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB per-file limit.`);
    }

    const extension = path.extname(file.name || '').toLowerCase();
    const safeName = `${crypto.randomUUID()}${extension}`;
    const storagePath = path.join(UPLOAD_DIR, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(storagePath, buffer);
    saved.push({
      id: crypto.randomUUID(),
      storageId: safeName,
      name: file.name,
      type: file.type,
      sizeBytes: buffer.byteLength
    });
  }

  return saved;
}

export function getUploadPath(storageId) {
  return path.join(UPLOAD_DIR, storageId);
}

async function persistStateLocked() {
  await fs.writeFile(STATE_PATH, JSON.stringify(memoryState, null, 2), 'utf8');
}

function hydrateState(state, envStatus) {
  const accounts = Array.isArray(state.accounts)
    ? state.accounts.map((account) => normaliseAccount(account, envStatus))
    : [];

  const posts = Array.isArray(state.posts)
    ? state.posts.map((post) => normalisePost(post, accounts))
    : [];

  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    accounts,
    posts,
    alerts: Array.isArray(state.alerts) ? state.alerts : [],
    activity: Array.isArray(state.activity) ? state.activity : [],
    settings: {
      maxAutoRetries: Number(state.settings?.maxAutoRetries || 3),
      retryBackoffMinutes: Array.isArray(state.settings?.retryBackoffMinutes)
        ? state.settings.retryBackoffMinutes
        : [15, 60, 240]
    }
  };
}
