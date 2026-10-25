import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPublishText,
  buildReadinessHistoryEntry,
  createEmptyPost,
  normaliseAccount,
  normalisePost,
  validatePost
} from '../shared/validation.js';

test('blocks posts without accounts', () => {
  const post = createEmptyPost();
  const checks = validatePost(post, { accounts: [], posts: [], envStatus: {} });
  assert.equal(checks.some((item) => item.label.includes('account missing')), true);
});

test('blocks X posts over official caption limit', () => {
  const post = createEmptyPost();
  post.platforms = ['x'];
  post.caption = 'x'.repeat(281);
  post.accountTargets = { x: 'acc-1' };
  post.platformTargets = { x: { enabled: true, accountId: 'acc-1', caption: '', hashtags: '' } };
  const account = normaliseAccount({ id: 'acc-1', platform: 'x', label: 'Main', handle: '@main', mode: 'dry-run' }, {});
  const checks = validatePost(post, { accounts: [account], posts: [], envStatus: {} });
  assert.equal(checks.some((item) => item.label === 'X caption limit' && item.level === 'blocked'), true);
});

test('warns when conservative limits are exceeded', () => {
  const post = createEmptyPost();
  post.platforms = ['threads'];
  post.caption = 'x'.repeat(700);
  post.accountTargets = { threads: 'acc-2' };
  post.platformTargets = { threads: { enabled: true, accountId: 'acc-2', caption: '', hashtags: '' } };
  const account = normaliseAccount({ id: 'acc-2', platform: 'threads', label: 'Threads', handle: '@threads', mode: 'dry-run' }, {});
  const checks = validatePost(post, { accounts: [account], posts: [], envStatus: {} });
  assert.equal(checks.some((item) => item.label === 'Threads caption limit' && item.level === 'warning'), true);
});

test('ideas can exist without platform targets while staying warnings-only', () => {
  const post = normalisePost({
    title: 'Loose concept',
    status: 'idea',
    platforms: [],
    platformTargets: {},
    accountTargets: {}
  }, []);
  const checks = validatePost(post, { accounts: [], posts: [], envStatus: {} });
  assert.equal(checks.some((item) => item.label === 'No platform targets yet' && item.level === 'warning'), true);
  assert.equal(checks.some((item) => item.level === 'blocked' && item.label === 'No platforms selected'), false);
});

test('readiness history records routes without changing post status or calling a platform', () => {
  const post = normalisePost({
    id: 'post-1',
    title: 'Rain grid',
    status: 'approved',
    attemptCount: 2,
    platforms: ['instagram', 'tiktok'],
    platformTargets: {
      instagram: { enabled: true, accountId: 'ig-1' },
      tiktok: { enabled: true, accountId: '' }
    }
  }, []);
  const account = normaliseAccount({
    id: 'ig-1',
    platform: 'instagram',
    label: 'IG Dry',
    handle: '@ig',
    mode: 'dry-run'
  }, {});
  const entry = buildReadinessHistoryEntry(post, { accounts: [account], envStatus: {} }, '2026-10-25T12:00:00.000Z');

  assert.equal(post.status, 'approved');
  assert.equal(entry.outcome, 'readiness');
  assert.equal(entry.statusBefore, 'approved');
  assert.equal(entry.statusAfter, 'approved');
  assert.equal(entry.attemptCount, 2);
  assert.equal(entry.createdAt, '2026-10-25T12:00:00.000Z');
  assert.match(entry.summary, /No platform was called/);
  assert.equal(entry.results.length, 2);
  assert.equal(entry.results.every((result) => result.remoteId === ''), true);

  const instagram = entry.results.find((item) => item.platform === 'instagram');
  const tiktok = entry.results.find((item) => item.platform === 'tiktok');
  assert.equal(instagram.ok, true);
  assert.match(instagram.message, /Dry run ready/);
  assert.equal(tiktok.ok, false);
  assert.match(tiktok.message, /Route missing/);
});

test('buildPublishText uses target overrides and normalises hashtags', () => {
  const post = normalisePost({
    caption: 'Base copy',
    hashtags: 'studio, launch',
    platforms: ['instagram'],
    platformTargets: {
      instagram: {
        enabled: true,
        accountId: '',
        caption: 'IG override',
        hashtags: 'reel teaser'
      }
    }
  }, []);

  assert.equal(buildPublishText(post, 'instagram'), 'IG override\n\n#reel #teaser');
  assert.equal(buildPublishText(post), 'Base copy\n\n#studio #launch');
});
