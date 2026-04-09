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
});
