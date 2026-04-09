import fs from 'node:fs/promises';

import { ensureAccountAccess } from './auth.mjs';
import { getUploadPath } from './store.mjs';
import { buildPublishText, getEffectiveTargetTitle, getPlatformTarget } from '../shared/validation.js';

export async function publishPost(post, accounts, envStatus, runtimeConfig) {
  const results = [];

  for (const platform of post.platforms) {
    const account = accounts.find((item) => item.id === post.accountTargets?.[platform]);

    if (!account) {
      results.push(failure(platform, 'No account selected for this platform.', false));
      continue;
    }

    if (account.mode === 'dry-run') {
      results.push(success(platform, account, 'Dry-run delivery simulated.'));
      continue;
    }

    if (!envStatus[platform]?.ready) {
      results.push(failure(platform, 'Live API mode is selected but secrets are missing.', false));
      continue;
    }

    if (platform === 'bluesky') {
      results.push(await postToBluesky(post, account));
      continue;
    }

    if (platform === 'youtube' || platform === 'shorts') {
      results.push(await postToYouTube(post, account, runtimeConfig, platform));
      continue;
    }

    if (platform === 'instagram' || platform === 'tiktok') {
      const access = await ensureAccountAccess(account, runtimeConfig);
      if (!access.ok) {
        results.push(failure(platform, access.message, access.retryable));
        continue;
      }

      results.push(failure(platform, `The ${account.label} connection is live, but the ${platform} publish connector still needs its final media-transfer implementation.`, false));
      continue;
    }

    results.push(failure(platform, 'Live API delivery is scaffolded for this platform. Keep it in Dry Run until credentials and OAuth tokens are connected.', false));
  }

  return results;
}

async function postToBluesky(post, account) {
  if (post.media.some((item) => item.kind === 'video')) {
    return failure('bluesky', 'Live Bluesky delivery currently supports text and image posts only.', false);
  }

  const baseUrl = process.env.BLUESKY_PDS_URL || 'https://bsky.social';
  const sessionResponse = await fetch(`${baseUrl}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_APP_PASSWORD
    })
  });

  if (!sessionResponse.ok) {
    return failure('bluesky', 'Bluesky session creation failed. Check the app password and handle.', true);
  }

  const session = await sessionResponse.json();
  const embeds = [];

  for (const item of post.media.filter((entry) => entry.kind === 'image' && entry.storageId).slice(0, 4)) {
    const buffer = await fs.readFile(getUploadPath(item.storageId));
    const uploadResponse = await fetch(`${baseUrl}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        'Content-Type': item.type || 'application/octet-stream'
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      return failure('bluesky', `Uploading ${item.name} to Bluesky failed.`, true);
    }

    const payload = await uploadResponse.json();
    embeds.push({
      alt: item.name,
      image: payload.blob
    });
  }

  const record = {
    $type: 'app.bsky.feed.post',
    text: post.caption || post.title,
    createdAt: new Date().toISOString()
  };

  if (embeds.length) {
    record.embed = {
      $type: 'app.bsky.embed.images',
      images: embeds
    };
  }

  const createResponse = await fetch(`${baseUrl}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record
    })
  });

  if (!createResponse.ok) {
    return failure('bluesky', 'Creating the Bluesky post failed.', true);
  }

  const payload = await createResponse.json();
  return success('bluesky', account, 'Delivered to Bluesky.', payload.uri);
}

async function postToYouTube(post, account, runtimeConfig, platform) {
  const video = post.media.find((item) => item.kind === 'video' && item.storageId);
  if (!video?.storageId) {
    return failure(platform, 'YouTube live upload requires a stored video file.', false);
  }

  const access = await ensureAccountAccess(account, runtimeConfig);
  if (!access.ok) {
    return failure(platform, access.message, access.retryable);
  }

  const uploadPath = getUploadPath(video.storageId);
  const fileBuffer = await fs.readFile(uploadPath);
  const description = buildYouTubeDescription(post, platform);
  const target = getPlatformTarget(post, platform);
  const desiredPrivacy = target.settings.privacyStatus || (isShortsPlatform(platform) ? 'private' : 'public');
  const tagList = String(target.settings.tags || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const scheduledAt = new Date(post.scheduleAt);
  const isFutureSchedule = Number.isFinite(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now();
  const metadata = {
    snippet: {
      title: String(getEffectiveTargetTitle(post, platform) || 'Untitled upload').slice(0, 100),
      description: description.slice(0, 5000),
      ...(tagList.length ? { tags: tagList.slice(0, 500) } : {})
    },
    status: {
      privacyStatus: isFutureSchedule && desiredPrivacy === 'public' ? 'private' : desiredPrivacy,
      selfDeclaredMadeForKids: target.settings.madeForKids === 'yes'
    }
  };

  if (isFutureSchedule && desiredPrivacy === 'public') {
    metadata.status.publishAt = scheduledAt.toISOString();
  }

  const initiateResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(fileBuffer.byteLength),
      'X-Upload-Content-Type': video.type || 'video/mp4'
    },
    body: JSON.stringify(metadata)
  });

  if (!initiateResponse.ok) {
    return providerFailure(platform, account, await readProviderError(initiateResponse, 'YouTube upload session failed.'));
  }

  const uploadUrl = initiateResponse.headers.get('location');
  if (!uploadUrl) {
    return failure(platform, 'YouTube did not return an upload session URL.', true);
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access.accessToken}`,
      'Content-Length': String(fileBuffer.byteLength),
      'Content-Type': video.type || 'video/mp4'
    },
    body: fileBuffer
  });

  if (!uploadResponse.ok) {
    return providerFailure(platform, account, await readProviderError(uploadResponse, 'YouTube video upload failed.'));
  }

  const payload = await uploadResponse.json().catch(() => ({}));
  const remoteId = payload.id || '';
  const message = platform === 'shorts'
    ? 'Uploaded to YouTube with Shorts metadata.'
    : 'Uploaded to YouTube.';

  return success(platform, account, message, remoteId);
}

function isShortsPlatform(platform) {
  return platform === 'shorts';
}

function buildYouTubeDescription(post, platform) {
  const lines = [buildPublishText(post, platform === 'shorts' ? 'shorts' : 'youtube') || post.title || ''];
  if (post.notes) {
    lines.push('', `Production notes: ${post.notes}`);
  }
  if (post.sourceUrl) {
    lines.push('', `Source: ${post.sourceUrl}`);
  }
  if (platform === 'shorts' && !/\#shorts\b/i.test(lines.join('\n'))) {
    lines.push('', '#Shorts');
  }
  return lines.join('\n').trim();
}

async function readProviderError(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message || payload?.message || fallbackMessage;
  return {
    status: response.status,
    message
  };
}

function providerFailure(platform, account, details) {
  if ([401, 403].includes(details.status)) {
    account.authStatus = 'needs_reauth';
    account.lastAuthError = details.message;
    account.authUpdatedAt = new Date().toISOString();
    account.credentials = '';
    return failure(platform, details.message, false);
  }

  if (details.status === 429 || details.status >= 500) {
    return failure(platform, details.message, true);
  }

  return failure(platform, details.message, false);
}

function success(platform, account, message, remoteId = '') {
  return {
    ok: true,
    platform,
    accountId: account.id,
    accountLabel: account.label,
    remoteId,
    message
  };
}

function failure(platform, message, retryable) {
  return {
    ok: false,
    platform,
    message,
    retryable
  };
}
