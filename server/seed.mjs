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
      title: 'Midnight Signal Vol. 001 - release idea intake',
      caption: 'Rain Grid starts here: one calm late-night electronic idea becomes a faceless release system with a soundtrack, hero video, Shorts set, and download pack.',
      hashtags: '#midnightsignal #raingrid #facelessmedia',
      scheduleAt: buildFutureDate(1, 9, 0),
      platforms: ['x', 'threads', 'bluesky'],
      group: 'Midnight Signal / Idea',
      mediaType: 'mixed',
      ratio: '16:9',
      duration: 0,
      mediaCount: 0,
      sourceUrl: 'https://example.com/midnight-signal/rain-grid',
      notes: [
        'Demo step 1: idea -> release brief.',
        'Source brief: private Midnight Signal handoff release-brief.md',
        'Keep this as a faceless studio release, not a generic creator-suite campaign.'
      ].join('\n'),
      status: 'idea'
    }, accounts),
    seedPost({
      title: 'Rain Grid asset pack assembly',
      caption: 'The pack shape is locked: full track, preview cut, loop edit, square cover, vertical wallpaper, hero video, Shorts variants, and buyer-facing notes.',
      hashtags: '#midnightsignal #mediapack #assetpack',
      scheduleAt: buildFutureDate(1, 11, 0),
      platforms: ['instagram', 'x'],
      group: 'Midnight Signal / Asset Pack',
      mediaType: 'mixed',
      ratio: '1:1',
      duration: 60,
      assetUrls: {
        image: 'media-bundle://midnight-signal/vol-001-rain-grid/stills/cover-square.png',
        audio: 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav'
      },
      notes: [
        'Demo step 2: release brief -> asset-pack manifest.',
        'Offer skeleton: private Midnight Signal handoff media-pack-offer-skeleton.json',
        'Download manifest: private Midnight Signal handoff download-pack-manifest.json'
      ].join('\n'),
      status: 'draft'
    }, accounts),
    seedPost({
      title: 'Midnight Signal Vol. 001 | Rain Grid',
      caption: 'A calm late-night broadcast from rain-slick grids, tower lights, and synthetic signal drift. Vol. 001 turns one track into the full Midnight Signal release world.',
      hashtags: '#midnightsignal #raingrid #electronicmusic #facelessmedia',
      scheduleAt: buildFutureDate(2, 12, 0),
      platforms: ['youtube'],
      group: 'Midnight Signal / Hero Release',
      mediaType: 'video',
      ratio: '16:9',
      duration: 186,
      assetUrls: {
        video: 'media-bundle://midnight-signal/vol-001-rain-grid/video/hero-video.mp4',
        thumbnail: 'media-bundle://midnight-signal/vol-001-rain-grid/stills/thumbnail-wide.png',
        audio: 'media-bundle://midnight-signal/vol-001-rain-grid/audio/full-track.wav'
      },
      platformTargets: {
        youtube: {
          title: 'Midnight Signal Vol. 001 | Rain Grid',
          settings: {
            privacyStatus: 'private',
            madeForKids: 'no',
            notifySubscribers: false,
            tags: 'midnight signal, rain grid, faceless media, electronic, urban ambient',
            category: 'Music',
            playlist: 'Midnight Signal'
          }
        }
      },
      notes: [
        'Demo step 3: asset pack -> release metadata.',
        'Dry-run only until YouTube auth exists. No external posting is required for the demo.',
        'Signal Stack release handoff: private Midnight Signal handoff signal-stack-release.json'
      ].join('\n'),
      status: 'approved'
    }, accounts),
    seedPost({
      title: 'Get the Rain Grid pack',
      caption: 'Join the drop list for the first Midnight Signal pack preview, launch alert, and early-buyer price when Vol. 001 goes live.',
      hashtags: '#midnightsignal #raingrid #mediapack',
      scheduleAt: buildFutureDate(2, 16, 0),
      platforms: ['shorts', 'instagram', 'tiktok', 'x'],
      group: 'Midnight Signal / Capture CTA',
      mediaType: 'video',
      ratio: '9:16',
      duration: 27,
      assetUrls: {
        video: 'media-bundle://midnight-signal/vol-001-rain-grid/video/shorts-cutdown.mp4',
        thumbnail: 'media-bundle://midnight-signal/vol-001-rain-grid/stills/cover-square.png',
        audio: 'media-bundle://midnight-signal/vol-001-rain-grid/audio/preview-cut.wav'
      },
      platformTargets: {
        shorts: {
          title: 'Midnight Signal | Rain Grid | Hook Loop',
          settings: {
            privacyStatus: 'private',
            madeForKids: 'no',
            notifySubscribers: false,
            tags: 'midnight signal, rain grid, shorts, electronic',
            category: 'Music',
            playlist: 'Midnight Signal'
          }
        },
        instagram: {
          settings: {
            publishType: 'reel',
            shareToFeed: true,
            altText: 'Rain-slick night grid artwork for Midnight Signal Vol. 001.',
            firstComment: 'Tracking key: midnight_signal_vol_001_rain_grid_interest'
          }
        },
        tiktok: {
          settings: {
            postMode: 'draft',
            privacyLevel: 'SELF_ONLY',
            allowComment: false,
            allowDuet: false,
            allowStitch: false,
            commercialContent: false,
            musicUsageConfirmed: true,
            brandedContentPolicyConfirmed: false,
            videoCoverTimestampMs: 1000
          }
        }
      },
      notes: [
        'Demo step 4: release metadata -> publish-ready package.',
        'CTA label: Get the Rain Grid pack.',
        'Capture stack: Tally + Buttondown; checkout stays inactive until approved.',
        'Tracking key: midnight_signal_vol_001_rain_grid_interest'
      ].join('\n'),
      status: 'scheduled'
    }, accounts),
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
    const requestedTarget = post.platformTargets?.[platform] || {};
    platformTargets[platform] = {
      ...requestedTarget,
      enabled: true,
      accountId,
      caption: requestedTarget.caption || '',
      hashtags: requestedTarget.hashtags || ''
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
