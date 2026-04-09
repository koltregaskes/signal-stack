import { buildFutureDate } from '../shared/time.js';

export function createSeedState(config) {
  const accounts = [
    seedAccount('instagram', '@kol.art', 'Kol Art Studio', config.defaultPublishMode, true),
    seedAccount('tiktok', '@kolclips', 'Kol Clips', config.defaultPublishMode, true),
    seedAccount('youtube', 'Kol Signal Studio', 'YouTube Main', config.defaultPublishMode, true),
    seedAccount('shorts', 'Kol Signal Shorts', 'YouTube Shorts', config.defaultPublishMode, true),
    seedAccount('x', '@kolsignal', 'X Main', config.defaultPublishMode, true),
    seedAccount('x', '@kolsignal_alt', 'X Alt', 'dry-run', false),
    seedAccount('bluesky', 'koltregaskes.bsky.social', 'Bluesky Main', config.defaultPublishMode, true),
    seedAccount('threads', '@kol.art', 'Threads Main', config.defaultPublishMode, true)
  ];

  const posts = [
    seedPost({
      title: 'Morning teaser frame set',
      caption: 'A vertical teaser to warm up the feed before the full image batch lands later today.',
      hashtags: '#teaser #process',
      scheduleAt: buildFutureDate(1, 9, 30),
      platforms: ['instagram', 'tiktok', 'shorts'],
      group: 'Art Drop',
      mediaType: 'video',
      ratio: '9:16',
      duration: 21,
      media: [seedMedia('teaser-cut.mp4', 'video/mp4', 'video', 48 * 1024 * 1024, 1080, 1920, 21)],
      assetUrls: {
        video: 'https://cdn.example.com/assets/teaser-cut.mp4',
        thumbnail: 'https://cdn.example.com/assets/teaser-thumb.jpg'
      },
      notes: 'Replace with the trimmed reel cut before launch.',
      status: 'scheduled'
    }, accounts),
    seedPost({
      title: 'YouTube main upload support',
      caption: 'Main video drops at lunch, then a Shorts cut and an IG pull-quote carry the rest of the day.',
      hashtags: '#launch #studio',
      scheduleAt: buildFutureDate(2, 12, 15),
      platforms: ['youtube', 'shorts', 'instagram'],
      group: 'Video Push',
      mediaType: 'video',
      ratio: '16:9',
      duration: 540,
      media: [seedMedia('main-drop.mp4', 'video/mp4', 'video', 320 * 1024 * 1024, 1920, 1080, 540)],
      assetUrls: {
        video: 'https://cdn.example.com/assets/main-drop.mp4',
        thumbnail: 'https://cdn.example.com/assets/main-drop-thumb.jpg'
      },
      notes: 'Keep the vertical cut punchy for Shorts.',
      status: 'approved'
    }, accounts),
    seedPost({
      title: 'Trailer quote pulse',
      caption: 'A short trailer pulse built around one key line and a link back to the source post.',
      scheduleAt: buildFutureDate(3, 18, 45),
      platforms: ['x', 'threads', 'bluesky'],
      group: 'Launch Beat',
      mediaType: 'mixed',
      ratio: '9:16',
      duration: 32,
      media: [seedMedia('quote-frame.jpg', 'image/jpeg', 'image', 2 * 1024 * 1024, 1080, 1350, 0)],
      assetUrls: {
        image: 'https://cdn.example.com/assets/quote-frame.jpg'
      },
      sourceUrl: 'https://x.com/example/status/1234567890',
      quoteMode: true,
      notes: 'If X is crowded, move this to the alt account.',
      status: 'draft'
    }, accounts)
  ];

  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    accounts,
    posts,
    alerts: [],
    activity: [],
    settings: {
      maxAutoRetries: config.maxAutoRetries,
      retryBackoffMinutes: config.retryBackoffMinutes
    }
  };
}

function seedAccount(platform, handle, label, mode, isDefault) {
  return {
    id: crypto.randomUUID(),
    platform,
    label,
    handle,
    mode,
    status: 'active',
    isDefault,
    lastUsedAt: ''
  };
}

function seedPost(post, accounts) {
  const accountTargets = {};
  const platformTargets = {};
  for (const platform of post.platforms) {
    const accountId = accounts.find((account) => account.platform === platform && account.isDefault)?.id
      ?? accounts.find((account) => account.platform === platform)?.id
      ?? '';
    accountTargets[platform] = accountId;
    platformTargets[platform] = {
      enabled: true,
      accountId,
      caption: '',
      hashtags: ''
    };
  }

  return {
    id: crypto.randomUUID(),
    accountTargets,
    platformTargets,
    mediaCount: Array.isArray(post.media) ? post.media.length : Number(post.mediaCount || 0),
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...post
  };
}

function seedMedia(name, type, kind, sizeBytes, width, height, durationSeconds) {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    kind,
    sizeBytes,
    width,
    height,
    durationSeconds,
    storageId: '',
    previewUrl: ''
  };
}
