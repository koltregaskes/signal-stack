import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeedState } from '../server/seed.mjs';
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

test('keeps media-bundle seed assets after normalisation', () => {
  const state = createSeedState({
    defaultPublishMode: 'dry-run',
    maxAutoRetries: 3,
    retryBackoffMinutes: [15, 60, 240]
  });
  const posts = state.posts.map((post) => normalisePost(post, state.accounts));
  const pack = posts.find((post) => post.title === 'Rain Grid asset pack assembly');
  const hero = posts.find((post) => post.title === 'Midnight Signal Vol. 001 | Rain Grid');
  const rain = posts.find((post) => post.title === 'Get the Rain Grid pack');

  assert.equal(pack.assetUrls.image, 'media-bundle://midnight-signal/vol-001-rain-grid/stills/cover-square.png');
  assert.equal(pack.assetUrls.audio, 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav');
  assert.equal(hero.assetUrls.video, 'media-bundle://midnight-signal/vol-001-rain-grid/video/hero-video.mp4');
  assert.equal(hero.assetUrls.thumbnail, 'media-bundle://midnight-signal/vol-001-rain-grid/stills/thumbnail-wide.png');
  assert.equal(hero.assetUrls.audio, 'media-bundle://midnight-signal/vol-001-rain-grid/audio/full-track.wav');
  assert.equal(rain.assetUrls.video, 'media-bundle://midnight-signal/vol-001-rain-grid/video/shorts-cutdown.mp4');
  assert.equal(rain.assetUrls.thumbnail, 'media-bundle://midnight-signal/vol-001-rain-grid/stills/cover-square.png');
  assert.equal(rain.assetUrls.audio, 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav');
});

test('keeps http asset urls and drops other schemes', () => {
  const post = normalisePost({
    assetUrls: {
      image: 'javascript:alert(1)',
      video: 'https://cdn.example.com/assets/main-drop.mp4',
      thumbnail: 'file:///tmp/thumb.png',
      audio: 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav'
    }
  }, []);

  assert.equal(post.assetUrls.image, '');
  assert.equal(post.assetUrls.video, 'https://cdn.example.com/assets/main-drop.mp4');
  assert.equal(post.assetUrls.thumbnail, '');
  assert.equal(post.assetUrls.audio, 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav');
});

test('blocks a media platform when the asset is only a remote url with an empty storage id', () => {
  const account = normaliseAccount({
    id: 'acc-ig',
    platform: 'instagram',
    label: 'IG Dry',
    handle: '@ig',
    mode: 'dry-run'
  }, {});
  const post = normalisePost({
    title: 'Morning teaser frame set',
    status: 'scheduled',
    platforms: ['instagram'],
    accountTargets: { instagram: 'acc-ig' },
    platformTargets: {
      instagram: { enabled: true, accountId: 'acc-ig', caption: '', hashtags: '' }
    },
    media: [{
      name: 'teaser.jpg',
      type: 'image/jpeg',
      kind: 'image',
      storageId: ''
    }],
    assetUrls: {
      image: 'https://cdn.example.com/assets/teaser.jpg'
    }
  }, [account]);
  const checks = validatePost(post, { accounts: [account], posts: [post], envStatus: {} });

  assert.equal(checks.some((item) => item.level === 'blocked' && item.label === 'Instagram needs a stored file'), true);
});
