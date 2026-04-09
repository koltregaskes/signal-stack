export const PIPELINE_STATUSES = ['idea', 'draft', 'approved', 'scheduled', 'posted'];
export const DELIVERY_STATUSES = ['retrying', 'failed'];
export const POST_STATUSES = [...PIPELINE_STATUSES, ...DELIVERY_STATUSES];
export const FILTERS = ['all', ...POST_STATUSES];
export const ACCOUNT_MODES = ['dry-run', 'api'];
export const STATUS_FLOW = {
  idea: 'draft',
  draft: 'approved',
  approved: 'scheduled',
  scheduled: 'posted',
  posted: 'idea',
  retrying: 'failed',
  failed: 'draft'
};

export const STATUS_META = {
  idea: {
    label: 'Idea',
    tone: 'idea'
  },
  draft: {
    label: 'Draft',
    tone: 'draft'
  },
  approved: {
    label: 'Approved',
    tone: 'approved'
  },
  scheduled: {
    label: 'Scheduled',
    tone: 'scheduled'
  },
  retrying: {
    label: 'Retrying',
    tone: 'retrying'
  },
  failed: {
    label: 'Failed',
    tone: 'failed'
  },
  posted: {
    label: 'Posted',
    tone: 'posted'
  }
};

export const platformCatalog = {
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    shortLabel: 'IG',
    authProvider: 'instagram',
    requiredCapability: 'instagram',
    color: '#ff6a3d',
    requiresMedia: true,
    recommendedRatios: ['4:5', '1:1', '9:16'],
    captionLimit: 2200,
    captionLimitConfidence: 'conservative',
    maxCarouselItems: 10,
    maxCarouselItemsConfidence: 'conservative',
    accountRequirement: 'Professional account plus approved Meta app',
    defaultMode: 'dry-run'
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TT',
    authProvider: 'tiktok',
    requiredCapability: 'tiktok',
    color: '#2ad2c9',
    requiresMedia: true,
    recommendedRatios: ['9:16'],
    captionLimit: 2200,
    captionLimitConfidence: 'conservative',
    maxVideoSeconds: 600,
    maxVideoSecondsConfidence: 'official',
    maxVideoBytes: 4 * 1024 * 1024 * 1024,
    maxVideoBytesConfidence: 'official',
    dailyLimit: 15,
    dailyLimitConfidence: 'official',
    accountRequirement: 'Creator with approved Content Posting API access',
    defaultMode: 'dry-run'
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    shortLabel: 'YT',
    authProvider: 'youtube',
    requiredCapability: 'youtube',
    color: '#ff4d4d',
    requiresMedia: true,
    recommendedRatios: ['16:9'],
    captionLimit: 5000,
    captionLimitConfidence: 'conservative',
    accountRequirement: 'OAuth channel access',
    defaultMode: 'dry-run'
  },
  shorts: {
    key: 'shorts',
    label: 'Shorts',
    shortLabel: 'SH',
    authProvider: 'youtube',
    requiredCapability: 'shorts',
    color: '#ffd166',
    requiresMedia: true,
    recommendedRatios: ['9:16'],
    captionLimit: 100,
    captionLimitConfidence: 'conservative',
    maxVideoSeconds: 60,
    maxVideoSecondsConfidence: 'conservative',
    accountRequirement: 'YouTube channel access',
    defaultMode: 'dry-run'
  },
  x: {
    key: 'x',
    label: 'X',
    shortLabel: 'X',
    authProvider: 'x',
    color: '#a7f0ff',
    requiresMedia: false,
    supportsQuote: true,
    recommendedRatios: ['16:9', '1:1', '9:16'],
    captionLimit: 280,
    captionLimitConfidence: 'official',
    maxImages: 4,
    maxImagesConfidence: 'official',
    maxVideoCount: 1,
    maxVideoCountConfidence: 'official',
    maxImageBytes: 5 * 1024 * 1024,
    maxImageBytesConfidence: 'official',
    maxGifBytes: 15 * 1024 * 1024,
    maxGifBytesConfidence: 'official',
    maxVideoSeconds: 140,
    maxVideoSecondsConfidence: 'official',
    maxVideoBytes: 512 * 1024 * 1024,
    maxVideoBytesConfidence: 'official',
    accountRequirement: 'OAuth user auth with write access',
    defaultMode: 'dry-run'
  },
  bluesky: {
    key: 'bluesky',
    label: 'Bluesky',
    shortLabel: 'BS',
    authProvider: 'bluesky',
    color: '#67b9ff',
    requiresMedia: false,
    recommendedRatios: ['1:1', '16:9', '9:16'],
    captionLimit: 300,
    captionLimitConfidence: 'official',
    maxBlobBytes: 50 * 1024 * 1024,
    maxBlobBytesConfidence: 'official',
    accountRequirement: 'Handle plus app password',
    defaultMode: 'dry-run'
  },
  threads: {
    key: 'threads',
    label: 'Threads',
    shortLabel: 'TH',
    authProvider: 'threads',
    color: '#f8eee7',
    requiresMedia: false,
    recommendedRatios: ['1:1', '4:5', '9:16'],
    captionLimit: 500,
    captionLimitConfidence: 'conservative',
    accountRequirement: 'Meta app plus Threads auth',
    defaultMode: 'dry-run'
  }
};

export function getPlatformOptions() {
  return Object.values(platformCatalog);
}

export function getPlatformLabel(platformKey) {
  return platformCatalog[platformKey]?.label ?? platformKey;
}

export function getStatusLabel(status) {
  return STATUS_META[status]?.label ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export function getStatusTone(status) {
  return STATUS_META[status]?.tone ?? status;
}
