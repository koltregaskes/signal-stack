import { publishPost } from './connectors.mjs';
import { getRuntimeConfig } from './env.mjs';
import { validatePost } from '../shared/validation.js';

const runtimeConfig = getRuntimeConfig();

export async function processDuePosts(state, envStatus) {
  const now = new Date();
  const nowIso = now.toISOString();
  const nextState = structuredClone(state);
  const processed = [];

  for (const post of nextState.posts) {
    if (!['scheduled', 'retrying'].includes(post.status)) {
      continue;
    }

    const statusBefore = post.status;
    const dueAt = post.status === 'retrying' && post.nextAttemptAt ? post.nextAttemptAt : post.scheduleAt;
    if (!dueAt || new Date(dueAt).getTime() > now.getTime()) {
      continue;
    }

    const checks = validatePost(post, {
      accounts: nextState.accounts,
      posts: nextState.posts,
      envStatus
    });

    const blocked = checks.filter((item) => item.level === 'blocked');
    if (blocked.length) {
      post.deliveryResults = [];
      post.status = 'failed';
      post.lastError = blocked[0].message;
      post.updatedAt = nowIso;
      nextState.alerts.unshift(createAlert(post, blocked[0].message, 'blocked'));
      appendPublishHistory(post, {
        createdAt: nowIso,
        outcome: 'failed',
        statusBefore,
        statusAfter: 'failed',
        summary: 'Scheduler blocked this post before delivery.',
        reason: blocked[0].message,
        attemptCount: Number(post.attemptCount || 0),
        results: []
      });
      nextState.activity.unshift({
        id: crypto.randomUUID(),
        type: 'publish-blocked',
        createdAt: nowIso,
        postId: post.id,
        postTitle: post.title,
        detail: blocked[0].message
      });
      processed.push({ postId: post.id, status: 'failed', reason: blocked[0].message });
      continue;
    }

    const results = await publishPost(post, nextState.accounts, envStatus, runtimeConfig);
    const failed = results.filter((item) => !item.ok);
    post.deliveryResults = results.map((item) => ({
      platform: item.platform,
      ok: item.ok,
      remoteId: item.remoteId || '',
      message: item.message,
      accountId: item.accountId || '',
      accountLabel: item.accountLabel || '',
      attemptedAt: now.toISOString()
    }));

    if (!failed.length) {
      post.status = 'posted';
      post.postedAt = nowIso;
      post.lastPublishedAt = nowIso;
      post.lastError = '';
      post.nextAttemptAt = '';
      post.updatedAt = nowIso;
      appendPublishHistory(post, {
        createdAt: nowIso,
        outcome: 'posted',
        statusBefore,
        statusAfter: 'posted',
        summary: results.map((item) => `${item.platform}: ${item.message}`).join(' | '),
        reason: '',
        attemptCount: Number(post.attemptCount || 0),
        results: post.deliveryResults
      });
      nextState.activity.unshift({
        id: crypto.randomUUID(),
        type: 'publish-success',
        createdAt: nowIso,
        postId: post.id,
        postTitle: post.title,
        detail: results.map((item) => `${item.platform}: ${item.message}`).join(' | ')
      });
      processed.push({ postId: post.id, status: 'posted' });
      continue;
    }

    const hardFailure = failed.find((item) => item.retryable === false) ?? failed[0];
    post.attemptCount = Number(post.attemptCount || 0) + 1;
    post.lastError = hardFailure.message;
    post.updatedAt = nowIso;

    if (post.attemptCount >= nextState.settings.maxAutoRetries || hardFailure.retryable === false) {
      post.status = 'failed';
      post.nextAttemptAt = '';
      nextState.alerts.unshift(createAlert(post, hardFailure.message, 'failed'));
      appendPublishHistory(post, {
        createdAt: nowIso,
        outcome: 'failed',
        statusBefore,
        statusAfter: 'failed',
        summary: failed.map((item) => `${item.platform}: ${item.message}`).join(' | '),
        reason: hardFailure.message,
        attemptCount: post.attemptCount,
        results: post.deliveryResults
      });
      nextState.activity.unshift({
        id: crypto.randomUUID(),
        type: 'publish-failed',
        createdAt: nowIso,
        postId: post.id,
        postTitle: post.title,
        detail: failed.map((item) => `${item.platform}: ${item.message}`).join(' | ')
      });
      processed.push({ postId: post.id, status: 'failed', reason: hardFailure.message });
      continue;
    }

    const retrySteps = nextState.settings.retryBackoffMinutes;
    const backoffMinutes = retrySteps[Math.min(post.attemptCount - 1, retrySteps.length - 1)] || 15;
    const retryDate = new Date(now.getTime() + backoffMinutes * 60000);
    post.status = 'retrying';
    post.nextAttemptAt = retryDate.toISOString();
    nextState.alerts.unshift(createAlert(post, `${hardFailure.message} Retrying in ${backoffMinutes} minutes.`, 'retrying'));
    appendPublishHistory(post, {
      createdAt: nowIso,
      outcome: 'retrying',
      statusBefore,
      statusAfter: 'retrying',
      summary: failed.map((item) => `${item.platform}: ${item.message}`).join(' | '),
      reason: hardFailure.message,
      nextAttemptAt: post.nextAttemptAt,
      attemptCount: post.attemptCount,
      results: post.deliveryResults
    });
    nextState.activity.unshift({
      id: crypto.randomUUID(),
      type: 'publish-retrying',
      createdAt: nowIso,
      postId: post.id,
      postTitle: post.title,
      detail: `${hardFailure.message} Retrying in ${backoffMinutes} minutes.`
    });
    processed.push({ postId: post.id, status: 'retrying', reason: hardFailure.message });
  }

  nextState.activity = nextState.activity.slice(0, 50);
  nextState.alerts = nextState.alerts.slice(0, 50);
  return { nextState, processed };
}

function appendPublishHistory(post, entry) {
  const existing = Array.isArray(post.publishHistory) ? post.publishHistory : [];
  post.publishHistory = [
    {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      outcome: 'failed',
      statusBefore: '',
      statusAfter: '',
      summary: '',
      reason: '',
      nextAttemptAt: '',
      attemptCount: 0,
      results: [],
      ...entry
    },
    ...existing
  ].slice(0, 20);
}

function createAlert(post, message, level) {
  return {
    id: crypto.randomUUID(),
    level,
    createdAt: new Date().toISOString(),
    postId: post.id,
    postTitle: post.title,
    message,
    resolved: false
  };
}
