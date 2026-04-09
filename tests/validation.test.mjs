import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPublishText,
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
