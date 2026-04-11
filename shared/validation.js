import { POST_STATUSES, platformCatalog } from './platforms.js';
import { buildFutureDate, differenceInMinutes, isSameLocalDay, normaliseLocalDateTime } from './time.js';

export function createEmptyPost() {
  return {
    id: crypto.randomUUID(),
    title: '',
    caption: '',
    hashtags: '',
    scheduleAt: buildFutureDate(1, 10, 0),
    platforms: ['instagram'],
    accountTargets: {},
    platformTargets: {
      instagram: {
        enabled: true,
        accountId: '',
        title: '',
        caption: '',
        hashtags: '',
        settings: createDefaultPlatformSettings('instagram')
      }
    },
    group: 'Art Drop',
    mediaType: 'image',
    ratio: '9:16',
    duration: 30,
    mediaCount: 0,
    media: [],
    assetUrls: {
      image: '',
      video: '',
      thumbnail: '',
      audio: ''
    },
    sourceUrl: '',
    quoteMode: false,
    notes: '',
    status: 'idea',
    attemptCount: 0,
    lastError: '',
    nextAttemptAt: '',
    deliveryResults: [],
    publishHistory: [],
    approvedAt: '',
    postedAt: '',
    lastPublishedAt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function normalisePost(post = {}, accounts = []) {
  const defaults = createEmptyPost();
  const media = Array.isArray(post.media) ? post.media.map(normaliseMediaItem) : [];
  const requestedPlatforms = Array.isArray(post.platforms)
    ? unique(post.platforms.filter((platform) => platformCatalog[platform]))
    : defaults.platforms;
  const assetUrls = normaliseAssetUrls(post.assetUrls ?? {
    image: post.imageUrl,
    video: post.videoUrl,
    thumbnail: post.thumbnailUrl,
    audio: post.audioUrl
  });
  let platformTargets = normalisePlatformTargets(
    post.platformTargets,
    post.accountTargets,
    requestedPlatforms,
    accounts
  );
  let platforms = Object.entries(platformTargets)
    .filter(([, target]) => target.enabled)
    .map(([platform]) => platform);

  if (!platforms.length) {
    platforms = requestedPlatforms;
    platformTargets = normalisePlatformTargets(post.platformTargets, post.accountTargets, platforms, accounts);
  }

  const primaryAssetCount = countPrimaryAssetSlots({ media, assetUrls });

  return {
    ...defaults,
    ...post,
    id: typeof post.id === 'string' && post.id ? post.id : defaults.id,
    title: typeof post.title === 'string' ? post.title.trim() : defaults.title,
    caption: typeof post.caption === 'string' ? post.caption : defaults.caption,
    hashtags: normaliseHashtagString(post.hashtags ?? defaults.hashtags),
    scheduleAt: normaliseLocalDateTime(post.scheduleAt ?? defaults.scheduleAt),
    platforms,
    accountTargets: normaliseAccountTargets(post.accountTargets, platforms, accounts, platformTargets),
    platformTargets,
    mediaType: ['image', 'video', 'carousel', 'mixed'].includes(post.mediaType) ? post.mediaType : defaults.mediaType,
    group: typeof post.group === 'string' && post.group.trim() ? post.group.trim() : defaults.group,
    ratio: typeof post.ratio === 'string' && post.ratio ? post.ratio : defaults.ratio,
    duration: Math.max(0, Number(post.duration ?? defaults.duration) || 0),
    mediaCount: Math.max(primaryAssetCount, Math.max(0, Number(post.mediaCount || 0))),
    media,
    assetUrls,
    sourceUrl: typeof post.sourceUrl === 'string' ? post.sourceUrl.trim() : defaults.sourceUrl,
    quoteMode: Boolean(post.quoteMode),
    notes: typeof post.notes === 'string' ? post.notes.trim() : defaults.notes,
    status: normalisePostStatus(post.status, defaults.status),
    attemptCount: Math.max(0, Number(post.attemptCount || 0)),
    lastError: typeof post.lastError === 'string' ? post.lastError : '',
    nextAttemptAt: typeof post.nextAttemptAt === 'string' ? post.nextAttemptAt : '',
    deliveryResults: Array.isArray(post.deliveryResults) ? post.deliveryResults.map(normaliseDeliveryResult) : [],
    publishHistory: Array.isArray(post.publishHistory) ? post.publishHistory.map(normalisePublishHistoryEntry) : [],
    approvedAt: typeof post.approvedAt === 'string' ? post.approvedAt : '',
    postedAt: typeof post.postedAt === 'string' ? post.postedAt : '',
    lastPublishedAt: typeof post.lastPublishedAt === 'string' ? post.lastPublishedAt : '',
    createdAt: typeof post.createdAt === 'string' && post.createdAt ? post.createdAt : defaults.createdAt,
    updatedAt: typeof post.updatedAt === 'string' && post.updatedAt ? post.updatedAt : defaults.updatedAt
  };
}

export function normaliseAccount(account = {}, envStatus = {}) {
  const platform = platformCatalog[account.platform] ? account.platform : 'instagram';
  const defaultMode = platformCatalog[platform].defaultMode;
  const scopes = Array.isArray(account.scopes)
    ? account.scopes.map((scope) => String(scope).trim()).filter(Boolean)
    : [];
  const capabilities = Array.isArray(account.capabilities)
    ? account.capabilities.map((capability) => String(capability).trim()).filter(Boolean)
    : [];

  return {
    id: typeof account.id === 'string' && account.id ? account.id : crypto.randomUUID(),
    platform,
    label: typeof account.label === 'string' && account.label.trim() ? account.label.trim() : `${platformCatalog[platform].label} account`,
    handle: typeof account.handle === 'string' && account.handle.trim() ? account.handle.trim() : '@new-account',
    mode: ['dry-run', 'api'].includes(account.mode) ? account.mode : defaultMode,
    status: account.status === 'paused' ? 'paused' : 'active',
    isDefault: Boolean(account.isDefault),
    lastUsedAt: typeof account.lastUsedAt === 'string' ? account.lastUsedAt : '',
    connectorReady: Boolean(envStatus[platform]?.ready),
    authStatus: ['disconnected', 'connected', 'expired', 'needs_reauth', 'error'].includes(account.authStatus)
      ? account.authStatus
      : 'disconnected',
    authUpdatedAt: typeof account.authUpdatedAt === 'string' ? account.authUpdatedAt : '',
    connectedAt: typeof account.connectedAt === 'string' ? account.connectedAt : '',
    providerAccountId: typeof account.providerAccountId === 'string' ? account.providerAccountId : '',
    providerUserId: typeof account.providerUserId === 'string' ? account.providerUserId : '',
    tokenType: typeof account.tokenType === 'string' ? account.tokenType : '',
    scopes,
    capabilities,
    expiresAt: typeof account.expiresAt === 'string' ? account.expiresAt : '',
    refreshExpiresAt: typeof account.refreshExpiresAt === 'string' ? account.refreshExpiresAt : '',
    lastRefreshAt: typeof account.lastRefreshAt === 'string' ? account.lastRefreshAt : '',
    lastAuthError: typeof account.lastAuthError === 'string' ? account.lastAuthError : '',
    credentials: typeof account.credentials === 'string' ? account.credentials : '',
    tokenStored: Boolean(account.tokenStored || account.credentials)
  };
}

export function validatePost(post, context = {}) {
  const accounts = Array.isArray(context.accounts) ? context.accounts : [];
  const envStatus = context.envStatus ?? {};
  const peerPosts = Array.isArray(context.posts) ? context.posts : [];
  const checks = [];
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaCount = countPrimaryAssetSlots(post);
  const hasVideoAsset = Boolean(post.assetUrls?.video) || media.some((item) => item.kind === 'video');
  const hasAudioAsset = Boolean(post.assetUrls?.audio) || media.some((item) => item.kind === 'audio');
  const requiresTargets = ['approved', 'scheduled', 'retrying', 'failed', 'posted'].includes(post.status);
  const requiresSchedule = ['approved', 'scheduled', 'retrying', 'failed'].includes(post.status);
  const requiresPlatformSpecificSetup = ['approved', 'scheduled', 'retrying', 'failed', 'posted'].includes(post.status);

  if (!post.title?.trim()) {
    checks.push(blocked('Missing title', 'Give this queue item a clear title so it is easy to scan later.'));
  } else {
    checks.push(ready('Title set', 'This item has a clear queue label.'));
  }

  if (!post.scheduleAt) {
    checks.push(
      requiresSchedule
        ? blocked('Missing schedule', 'Pick a date and time so the scheduler knows when to run.')
        : warning('Schedule placeholder missing', 'Ideas and early drafts can exist without a fixed slot, but adding one helps the calendar view.')
    );
  } else {
    checks.push(ready('Schedule set', `Queued for ${normaliseLocalDateTime(post.scheduleAt)}.`));
  }

  if (!post.platforms?.length) {
    checks.push(
      requiresTargets
        ? blocked('No platforms selected', 'Choose at least one destination before approving or scheduling.')
        : warning('No platform targets yet', 'This idea can stay loose for now, but it still needs targets before approval.')
    );
    return dedupeChecks(checks);
  }

  if (post.quoteMode && !post.sourceUrl) {
    checks.push(blocked('Quote mode needs a source URL', 'Add the referenced post or source link before enabling quote mode.'));
  }

  if (post.sourceUrl && !/^https?:\/\//i.test(post.sourceUrl)) {
    checks.push(warning('Source URL format', 'Use a full URL starting with http:// or https://.'));
  }

  if (!buildPublishText(post).trim()) {
    checks.push(warning('No copy yet', 'You can keep the pipeline moving, but there is still no caption or hashtag bundle to publish.'));
  }

  if (hasAudioAsset && mediaCount < 1) {
    checks.push(warning('Audio reference only', 'Soundtrack or music references are stored, but these platforms still need an image or video asset to publish.'));
  }

  if (!post.assetUrls?.image && !post.assetUrls?.video && media.some((item) => item.kind !== 'audio')) {
    checks.push(ready('Local assets attached', 'Stored uploads are available for exact size and duration checks.'));
  } else if (post.assetUrls?.image || post.assetUrls?.video || post.assetUrls?.audio) {
    checks.push(warning('Remote asset URLs', 'Remote asset slots are filled, but exact file-size validation is limited until local media is attached.'));
  }

  for (const platformKey of post.platforms) {
    const platform = platformCatalog[platformKey];
    if (!platform) {
      continue;
    }

    const account = resolveAccount(post, platformKey, accounts);
    const publishText = buildPublishText(post, platformKey);
    const target = getPlatformTarget(post, platformKey);
    const effectiveTitle = getEffectiveTargetTitle(post, platformKey);

    if (!account) {
      checks.push(blocked(`${platform.label} account missing`, `Choose an account target for ${platform.label} before launch.`));
    } else if (account.status === 'paused') {
      checks.push(blocked(`${platform.label} account paused`, `${account.label} is paused and will not receive scheduled posts.`));
    } else if (account.mode === 'api' && !envStatus[platformKey]?.appReady) {
      checks.push(blocked(`${platform.label} API not ready`, `This account is set to Live API but the required app keys are not configured.`));
    } else if (account.mode === 'api' && !envStatus[platformKey]?.secureStorageReady) {
      checks.push(blocked(`${platform.label} secure storage`, `Set SESSION_SECRET and TOKEN_ENCRYPTION_KEY before connecting ${platform.label} in Live API mode.`));
    } else if (account.mode === 'api' && account.authStatus !== 'connected') {
      checks.push(blocked(`${platform.label} auth required`, `Reconnect ${account.label} before using Live API mode for ${platform.label}.`));
    } else if (account.mode === 'api' && platform.requiredCapability && !account.capabilities?.includes(platform.requiredCapability)) {
      checks.push(blocked(`${platform.label} capability missing`, `${account.label} is connected, but it does not currently advertise ${platform.label} publishing capability.`));
    } else {
      const modeLabel = account.mode === 'api' ? 'Live API' : 'Dry run';
      checks.push(ready(`${platform.label} route set`, `${account.label} will receive this post in ${modeLabel} mode.`));
    }

    if (platform.requiresMedia && mediaCount < 1) {
      checks.push(blocked(`${platform.label} needs media`, 'Attach at least one image or video asset to publish cleanly.'));
    }

    if (post.ratio && platform.recommendedRatios?.length && !platform.recommendedRatios.includes(post.ratio)) {
      checks.push(warning(`${platform.label} ratio fit`, `${post.ratio} is not a preferred ratio for ${platform.label}.`));
    }

    if (platform.captionLimit && publishText.length > platform.captionLimit) {
      checks.push(levelForConfidence(
        platform.captionLimitConfidence,
        `${platform.label} caption limit`,
        `The effective publish copy is ${publishText.length} chars and the ${platform.label} launch rule is ${platform.captionLimit}.`
      ));
    }

    if (platform.maxVideoSeconds && post.duration > platform.maxVideoSeconds && post.mediaType !== 'image') {
      checks.push(levelForConfidence(
        platform.maxVideoSecondsConfidence,
        `${platform.label} duration`,
        `The planned duration is ${post.duration}s and the ${platform.label} rule is ${platform.maxVideoSeconds}s.`
      ));
    }

    if (platform.maxCarouselItems && mediaCount > platform.maxCarouselItems) {
      checks.push(levelForConfidence(
        platform.maxCarouselItemsConfidence,
        `${platform.label} carousel size`,
        `This queue item carries ${mediaCount} primary assets and the ${platform.label} launch rule is ${platform.maxCarouselItems}.`
      ));
    }

    if (platformKey !== 'x' && post.quoteMode) {
      checks.push(warning(`${platform.label} quote note`, 'Quote mode is primarily implemented for X workflows. Other platforms treat the URL as a reference link.'));
    }

    if (platform.supportsQuote === true && post.quoteMode && platformKey === 'x') {
      checks.push(ready('X quote support', 'X can use the source URL as a quote or reference target.'));
    }

    if ((platformKey === 'tiktok' || platformKey === 'youtube' || platformKey === 'shorts') && !effectiveTitle.trim()) {
      checks.push(blocked(`${platform.label} title required`, `Set a ${platform.label} title in the base post or target override before launch.`));
    }

    if (platformKey === 'instagram') {
      if (target.settings.publishType === 'carousel' && mediaCount < 2) {
        checks.push(blocked('Instagram carousel needs multiple assets', 'Carousel publishing needs at least two primary assets.'));
      }

      if (target.settings.publishType === 'reel' && !hasVideoAsset) {
        checks.push(blocked('Instagram reel needs video', 'Attach a video file or video URL before routing this as a Reel.'));
      }
    }

    if (platformKey === 'tiktok') {
      if (!target.settings.privacyLevel) {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          'TikTok privacy required',
          'Choose the TikTok visibility setting from the platform panel before launch.'
        ));
      }

      if (!target.settings.musicUsageConfirmed) {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          'TikTok music confirmation',
          'TikTok requires an explicit music usage acknowledgement before publishing.'
        ));
      }

      if (target.settings.commercialContent && !target.settings.discloseYourBrand && !target.settings.discloseBrandedContent) {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          'TikTok disclosure incomplete',
          'If promotional content is enabled, choose whether it promotes your own brand, a third party, or both.'
        ));
      }

      if (target.settings.discloseBrandedContent && target.settings.privacyLevel === 'SELF_ONLY') {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          'TikTok branded content privacy',
          'Branded content cannot be set to Only me / SELF_ONLY.'
        ));
      }

      if (post.mediaType === 'image' && (target.settings.allowDuet || target.settings.allowStitch)) {
        checks.push(warning('TikTok photo interactions', 'Duet and Stitch are not applicable to TikTok photo posts.'));
      }
    }

    if (platformKey === 'youtube' || platformKey === 'shorts') {
      if (!target.settings.privacyStatus) {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          `${platform.label} privacy required`,
          `Choose a ${platform.label} privacy setting before launch.`
        ));
      }

      if (!target.settings.madeForKids) {
        checks.push(platformFieldCheck(
          requiresPlatformSpecificSetup,
          `${platform.label} audience required`,
          `Select whether the ${platform.label} upload is made for kids.`
        ));
      }

      if (!post.assetUrls?.thumbnail && !media.some((item) => item.kind === 'image')) {
        checks.push(warning(`${platform.label} thumbnail`, `Add a thumbnail image if you want tighter control over the ${platform.label} cover frame.`));
      }
    }

    const platformMediaChecks = validateMediaForPlatform(platform, media);
    checks.push(...platformMediaChecks);

    const collisionChecks = validateSchedulingConflicts(post, platformKey, account, peerPosts);
    checks.push(...collisionChecks);
  }

  return dedupeChecks(checks);
}

export function summariseChecks(checks) {
  return checks.reduce((summary, item) => {
    summary[item.level] += 1;
    return summary;
  }, { ready: 0, warning: 0, blocked: 0 });
}

export function resolveAccount(post, platformKey, accounts = []) {
  const targetedId = post.platformTargets?.[platformKey]?.accountId || post.accountTargets?.[platformKey];
  if (targetedId) {
    return accounts.find((account) => account.id === targetedId) ?? null;
  }

  return accounts.find((account) => account.platform === platformKey && account.isDefault)
    ?? accounts.find((account) => account.platform === platformKey)
    ?? null;
}

export function getPlatformTarget(post, platformKey) {
  const target = post.platformTargets?.[platformKey];
  return target && typeof target === 'object'
    ? {
        enabled: target.enabled !== false,
        accountId: typeof target.accountId === 'string' ? target.accountId : '',
        title: typeof target.title === 'string' ? target.title : '',
        caption: typeof target.caption === 'string' ? target.caption : '',
        hashtags: normaliseHashtagString(target.hashtags || ''),
        settings: normaliseTargetSettings(platformKey, target.settings)
      }
    : {
        enabled: post.platforms?.includes(platformKey) ?? false,
        accountId: post.accountTargets?.[platformKey] || '',
        title: '',
        caption: '',
        hashtags: '',
        settings: createDefaultPlatformSettings(platformKey)
      };
}

export function getEffectiveTargetTitle(post, platformKey) {
  return getPlatformTarget(post, platformKey).title || post.title || '';
}

export function getEffectiveTargetCaption(post, platformKey) {
  return getPlatformTarget(post, platformKey).caption || post.caption || '';
}

export function getEffectiveTargetHashtags(post, platformKey) {
  return getPlatformTarget(post, platformKey).hashtags || normaliseHashtagString(post.hashtags || '');
}

export function buildPublishText(post, platformKey = '') {
  const caption = platformKey ? getEffectiveTargetCaption(post, platformKey) : (post.caption || '');
  const hashtags = platformKey ? getEffectiveTargetHashtags(post, platformKey) : normaliseHashtagString(post.hashtags || '');
  return [caption.trim(), hashtags.trim()].filter(Boolean).join('\n\n').trim();
}

export function countPrimaryAssetSlots(post) {
  const mediaItems = Array.isArray(post.media) ? post.media : [];
  const assetUrls = normaliseAssetUrls(post.assetUrls);
  return mediaItems.length
    + Number(Boolean(assetUrls.image))
    + Number(Boolean(assetUrls.video));
}

export function normaliseHashtagString(value) {
  const tokens = Array.isArray(value)
    ? value.map((entry) => String(entry).trim())
    : String(value || '')
      .split(/[\s,]+/)
      .map((entry) => entry.trim());

  return unique(tokens
    .filter(Boolean)
    .map((entry) => entry.replace(/^#+/, ''))
    .filter(Boolean)
    .map((entry) => `#${entry}`))
    .join(' ');
}

function normaliseAccountTargets(accountTargets, platforms, accounts, platformTargets = {}) {
  const safeTargets = {};

  for (const platform of platforms) {
    const requestedTarget = platformTargets?.[platform]?.accountId || accountTargets?.[platform];
    const matchingAccount = accounts.find((account) => account.id === requestedTarget && account.platform === platform);
    safeTargets[platform] = matchingAccount?.id
      ?? accounts.find((account) => account.platform === platform && account.isDefault)?.id
      ?? accounts.find((account) => account.platform === platform)?.id
      ?? '';
  }

  return safeTargets;
}

function normalisePlatformTargets(platformTargets, accountTargets, platforms, accounts) {
  const source = platformTargets && typeof platformTargets === 'object' ? platformTargets : {};
  const targetPlatforms = unique([
    ...platforms,
    ...Object.keys(source).filter((platform) => platformCatalog[platform])
  ]);
  const next = {};

  for (const platform of targetPlatforms) {
    const raw = source[platform] && typeof source[platform] === 'object' ? source[platform] : {};
    const requestedId = raw.accountId || accountTargets?.[platform];
    const matchingAccount = accounts.find((account) => account.id === requestedId && account.platform === platform);

    next[platform] = {
      enabled: platforms.includes(platform) || raw.enabled === true,
      accountId: matchingAccount?.id
        ?? accounts.find((account) => account.platform === platform && account.isDefault)?.id
        ?? accounts.find((account) => account.platform === platform)?.id
        ?? '',
      title: typeof raw.title === 'string' ? raw.title : '',
      caption: typeof raw.caption === 'string' ? raw.caption : '',
      hashtags: normaliseHashtagString(raw.hashtags || ''),
      settings: normaliseTargetSettings(platform, raw.settings)
    };
  }

  return next;
}

function normaliseAssetUrls(assetUrls = {}) {
  const source = assetUrls && typeof assetUrls === 'object' ? assetUrls : {};
  return {
    image: normaliseUrl(source.image || source.imageUrl),
    video: normaliseUrl(source.video || source.videoUrl),
    thumbnail: normaliseUrl(source.thumbnail || source.thumbnailUrl),
    audio: normaliseUrl(source.audio || source.audioUrl)
  };
}

function normaliseMediaItem(media = {}) {
  return {
    id: typeof media.id === 'string' && media.id ? media.id : crypto.randomUUID(),
    name: typeof media.name === 'string' ? media.name : 'Untitled asset',
    type: typeof media.type === 'string' ? media.type : 'application/octet-stream',
    kind: media.kind === 'video' || media.kind === 'image' || media.kind === 'gif' || media.kind === 'audio'
      ? media.kind
      : inferMediaKind(media.type),
    sizeBytes: Math.max(0, Number(media.sizeBytes || 0)),
    width: Math.max(0, Number(media.width || 0)),
    height: Math.max(0, Number(media.height || 0)),
    durationSeconds: Math.max(0, Number(media.durationSeconds || 0)),
    storageId: typeof media.storageId === 'string' ? media.storageId : '',
    previewUrl: typeof media.previewUrl === 'string' ? media.previewUrl : ''
  };
}

function normaliseDeliveryResult(result = {}) {
  return {
    platform: typeof result.platform === 'string' ? result.platform : '',
    ok: Boolean(result.ok),
    remoteId: typeof result.remoteId === 'string' ? result.remoteId : '',
    message: typeof result.message === 'string' ? result.message : '',
    accountId: typeof result.accountId === 'string' ? result.accountId : '',
    accountLabel: typeof result.accountLabel === 'string' ? result.accountLabel : '',
    attemptedAt: typeof result.attemptedAt === 'string' ? result.attemptedAt : ''
  };
}

function normalisePublishHistoryEntry(entry = {}) {
  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : crypto.randomUUID(),
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    outcome: typeof entry.outcome === 'string' ? entry.outcome : 'failed',
    statusBefore: typeof entry.statusBefore === 'string' ? entry.statusBefore : '',
    statusAfter: typeof entry.statusAfter === 'string' ? entry.statusAfter : '',
    summary: typeof entry.summary === 'string' ? entry.summary : '',
    reason: typeof entry.reason === 'string' ? entry.reason : '',
    nextAttemptAt: typeof entry.nextAttemptAt === 'string' ? entry.nextAttemptAt : '',
    attemptCount: Math.max(0, Number(entry.attemptCount || 0)),
    results: Array.isArray(entry.results) ? entry.results.map(normaliseDeliveryResult) : []
  };
}

function validateMediaForPlatform(platform, media) {
  const checks = [];
  const imageCount = media.filter((item) => item.kind === 'image').length;
  const gifCount = media.filter((item) => item.kind === 'gif').length;
  const videoCount = media.filter((item) => item.kind === 'video').length;

  if (platform.maxImages && imageCount > platform.maxImages) {
    checks.push(levelForConfidence(
      platform.maxImagesConfidence,
      `${platform.label} image count`,
      `This item carries ${imageCount} images and the ${platform.label} rule is ${platform.maxImages}.`
    ));
  }

  if (platform.maxVideoCount && videoCount > platform.maxVideoCount) {
    checks.push(levelForConfidence(
      platform.maxVideoCountConfidence,
      `${platform.label} video count`,
      `This item carries ${videoCount} videos and the ${platform.label} rule is ${platform.maxVideoCount}.`
    ));
  }

  for (const item of media) {
    if (item.kind === 'audio') {
      continue;
    }

    if (platform.maxImageBytes && item.kind === 'image' && item.sizeBytes > platform.maxImageBytes) {
      checks.push(levelForConfidence(
        platform.maxImageBytesConfidence,
        `${platform.label} image size`,
        `${item.name} is ${formatBytes(item.sizeBytes)} and the ${platform.label} image limit is ${formatBytes(platform.maxImageBytes)}.`
      ));
    }

    if (platform.maxGifBytes && item.kind === 'gif' && item.sizeBytes > platform.maxGifBytes) {
      checks.push(levelForConfidence(
        platform.maxGifBytesConfidence,
        `${platform.label} GIF size`,
        `${item.name} is ${formatBytes(item.sizeBytes)} and the ${platform.label} GIF limit is ${formatBytes(platform.maxGifBytes)}.`
      ));
    }

    if (platform.maxVideoBytes && item.kind === 'video' && item.sizeBytes > platform.maxVideoBytes) {
      checks.push(levelForConfidence(
        platform.maxVideoBytesConfidence,
        `${platform.label} video size`,
        `${item.name} is ${formatBytes(item.sizeBytes)} and the ${platform.label} video limit is ${formatBytes(platform.maxVideoBytes)}.`
      ));
    }

    if (platform.maxBlobBytes && item.sizeBytes > platform.maxBlobBytes) {
      checks.push(levelForConfidence(
        platform.maxBlobBytesConfidence,
        `${platform.label} blob size`,
        `${item.name} is ${formatBytes(item.sizeBytes)} and the ${platform.label} blob limit is ${formatBytes(platform.maxBlobBytes)}.`
      ));
    }
  }

  if (gifCount > 0 && videoCount > 0) {
    checks.push(warning(`${platform.label} mixed motion`, 'This queue item mixes GIF and video assets. Consider splitting them for cleaner delivery.'));
  }

  return checks;
}

function validateSchedulingConflicts(post, platformKey, account, peerPosts) {
  if (!account || !post.scheduleAt || !['approved', 'scheduled', 'retrying', 'failed'].includes(post.status)) {
    return [];
  }

  const checks = [];
  const overlapping = peerPosts.filter((peer) => {
    if (peer.id === post.id || !peer.platforms?.includes(platformKey)) {
      return false;
    }

    const sameAccount = (peer.platformTargets?.[platformKey]?.accountId || peer.accountTargets?.[platformKey]) === account.id;
    if (!sameAccount) {
      return false;
    }

    return Math.abs(differenceInMinutes(peer.scheduleAt, post.scheduleAt)) < 45;
  });

  if (overlapping.length) {
    checks.push(blocked(
      `${platformCatalog[platformKey].label} collision`,
      `There is already a post within 45 minutes on ${account.label}. Move one of them or switch accounts.`
    ));
  }

  const platform = platformCatalog[platformKey];
  if (platform.dailyLimit) {
    const sameDayCount = peerPosts.filter((peer) => {
      if (peer.id === post.id || !peer.platforms?.includes(platformKey)) {
        return false;
      }

      return (peer.platformTargets?.[platformKey]?.accountId || peer.accountTargets?.[platformKey]) === account.id
        && isSameLocalDay(peer.scheduleAt, post.scheduleAt);
    }).length + 1;

    if (sameDayCount > platform.dailyLimit) {
      checks.push(levelForConfidence(
        platform.dailyLimitConfidence,
        `${platform.label} daily cadence`,
        `${account.label} would have ${sameDayCount} posts that day and the current ${platform.label} launch rule is ${platform.dailyLimit}.`
      ));
    }
  }

  return checks;
}

function normalisePostStatus(status, fallback) {
  const legacyStatus = status === 'published' ? 'posted' : status;
  return POST_STATUSES.includes(legacyStatus) ? legacyStatus : fallback;
}

function inferMediaKind(contentType = '') {
  if (contentType.startsWith('video/')) {
    return 'video';
  }

  if (contentType.startsWith('audio/')) {
    return 'audio';
  }

  if (contentType === 'image/gif') {
    return 'gif';
  }

  return 'image';
}

export function createDefaultPlatformSettings(platformKey) {
  if (platformKey === 'instagram') {
    return {
      publishType: 'feed',
      shareToFeed: true,
      altText: '',
      firstComment: ''
    };
  }

  if (platformKey === 'tiktok') {
    return {
      postMode: 'draft',
      privacyLevel: '',
      allowComment: false,
      allowDuet: false,
      allowStitch: false,
      commercialContent: false,
      discloseYourBrand: false,
      discloseBrandedContent: false,
      musicUsageConfirmed: false,
      brandedContentPolicyConfirmed: false,
      videoCoverTimestampMs: 0
    };
  }

  if (platformKey === 'youtube' || platformKey === 'shorts') {
    return {
      privacyStatus: '',
      madeForKids: '',
      notifySubscribers: true,
      tags: '',
      category: '',
      playlist: ''
    };
  }

  return {};
}

function normaliseTargetSettings(platformKey, raw = {}) {
  const defaults = createDefaultPlatformSettings(platformKey);
  const source = raw && typeof raw === 'object' ? raw : {};

  if (platformKey === 'instagram') {
    return {
      publishType: ['feed', 'reel', 'carousel'].includes(source.publishType) ? source.publishType : defaults.publishType,
      shareToFeed: source.shareToFeed !== false,
      altText: typeof source.altText === 'string' ? source.altText : '',
      firstComment: typeof source.firstComment === 'string' ? source.firstComment : ''
    };
  }

  if (platformKey === 'tiktok') {
    return {
      postMode: ['draft', 'direct'].includes(source.postMode) ? source.postMode : defaults.postMode,
      privacyLevel: typeof source.privacyLevel === 'string' ? source.privacyLevel : '',
      allowComment: Boolean(source.allowComment),
      allowDuet: Boolean(source.allowDuet),
      allowStitch: Boolean(source.allowStitch),
      commercialContent: Boolean(source.commercialContent),
      discloseYourBrand: Boolean(source.discloseYourBrand),
      discloseBrandedContent: Boolean(source.discloseBrandedContent),
      musicUsageConfirmed: Boolean(source.musicUsageConfirmed),
      brandedContentPolicyConfirmed: Boolean(source.brandedContentPolicyConfirmed),
      videoCoverTimestampMs: Math.max(0, Number(source.videoCoverTimestampMs || 0))
    };
  }

  if (platformKey === 'youtube' || platformKey === 'shorts') {
    return {
      privacyStatus: ['private', 'unlisted', 'public'].includes(source.privacyStatus) ? source.privacyStatus : '',
      madeForKids: ['yes', 'no'].includes(source.madeForKids) ? source.madeForKids : '',
      notifySubscribers: source.notifySubscribers !== false,
      tags: normaliseTagString(source.tags || ''),
      category: typeof source.category === 'string' ? source.category : '',
      playlist: typeof source.playlist === 'string' ? source.playlist : ''
    };
  }

  return defaults;
}

function normaliseTagString(value) {
  return unique(String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean))
    .join(', ');
}

function platformFieldCheck(isStrict, label, message) {
  return isStrict ? blocked(label, message) : warning(label, message);
}

function normaliseUrl(value) {
  const candidate = String(value || '').trim();
  return /^https?:\/\//i.test(candidate) ? candidate : '';
}

function formatBytes(value) {
  if (!value) {
    return '0 B';
  }

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), sizes.length - 1);
  const number = value / (1024 ** power);
  return `${number.toFixed(number >= 10 ? 0 : 1)} ${sizes[power]}`;
}

function dedupeChecks(checks) {
  const seen = new Set();
  return checks.filter((item) => {
    const key = `${item.level}|${item.label}|${item.message}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function levelForConfidence(confidence, label, message) {
  if (confidence === 'official') {
    return blocked(label, message);
  }

  return warning(label, `${message} This is using a conservative studio default.`);
}

function ready(label, message) {
  return { level: 'ready', label, message };
}

function warning(label, message) {
  return { level: 'warning', label, message };
}

function blocked(label, message) {
  return { level: 'blocked', label, message };
}
