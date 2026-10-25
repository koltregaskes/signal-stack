import test from 'node:test';
import assert from 'node:assert/strict';

import { processDuePosts } from '../server/scheduler.mjs';

test('publishes due dry-run posts', async () => {
  const state = {
    posts: [{
      id: 'post-1',
      title: 'Test',
      caption: 'Hello',
      hashtags: '#hello',
      scheduleAt: new Date(Date.now() - 60000).toISOString(),
      platforms: ['x'],
      accountTargets: { x: 'acc-1' },
      platformTargets: {
        x: {
          enabled: true,
          accountId: 'acc-1',
          caption: '',
          hashtags: ''
        }
      },
      mediaType: 'image',
      mediaCount: 0,
      media: [],
      assetUrls: { image: '', video: '', thumbnail: '' },
      ratio: '1:1',
      duration: 0,
      sourceUrl: '',
      quoteMode: false,
      notes: '',
      status: 'scheduled',
      attemptCount: 0,
      publishHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    accounts: [{
      id: 'acc-1',
      platform: 'x',
      label: 'Main',
      handle: '@main',
      mode: 'dry-run',
      status: 'active',
      isDefault: true
    }],
    alerts: [],
    activity: [],
    settings: {
      maxAutoRetries: 3,
      retryBackoffMinutes: [15, 60, 240]
    }
  };

  const result = await processDuePosts(state, { x: { ready: false } });
  assert.equal(result.nextState.posts[0].status, 'posted');
  assert.equal(Boolean(result.nextState.posts[0].postedAt), true);
  assert.equal(result.nextState.posts[0].publishHistory.length, 1);
  assert.equal(result.nextState.posts[0].publishHistory[0].outcome, 'posted');
  assert.equal(result.nextState.posts[0].deliveryResults[0].ok, true);
  assert.equal(result.nextState.activity[0].type, 'publish-success');
});

test('records validation-blocked runs in publish history', async () => {
  const state = {
    posts: [{
      id: 'post-2',
      title: 'Blocked Test',
      caption: 'Needs media',
      hashtags: '',
      scheduleAt: new Date(Date.now() - 60000).toISOString(),
      platforms: ['instagram'],
      accountTargets: { instagram: 'acc-2' },
      platformTargets: {
        instagram: {
          enabled: true,
          accountId: 'acc-2',
          title: '',
          caption: '',
          hashtags: '',
          settings: {
            publishType: 'feed',
            firstComment: '',
            altText: '',
            shareToFeed: true
          }
        }
      },
      mediaType: 'image',
      mediaCount: 0,
      media: [],
      assetUrls: { image: '', video: '', thumbnail: '', audio: '' },
      ratio: '4:5',
      duration: 0,
      sourceUrl: '',
      quoteMode: false,
      notes: '',
      status: 'scheduled',
      attemptCount: 0,
      publishHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    accounts: [{
      id: 'acc-2',
      platform: 'instagram',
      label: 'IG Main',
      handle: '@ig-main',
      mode: 'dry-run',
      status: 'active',
      isDefault: true
    }],
    alerts: [],
    activity: [],
    settings: {
      maxAutoRetries: 3,
      retryBackoffMinutes: [15, 60, 240]
    }
  };

  const result = await processDuePosts(state, { instagram: { ready: false } });
  assert.equal(result.nextState.posts[0].status, 'failed');
  assert.equal(result.nextState.posts[0].publishHistory.length, 1);
  assert.equal(result.nextState.posts[0].publishHistory[0].summary, 'Scheduler blocked this post before delivery.');
  assert.equal(result.nextState.activity[0].type, 'publish-blocked');
});

test('does not mark a remote-url post posted when storage id is empty', async () => {
  const state = {
    posts: [{
      id: 'post-empty-storage',
      title: 'Placeholder teaser',
      caption: 'Remote only',
      hashtags: '',
      scheduleAt: new Date(Date.now() - 60000).toISOString(),
      platforms: ['instagram'],
      accountTargets: { instagram: 'acc-ig' },
      platformTargets: {
        instagram: {
          enabled: true,
          accountId: 'acc-ig',
          title: '',
          caption: '',
          hashtags: '',
          settings: {
            publishType: 'feed',
            firstComment: '',
            altText: '',
            shareToFeed: true
          }
        }
      },
      mediaType: 'image',
      mediaCount: 1,
      media: [{
        id: 'media-1',
        name: 'teaser.jpg',
        type: 'image/jpeg',
        kind: 'image',
        sizeBytes: 1024,
        width: 1080,
        height: 1080,
        durationSeconds: 0,
        storageId: '',
        previewUrl: ''
      }],
      assetUrls: {
        image: 'https://cdn.example.com/assets/teaser.jpg',
        video: '',
        thumbnail: '',
        audio: ''
      },
      ratio: '1:1',
      duration: 0,
      sourceUrl: '',
      quoteMode: false,
      notes: '',
      status: 'scheduled',
      attemptCount: 0,
      publishHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    accounts: [{
      id: 'acc-ig',
      platform: 'instagram',
      label: 'IG Main',
      handle: '@ig-main',
      mode: 'dry-run',
      status: 'active',
      isDefault: true
    }],
    alerts: [],
    activity: [],
    settings: {
      maxAutoRetries: 3,
      retryBackoffMinutes: [15, 60, 240]
    }
  };

  const result = await processDuePosts(state, { instagram: { ready: false } });
  assert.notEqual(result.nextState.posts[0].status, 'posted');
  assert.equal(result.nextState.posts[0].status, 'failed');
  assert.match(result.nextState.posts[0].lastError, /stored file/i);
  assert.equal(result.processed[0].status, 'failed');
});

test('dry-run posts a media platform when a stored file is attached', async () => {
  const state = {
    posts: [{
      id: 'post-stored',
      title: 'Stored teaser',
      caption: 'Local file',
      hashtags: '',
      scheduleAt: new Date(Date.now() - 60000).toISOString(),
      platforms: ['instagram'],
      accountTargets: { instagram: 'acc-ig' },
      platformTargets: {
        instagram: {
          enabled: true,
          accountId: 'acc-ig',
          title: '',
          caption: '',
          hashtags: '',
          settings: {
            publishType: 'feed',
            firstComment: '',
            altText: '',
            shareToFeed: true
          }
        }
      },
      mediaType: 'image',
      mediaCount: 1,
      media: [{
        id: 'media-2',
        name: 'teaser.jpg',
        type: 'image/jpeg',
        kind: 'image',
        sizeBytes: 1024,
        width: 1080,
        height: 1080,
        durationSeconds: 0,
        storageId: 'stored-teaser.jpg',
        previewUrl: ''
      }],
      assetUrls: { image: '', video: '', thumbnail: '', audio: '' },
      ratio: '1:1',
      duration: 0,
      sourceUrl: '',
      quoteMode: false,
      notes: '',
      status: 'scheduled',
      attemptCount: 0,
      publishHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    accounts: [{
      id: 'acc-ig',
      platform: 'instagram',
      label: 'IG Main',
      handle: '@ig-main',
      mode: 'dry-run',
      status: 'active',
      isDefault: true
    }],
    alerts: [],
    activity: [],
    settings: {
      maxAutoRetries: 3,
      retryBackoffMinutes: [15, 60, 240]
    }
  };

  const result = await processDuePosts(state, { instagram: { ready: false } });
  assert.equal(result.nextState.posts[0].status, 'posted');
  assert.match(result.nextState.posts[0].deliveryResults[0].message, /Dry-run delivery simulated/);
});
