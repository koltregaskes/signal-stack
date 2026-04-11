import {
  FILTERS,
  PIPELINE_STATUSES,
  STATUS_FLOW,
  getPlatformLabel,
  getPlatformOptions,
  getStatusLabel,
  getStatusTone,
  platformCatalog
} from '../shared/platforms.js?v=20260411a';
import {
  addDays,
  buildFutureDate,
  formatDate,
  formatTime,
  getStartOfMonth,
  getStartOfWeek,
  isSameLocalDay,
  isSameLocalMonth,
  normaliseLocalDateTime,
  setDateKeepingTime
} from '../shared/time.js?v=20260411a';
import {
  buildPublishText,
  countPrimaryAssetSlots,
  createDefaultPlatformSettings,
  createEmptyPost,
  getEffectiveTargetTitle,
  normaliseAccount,
  normaliseHashtagString,
  normalisePost,
  summariseChecks,
  validatePost
} from '../shared/validation.js?v=20260411a';
const CACHE_KEY = 'signal-stack-cache-v4';
const LOCAL_DRAFT_KEY = 'signal-stack-composer-draft-v1';
const LAYOUT_PREFS_KEY = 'signal-stack-layout-v1';
const CALENDAR_VIEWS = ['week', 'month'];
const COMPOSER_TABS = ['targets', 'copy', 'support'];
const INSPECTOR_TABS = ['checks', 'delivery', 'accounts'];

const templates = {
  'reel-teaser': {
    title: 'Reel teaser pulse',
    caption: 'A tight vertical cut to open the day and pull attention toward the full drop later on.',
    hashtags: '#teaser #reel',
    platforms: ['instagram', 'tiktok', 'shorts'],
    group: 'Art Drop',
    mediaType: 'video',
    ratio: '9:16',
    duration: 18,
    status: 'draft',
    assetUrls: {
      video: 'https://cdn.example.com/reel-teaser.mp4',
      thumbnail: 'https://cdn.example.com/reel-teaser.jpg'
    },
    notes: 'Use the strongest opening frame and keep the CTA in the final second.'
  },
  'youtube-drop': {
    title: 'YouTube release support',
    caption: 'Main upload goes live first, then the cutdown clips do the heavy lifting for the rest of the day.',
    hashtags: '#launch #studio',
    platforms: ['youtube', 'shorts', 'instagram'],
    group: 'Video Push',
    mediaType: 'video',
    ratio: '16:9',
    duration: 480,
    status: 'approved',
    assetUrls: {
      video: 'https://cdn.example.com/youtube-main.mp4',
      thumbnail: 'https://cdn.example.com/youtube-thumb.jpg'
    },
    notes: 'Prep one thumbnail for the main upload and one vertical cut for Shorts.'
  },
  'quote-pulse': {
    title: 'Quote pulse callback',
    caption: 'One sharp line, one source link, one reason to click through.',
    hashtags: '#quote #callback',
    platforms: ['x', 'threads', 'bluesky'],
    group: 'Launch Beat',
    mediaType: 'mixed',
    ratio: '9:16',
    duration: 24,
    sourceUrl: 'https://x.com/example/status/1234567890',
    quoteMode: true,
    status: 'idea',
    notes: 'If the main X lane is crowded, route this to the alternate account.'
  }
};

const PLATFORM_PANEL_COPY = {
  instagram: {
    eyebrow: 'Instagram brief',
    title: 'Pick the surface and the feed treatment.',
    hint: 'Choose whether this lands as a feed post, Reel, or carousel, then add any accessibility or first-comment extras.'
  },
  tiktok: {
    eyebrow: 'TikTok brief',
    title: 'Mirror the real TikTok posting controls.',
    hint: 'Direct Post needs creator-facing metadata, privacy, interaction toggles, and explicit consent before the connector should publish.'
  },
  youtube: {
    eyebrow: 'YouTube brief',
    title: 'Set the upload details that matter at launch.',
    hint: 'YouTube needs explicit privacy and audience choices, while tags and playlists help keep the upload tidy once it lands.'
  },
  shorts: {
    eyebrow: 'Shorts brief',
    title: 'Keep the Shorts upload profile tight.',
    hint: 'This shares the YouTube connector but should stay vertical, compact, and explicitly audience-scoped.'
  }
};

const state = {
  posts: [],
  accounts: [],
  alerts: [],
  activity: [],
  session: {
    requireAuth: false,
    authenticated: true
  },
  config: {
    envStatus: createDemoEnvStatus(),
    platformCatalog,
    runtime: {}
  },
  filter: 'all',
  search: '',
  activePostId: '',
  calendarFocusDate: getStartOfWeek(),
  calendarView: 'week',
  backendReady: false,
  demoMode: false,
  ui: loadLayoutPrefs(),
  composerTab: 'targets',
  composerMedia: [],
  composerPlatformTargets: {},
  composerDraftSavedAt: '',
  composerHydrating: false,
  dragPostId: '',
  pendingRoutePostId: ''
};

let draftSaveTimer = 0;

const dom = {
  workspace: document.getElementById('workspace'),
  hero: document.getElementById('launchHero'),
  composerForm: document.getElementById('composerForm'),
  titleInput: document.getElementById('titleInput'),
  scheduleInput: document.getElementById('scheduleInput'),
  captionInput: document.getElementById('captionInput'),
  captionCount: document.getElementById('captionCount'),
  hashtagsInput: document.getElementById('hashtagsInput'),
  platformOptions: document.getElementById('platformOptions'),
  platformTargetGrid: document.getElementById('platformTargetGrid'),
  pipelineRail: document.getElementById('pipelineRail'),
  groupInput: document.getElementById('groupInput'),
  statusInput: document.getElementById('statusInput'),
  mediaTypeInput: document.getElementById('mediaTypeInput'),
  ratioInput: document.getElementById('ratioInput'),
  durationInput: document.getElementById('durationInput'),
  mediaCountInput: document.getElementById('mediaCountInput'),
  imageUrlInput: document.getElementById('imageUrlInput'),
  videoUrlInput: document.getElementById('videoUrlInput'),
  thumbnailUrlInput: document.getElementById('thumbnailUrlInput'),
  audioUrlInput: document.getElementById('audioUrlInput'),
  sourceUrlInput: document.getElementById('sourceUrlInput'),
  quoteToggle: document.getElementById('quoteToggle'),
  notesInput: document.getElementById('notesInput'),
  draftPersistenceNote: document.getElementById('draftPersistenceNote'),
  saveDraftBtn: document.getElementById('saveDraftBtn'),
  resetComposerBtn: document.getElementById('resetComposerBtn'),
  duplicateComposerBtn: document.getElementById('duplicateComposerBtn'),
  compactModeBtn: document.getElementById('compactModeBtn'),
  heroCollapseBtn: document.getElementById('heroCollapseBtn'),
  inspectorToggleBtn: document.getElementById('inspectorToggleBtn'),
  moveTargetsBtn: document.getElementById('moveTargetsBtn'),
  mediaInput: document.getElementById('mediaInput'),
  clearMediaBtn: document.getElementById('clearMediaBtn'),
  mediaList: document.getElementById('mediaList'),
  composerTargetsTabBtn: document.getElementById('composerTargetsTabBtn'),
  composerCopyTabBtn: document.getElementById('composerCopyTabBtn'),
  composerSupportTabBtn: document.getElementById('composerSupportTabBtn'),
  composerTargetsPanel: document.getElementById('composerTargetsPanel'),
  composerCopyPanel: document.getElementById('composerCopyPanel'),
  composerSupportPanel: document.getElementById('composerSupportPanel'),
  studioRail: document.getElementById('studioRail'),
  inspectorChecksTabBtn: document.getElementById('inspectorChecksTabBtn'),
  inspectorDeliveryTabBtn: document.getElementById('inspectorDeliveryTabBtn'),
  inspectorAccountsTabBtn: document.getElementById('inspectorAccountsTabBtn'),
  inspectorChecksPanel: document.getElementById('inspectorChecksPanel'),
  inspectorDeliveryPanel: document.getElementById('inspectorDeliveryPanel'),
  inspectorAccountsPanel: document.getElementById('inspectorAccountsPanel'),
  validationSummary: document.getElementById('validationSummary'),
  validationList: document.getElementById('validationList'),
  deliveryRunList: document.getElementById('deliveryRunList'),
  accountGrid: document.getElementById('accountGrid'),
  queueList: document.getElementById('queueList'),
  calendarGrid: document.getElementById('calendarGrid'),
  calendarHeading: document.getElementById('calendarHeading'),
  filterTabs: document.getElementById('filterTabs'),
  searchInput: document.getElementById('searchInput'),
  heroMetrics: document.getElementById('heroMetrics'),
  alertList: document.getElementById('alertList'),
  activityList: document.getElementById('activityList'),
  modeBadge: document.getElementById('modeBadge'),
  connectorBadge: document.getElementById('connectorBadge'),
  backendBadge: document.getElementById('backendBadge'),
  runDueBtn: document.getElementById('runDueBtn'),
  manageAccountsBtn: document.getElementById('manageAccountsBtn'),
  openAccountCreateBtn: document.getElementById('openAccountCreateBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  importQueueBtn: document.getElementById('importQueueBtn'),
  exportQueueBtn: document.getElementById('exportQueueBtn'),
  importQueueInput: document.getElementById('importQueueInput'),
  previousWeekBtn: document.getElementById('previousWeekBtn'),
  currentWeekBtn: document.getElementById('currentWeekBtn'),
  nextWeekBtn: document.getElementById('nextWeekBtn'),
  calendarWeekViewBtn: document.getElementById('calendarWeekViewBtn'),
  calendarMonthViewBtn: document.getElementById('calendarMonthViewBtn'),
  routeDialog: document.getElementById('routeDialog'),
  routeForm: document.getElementById('routeForm'),
  routeFields: document.getElementById('routeFields'),
  accountDialog: document.getElementById('accountDialog'),
  accountForm: document.getElementById('accountForm'),
  accountIdInput: document.getElementById('accountIdInput'),
  accountPlatformInput: document.getElementById('accountPlatformInput'),
  accountLabelInput: document.getElementById('accountLabelInput'),
  accountHandleInput: document.getElementById('accountHandleInput'),
  accountModeInput: document.getElementById('accountModeInput'),
  accountStatusInput: document.getElementById('accountStatusInput'),
  accountDefaultInput: document.getElementById('accountDefaultInput'),
  sessionDialog: document.getElementById('sessionDialog'),
  sessionForm: document.getElementById('sessionForm'),
  sessionPasswordInput: document.getElementById('sessionPasswordInput'),
  sessionError: document.getElementById('sessionError'),
  queueCardTemplate: document.getElementById('queueCardTemplate')
};

renderPlatformOptions();
populateAccountPlatformSelect();
attachEvents();
await bootstrap();

function renderPlatformOptions() {
  dom.platformOptions.innerHTML = getPlatformOptions()
    .map((platform) => `
      <label class="platform-option" style="--platform-color: ${platform.color}">
        <input type="checkbox" name="platforms" value="${platform.key}" />
        <span class="platform-option__box">
          <strong>${platform.label}</strong>
          <small>${platform.accountRequirement}</small>
        </span>
      </label>
    `)
    .join('');
}

function populateAccountPlatformSelect() {
  dom.accountPlatformInput.innerHTML = getPlatformOptions()
    .map((platform) => `<option value="${platform.key}">${platform.label}</option>`)
    .join('');
}

function attachEvents() {
  dom.composerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveComposer();
  });

  dom.saveDraftBtn.addEventListener('click', async () => saveComposer('draft'));
  dom.resetComposerBtn.addEventListener('click', resetComposer);
  dom.duplicateComposerBtn.addEventListener('click', duplicateComposer);
  dom.compactModeBtn.addEventListener('click', () => toggleLayoutPref('compact'));
  dom.heroCollapseBtn.addEventListener('click', () => toggleLayoutPref('heroCollapsed'));
  dom.inspectorToggleBtn.addEventListener('click', () => toggleLayoutPref('inspectorOpen'));
  dom.moveTargetsBtn.addEventListener('click', () => openRouteDialog(state.activePostId || collectComposerValues().id));
  dom.mediaInput.addEventListener('change', handleMediaSelection);
  dom.clearMediaBtn.addEventListener('click', clearComposerMedia);
  dom.captionInput.addEventListener('input', () => {
    updateCaptionCount();
    renderValidationRail();
    queueComposerDraftSave();
  });
  dom.hashtagsInput.addEventListener('change', () => {
    dom.hashtagsInput.value = normaliseHashtagString(dom.hashtagsInput.value);
    renderValidationRail();
    queueComposerDraftSave();
  });
  dom.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderQueue();
    renderCalendar();
  });
  dom.runDueBtn.addEventListener('click', runDueNow);
  dom.manageAccountsBtn.addEventListener('click', () => dom.accountDialog.showModal());
  dom.openAccountCreateBtn.addEventListener('click', () => openAccountDialog());
  dom.logoutBtn.addEventListener('click', logoutSession);
  dom.importQueueBtn.addEventListener('click', () => dom.importQueueInput.click());
  dom.importQueueInput.addEventListener('change', handleQueueImport);
  dom.exportQueueBtn.addEventListener('click', exportQueue);
  dom.previousWeekBtn.addEventListener('click', shiftCalendarFocusBackward);
  dom.currentWeekBtn.addEventListener('click', () => {
    state.calendarFocusDate = state.calendarView === 'month' ? getStartOfMonth() : getStartOfWeek();
    renderCalendar();
  });
  dom.nextWeekBtn.addEventListener('click', shiftCalendarFocusForward);
  dom.calendarWeekViewBtn.addEventListener('click', () => switchCalendarView('week'));
  dom.calendarMonthViewBtn.addEventListener('click', () => switchCalendarView('month'));
  [dom.composerTargetsTabBtn, dom.composerCopyTabBtn, dom.composerSupportTabBtn].forEach((button) => {
    button.addEventListener('click', () => switchComposerTab(button.dataset.composerTab));
  });
  [dom.inspectorChecksTabBtn, dom.inspectorDeliveryTabBtn, dom.inspectorAccountsTabBtn].forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = button.id === 'inspectorAccountsTabBtn'
        ? 'accounts'
        : button.id === 'inspectorDeliveryTabBtn'
          ? 'delivery'
          : 'checks';
      switchInspectorTab(nextTab);
    });
  });

  dom.composerForm.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('change', () => {
      if (field.name === 'platforms' || field.closest('.field--platforms')) {
        syncComposerPlatformTargets();
        renderPlatformTargetGrid();
      }
      renderPipelineRail();
      renderValidationRail();
      queueComposerDraftSave();
    });
    field.addEventListener('input', () => {
      if ([dom.imageUrlInput, dom.videoUrlInput, dom.thumbnailUrlInput, dom.audioUrlInput].includes(field)) {
        updateDerivedMediaFields();
        renderMediaList();
      }
      if ([dom.titleInput, dom.sourceUrlInput, dom.notesInput].includes(field)) {
        renderValidationRail();
      }
      if ([dom.durationInput, dom.mediaCountInput, dom.ratioInput, dom.scheduleInput, dom.statusInput].includes(field)) {
        renderPipelineRail();
        renderValidationRail();
      }
      queueComposerDraftSave();
    });
  });

  dom.platformTargetGrid.addEventListener('input', handlePlatformTargetInput);
  dom.platformTargetGrid.addEventListener('change', handlePlatformTargetInput);

  document.querySelectorAll('[data-template]').forEach((button) => {
    button.addEventListener('click', () => applyTemplate(button.dataset.template));
  });

  dom.queueList.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const postId = button.closest('[data-post-id]')?.dataset.postId;
    if (!postId) return;
    if (button.classList.contains('action-load')) loadPost(postId);
    if (button.classList.contains('action-review')) {
      loadPost(postId);
      switchInspectorTab('delivery');
    }
    if (button.classList.contains('action-duplicate')) await duplicatePost(postId);
    if (button.classList.contains('action-route')) {
      loadPost(postId);
      openRouteDialog(postId);
    }
    if (button.classList.contains('action-toggle')) await cycleStatus(postId);
    if (button.classList.contains('action-delete')) await removePost(postId);
  });

  dom.queueList.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-post-id]');
    if (!card) return;
    state.dragPostId = card.dataset.postId;
    event.dataTransfer.setData('text/plain', state.dragPostId);
  });

  dom.calendarGrid.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-post-id]');
    if (!card) return;
    state.dragPostId = card.dataset.postId;
    event.dataTransfer.setData('text/plain', state.dragPostId);
  });

  dom.calendarGrid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-load-post]');
    if (card) {
      loadPost(card.dataset.loadPost);
    }
  });

  dom.calendarGrid.addEventListener('dragover', (event) => {
    const column = event.target.closest('[data-day-date]');
    if (!column) return;
    event.preventDefault();
    column.classList.add('is-drop-target');
  });

  dom.calendarGrid.addEventListener('dragleave', (event) => {
    const column = event.target.closest('[data-day-date]');
    column?.classList.remove('is-drop-target');
  });

  dom.calendarGrid.addEventListener('drop', async (event) => {
    const column = event.target.closest('[data-day-date]');
    if (!column) return;
    event.preventDefault();
    column.classList.remove('is-drop-target');
    const postId = event.dataTransfer.getData('text/plain') || state.dragPostId;
    if (postId) {
      await movePostToCalendarDate(postId, column.dataset.dayDate);
    }
  });

  dom.accountGrid.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const accountId = button.closest('[data-account-id]')?.dataset.accountId;
    if (!accountId) return;
    if (button.classList.contains('action-edit-account')) openAccountDialog(accountId);
    if (button.classList.contains('action-delete-account')) await deleteAccount(accountId);
    if (button.classList.contains('action-connect-account')) connectAccount(accountId);
    if (button.classList.contains('action-disconnect-account')) await disconnectAccount(accountId);
  });

  dom.alertList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-alert-id]');
    if (button) await resolveAlert(button.dataset.alertId);
  });

  dom.mediaList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-media-id]');
    if (button) removeComposerMedia(button.dataset.removeMediaId);
  });

  dom.filterTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    renderFilterTabs();
    renderQueue();
    renderCalendar();
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById(button.dataset.closeDialog)?.close();
    });
  });

  dom.routeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    dom.routeFields.querySelectorAll('select[data-platform]').forEach((select) => {
      const platform = select.dataset.platform;
      state.composerPlatformTargets[platform] = {
        ...createTargetDraft(platform, state.composerPlatformTargets[platform]),
        enabled: true,
        accountId: select.value
      };
    });

    const existing = state.posts.find((post) => post.id === state.pendingRoutePostId);
    if (existing) {
      await savePostObject({
        ...existing,
        platformTargets: { ...state.composerPlatformTargets }
      });
    } else {
      renderPlatformTargetGrid();
      renderValidationRail();
      queueComposerDraftSave();
    }
    dom.routeDialog.close();
    renderAll();
    showBanner('Account routes updated.');
  });

  dom.accountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveAccountFromDialog();
  });

  dom.sessionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loginSession();
  });
}

async function bootstrap() {
  const cached = loadCache();
  await refreshSession();

  if (state.session.requireAuth && !state.session.authenticated) {
    state.backendReady = true;
    state.demoMode = false;
    state.posts = [];
    state.accounts = [];
    state.alerts = [];
    state.activity = [];
    state.activePostId = '';
    setComposerFromPost(createEmptyPost(), { persistDraft: false });
    renderAll();
    handleRuntimeQuery();
    dom.sessionDialog.showModal();
    registerServiceWorker();
    return;
  }

  try {
    const response = await fetch('/api/bootstrap', { headers: { Accept: 'application/json' } });
    if (response.status === 401) {
      await refreshSession();
      state.backendReady = true;
      state.demoMode = false;
      setComposerFromPost(createEmptyPost(), { persistDraft: false });
      renderAll();
      dom.sessionDialog.showModal();
      registerServiceWorker();
      return;
    }

    if (!response.ok) {
      throw new Error('bootstrap failed');
    }

    const payload = await response.json();
    state.backendReady = true;
    state.demoMode = false;
    applyBootstrap(payload);
    persistCache();
  } catch {
    state.backendReady = false;
    state.demoMode = true;
    applyBootstrap(cached ?? createDemoBootstrap());
    if (!cached) {
      showBanner('Backend not detected, so Signal Stack is running in static preview mode.');
    }
  }

  const localDraft = loadLocalDraft(state.accounts);
  const initialPost = localDraft?.post
    ?? state.posts.find((post) => post.id === state.activePostId)
    ?? state.posts[0]
    ?? createEmptyPost();

  setComposerFromPost(initialPost, { persistDraft: false });
  state.composerDraftSavedAt = localDraft?.savedAt || '';
  renderAll();

  if (localDraft?.post) {
    showBanner('Restored the most recent local composer draft.');
  }

  handleRuntimeQuery();
  registerServiceWorker();
}

async function refreshSession() {
  try {
    const response = await fetch('/api/session', { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error('session failed');
    }

    const payload = await response.json();
    state.session = {
      requireAuth: Boolean(payload.requireAuth),
      authenticated: Boolean(payload.authenticated)
    };
  } catch {
    state.session = {
      requireAuth: false,
      authenticated: true
    };
  }
}

async function loginSession() {
  const password = dom.sessionPasswordInput.value;
  const response = await fetch('/api/session/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    dom.sessionError.hidden = false;
    dom.sessionError.textContent = 'That password did not unlock this Signal Stack instance.';
    return;
  }

  dom.sessionError.hidden = true;
  dom.sessionPasswordInput.value = '';
  dom.sessionDialog.close();
  await bootstrap();
  showBanner('Signal Stack unlocked.');
}

async function logoutSession() {
  await fetch('/api/session/logout', { method: 'POST' });
  state.session = {
    requireAuth: true,
    authenticated: false
  };
  localStorage.removeItem(CACHE_KEY);
  state.posts = [];
  state.accounts = [];
  state.alerts = [];
  state.activity = [];
  state.activePostId = '';
  setComposerFromPost(createEmptyPost(), { persistDraft: false });
  renderAll();
  dom.sessionDialog.showModal();
  showBanner('Signal Stack locked.');
}

function handleRuntimeQuery() {
  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  const provider = params.get('provider');
  const message = params.get('message');

  if (!auth && !provider && !message) {
    return;
  }

  if (auth === 'connected' && provider) {
    showBanner(`${getPlatformLabel(provider)} account connected.`);
  } else if (auth === 'failed') {
    showBanner(message || 'Account connection failed.');
  } else if (auth === 'login-required') {
    showBanner('Unlock the studio before connecting accounts.');
  }

  window.history.replaceState({}, document.title, window.location.pathname);
}

function applyBootstrap(payload) {
  state.accounts = (payload.accounts || []).map((account) => normaliseAccount(account, payload.config?.envStatus || {}));
  state.posts = (payload.posts || []).map((post) => normalisePost(post, state.accounts));
  state.alerts = payload.alerts || [];
  state.activity = payload.activity || [];
  state.calendarView = payload.calendarView || state.calendarView;
  state.config = {
    envStatus: payload.config?.envStatus || createDemoEnvStatus(),
    platformCatalog: payload.config?.platformCatalog || platformCatalog,
    runtime: payload.config?.runtime || {}
  };
  state.activePostId = state.posts[0]?.id || '';
  state.calendarFocusDate = getStartOfWeek(state.posts[0]?.scheduleAt || new Date());
}

function createDemoBootstrap() {
  const accounts = [
    normaliseAccount({ platform: 'instagram', label: 'IG Main', handle: '@kol.art', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'tiktok', label: 'TikTok Main', handle: '@kolclips', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'youtube', label: 'YouTube Main', handle: 'Kol Signal Studio', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'shorts', label: 'Shorts Main', handle: 'Kol Signal Shorts', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'x', label: 'X Main', handle: '@kolsignal', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'x', label: 'X Alt', handle: '@kolsignal_alt', mode: 'dry-run', isDefault: false }, {}),
    normaliseAccount({ platform: 'bluesky', label: 'Bluesky Main', handle: 'koltregaskes.bsky.social', mode: 'dry-run', isDefault: true }, {}),
    normaliseAccount({ platform: 'threads', label: 'Threads Main', handle: '@kol.art', mode: 'dry-run', isDefault: true }, {})
  ];

  const posts = [
    normalisePost({
      title: 'Morning teaser frame set',
      caption: 'A vertical teaser to warm up the feed before the full image batch lands later today.',
      hashtags: '#teaser #drop',
      scheduleAt: buildFutureDate(1, 9, 30),
      platforms: ['instagram', 'tiktok', 'shorts'],
      group: 'Art Drop',
      mediaType: 'video',
      ratio: '9:16',
      duration: 21,
      media: [demoMedia('teaser-cut.mp4', 'video/mp4', 'video', 48 * 1024 * 1024, 1080, 1920, 21)],
      assetUrls: {
        video: 'https://cdn.example.com/assets/teaser-cut.mp4',
        thumbnail: 'https://cdn.example.com/assets/teaser-thumb.jpg'
      },
      status: 'scheduled'
    }, accounts),
    normalisePost({
      title: 'YouTube main upload support',
      caption: 'Main video drops at lunch, then the cutdown clips do the heavy lifting for the rest of the day.',
      hashtags: '#launch #video',
      scheduleAt: buildFutureDate(2, 12, 15),
      platforms: ['youtube', 'shorts', 'instagram'],
      group: 'Video Push',
      mediaType: 'video',
      ratio: '16:9',
      duration: 540,
      media: [demoMedia('main-drop.mp4', 'video/mp4', 'video', 320 * 1024 * 1024, 1920, 1080, 540)],
      assetUrls: {
        video: 'https://cdn.example.com/assets/main-drop.mp4',
        thumbnail: 'https://cdn.example.com/assets/main-drop-thumb.jpg'
      },
      status: 'approved'
    }, accounts),
    normalisePost({
      title: 'Trailer quote pulse',
      caption: 'A short trailer pulse built around one key line and a link back to the source post.',
      hashtags: '#quote #callback',
      scheduleAt: buildFutureDate(3, 18, 45),
      platforms: ['x', 'threads', 'bluesky'],
      group: 'Launch Beat',
      mediaType: 'mixed',
      ratio: '9:16',
      duration: 32,
      media: [demoMedia('quote-frame.jpg', 'image/jpeg', 'image', 2 * 1024 * 1024, 1080, 1350, 0)],
      assetUrls: {
        image: 'https://cdn.example.com/assets/quote-frame.jpg'
      },
      sourceUrl: 'https://x.com/example/status/1234567890',
      quoteMode: true,
      status: 'idea'
    }, accounts)
  ];

  return {
    posts,
    accounts,
    alerts: [],
    activity: [],
    config: {
      envStatus: createDemoEnvStatus(),
      platformCatalog,
      runtime: {}
    }
  };
}

function createDemoEnvStatus() {
  return Object.fromEntries(Object.keys(platformCatalog).map((platform) => [platform, {
    ready: false,
    appReady: false,
    secureStorageReady: false,
    presentKeys: [],
    requiredKeys: []
  }]));
}

function demoMedia(name, type, kind, sizeBytes, width, height, durationSeconds) {
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

function renderAll() {
  renderWorkspaceLayout();
  renderConnectionBadges();
  renderHeroMetrics();
  renderFilterTabs();
  renderPipelineRail();
  renderComposerTabs();
  renderPlatformTargetGrid();
  renderValidationRail();
  renderDeliveryInspector();
  renderDraftPersistenceNote();
  renderMediaList();
  renderAccounts();
  renderQueue();
  renderCalendar();
  renderAlerts();
  renderActivity();
}

function renderWorkspaceLayout() {
  document.body.classList.toggle('layout--compact', state.ui.compact);
  dom.hero.classList.toggle('hero--collapsed', state.ui.heroCollapsed);
  dom.workspace.classList.toggle('workspace--inspector-hidden', !state.ui.inspectorOpen);
  dom.studioRail.classList.toggle('studio-rail--hidden', !state.ui.inspectorOpen);

  setToggleButtonState(dom.compactModeBtn, state.ui.compact);
  setToggleButtonState(dom.heroCollapseBtn, !state.ui.heroCollapsed);
  setToggleButtonState(dom.inspectorToggleBtn, state.ui.inspectorOpen);

  const inspectorMap = [
    ['checks', dom.inspectorChecksTabBtn, dom.inspectorChecksPanel],
    ['delivery', dom.inspectorDeliveryTabBtn, dom.inspectorDeliveryPanel],
    ['accounts', dom.inspectorAccountsTabBtn, dom.inspectorAccountsPanel]
  ];

  inspectorMap.forEach(([tab, button, panel]) => {
    const isActive = state.ui.inspectorTab === tab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.setAttribute('tabindex', isActive ? '0' : '-1');
    panel.hidden = !isActive;
    panel.classList.toggle('inspector-panel--active', isActive);
  });
}

function setToggleButtonState(button, active) {
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
}

function toggleLayoutPref(key) {
  if (!(key in state.ui)) {
    return;
  }

  state.ui[key] = !state.ui[key];
  persistLayoutPrefs();
  renderWorkspaceLayout();
}

function switchInspectorTab(nextTab) {
  if (!INSPECTOR_TABS.includes(nextTab) || state.ui.inspectorTab === nextTab) {
    return;
  }

  state.ui.inspectorTab = nextTab;
  persistLayoutPrefs();
  renderWorkspaceLayout();
}

function switchComposerTab(nextTab) {
  if (!COMPOSER_TABS.includes(nextTab) || state.composerTab === nextTab) {
    return;
  }

  state.composerTab = nextTab;
  renderComposerTabs();
}

function renderComposerTabs() {
  const tabMap = [
    ['targets', dom.composerTargetsTabBtn, dom.composerTargetsPanel],
    ['copy', dom.composerCopyTabBtn, dom.composerCopyPanel],
    ['support', dom.composerSupportTabBtn, dom.composerSupportPanel]
  ];

  tabMap.forEach(([tab, button, panel]) => {
    const isActive = state.composerTab === tab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.setAttribute('tabindex', isActive ? '0' : '-1');
    panel.hidden = !isActive;
    panel.classList.toggle('composer-panel--active', isActive);
  });
}

function renderConnectionBadges() {
  const readyCount = Object.values(state.config.envStatus || {}).filter((item) => item.appReady || item.ready).length;
  const totalCount = Object.keys(platformCatalog).length;
  const liveAccounts = state.accounts.filter((account) => account.mode === 'api').length;
  const connectedAccounts = state.accounts.filter((account) => account.authStatus === 'connected').length;

  dom.modeBadge.textContent = liveAccounts ? `${liveAccounts} live API account${liveAccounts === 1 ? '' : 's'}` : 'Dry-run launch mode';
  dom.connectorBadge.textContent = `${readyCount}/${totalCount} connector configs ready | ${connectedAccounts} connected`;
  dom.backendBadge.textContent = state.session.requireAuth && !state.session.authenticated
    ? 'Session locked'
    : state.backendReady
      ? 'Local backend live'
      : 'Static preview mode';
  dom.logoutBtn.hidden = !(state.session.requireAuth && state.session.authenticated);
}

function renderHeroMetrics() {
  const now = Date.now();
  const nextSevenDays = now + 7 * 24 * 60 * 60 * 1000;
  const scheduledSoon = state.posts.filter((post) => {
    const time = new Date(post.scheduleAt).getTime();
    return ['approved', 'scheduled'].includes(post.status) && time >= now && time <= nextSevenDays;
  }).length;
  const needsAttention = state.posts.filter((post) => ['failed', 'retrying'].includes(post.status)).length;
  const posted = state.posts.filter((post) => post.status === 'posted').length;
  const readyRoutes = state.accounts.filter((account) => {
    if (account.mode === 'dry-run') {
      return true;
    }

    const envReady = state.config.envStatus[account.platform]?.ready;
    return envReady && account.authStatus === 'connected';
  }).length;

  dom.heroMetrics.innerHTML = [
    metricCard('Pipeline', state.posts.length, 'All items flowing through the studio'),
    metricCard('Live this week', scheduledSoon, 'Approved or scheduled work in the next 7 days'),
    metricCard('Attention', needsAttention, 'Retrying or failed deliveries'),
    metricCard('Posted', posted, `${readyRoutes} accounts ready to publish or simulate`)
  ].join('');
}

function renderFilterTabs() {
  dom.filterTabs.innerHTML = FILTERS
    .map((filter) => `
      <button class="filter-tab ${state.filter === filter ? 'is-active' : ''}" type="button" data-filter="${filter}">
        ${filter === 'all' ? 'All' : getStatusLabel(filter)}
      </button>
    `)
    .join('');
}

function renderPipelineRail() {
  const currentStatus = dom.statusInput.value || 'idea';
  const operationalStatus = ['retrying', 'failed'].includes(currentStatus)
    ? `
        <article class="pipeline-step pipeline-step--${getStatusTone(currentStatus)} is-active is-issue">
          <span class="pipeline-step__index">!</span>
          <div>
            <strong>${getStatusLabel(currentStatus)}</strong>
            <small>Operational state outside the main publishing path</small>
          </div>
        </article>
      `
    : '';

  dom.pipelineRail.innerHTML = `
    ${PIPELINE_STATUSES.map((status, index) => `
      <article class="pipeline-step pipeline-step--${getStatusTone(status)} ${currentStatus === status ? 'is-active' : ''}">
        <span class="pipeline-step__index">${index + 1}</span>
        <div>
          <strong>${getStatusLabel(status)}</strong>
          <small>${describePipelineStep(status)}</small>
        </div>
      </article>
    `).join('')}
    ${operationalStatus}
  `;
}

function renderValidationRail() {
  const post = collectComposerValues();
  const checks = validatePost(post, {
    accounts: state.accounts,
    posts: state.posts,
    envStatus: state.config.envStatus
  });
  const summary = summariseChecks(checks);

  dom.validationSummary.innerHTML = `
    <strong>${summary.ready} ready</strong>
    <strong>${summary.warning} warnings</strong>
    <strong>${summary.blocked} blocked</strong>
  `;

  dom.validationList.innerHTML = checks
    .map((item) => `
      <li class="validation-item validation-item--${item.level}">
        <strong>${item.label}</strong>
        <p>${item.message}</p>
      </li>
    `)
    .join('');

  updateCaptionCount();
}

function renderDeliveryInspector() {
  const post = getInspectorPost();
  if (!post) {
    dom.deliveryRunList.innerHTML = '<div class="empty-state">Load a queue item to inspect its publish history.</div>';
    return;
  }

  const history = Array.isArray(post.publishHistory) ? post.publishHistory : [];
  const latestRun = history[0] || null;
  const routeCards = post.platforms.map((platform) => {
    const account = state.accounts.find((item) => item.id === (post.accountTargets?.[platform] || post.platformTargets?.[platform]?.accountId));
    return `
      <article class="delivery-route-card">
        <span class="delivery-route-card__platform">${escapeHtml(getPlatformLabel(platform))}</span>
        <strong>${escapeHtml(account?.label || 'No route selected')}</strong>
        <small>${escapeHtml(account ? `${account.handle} - ${account.mode === 'api' ? 'Live API' : 'Dry run'}` : 'Choose an account before scheduling')}</small>
      </article>
    `;
  }).join('');

  const latestResults = (latestRun?.results || post.deliveryResults || []).map((result) => `
    <article class="delivery-result delivery-result--${result.ok ? 'ok' : 'error'}">
      <div class="delivery-result__head">
        <strong>${escapeHtml(getPlatformLabel(result.platform))}</strong>
        <span>${result.ok ? 'Delivered' : 'Needs attention'}</span>
      </div>
      <p>${escapeHtml(result.message || 'No provider message recorded.')}</p>
      <small>${escapeHtml(result.accountLabel || result.accountId || 'No account recorded')}${result.remoteId ? ` - ${escapeHtml(result.remoteId)}` : ''}</small>
    </article>
  `).join('');

  dom.deliveryRunList.innerHTML = `
    <section class="delivery-stack">
      <article class="delivery-summary-card">
        <div class="delivery-summary-card__head">
          <div>
            <p class="eyebrow">Selected post</p>
            <h3>${escapeHtml(post.title || 'Untitled queue item')}</h3>
          </div>
          <span class="queue-card__status status--${escapeHtml(getStatusTone(post.status))}">${escapeHtml(getStatusLabel(post.status))}</span>
        </div>
        <div class="delivery-summary-grid">
          ${renderDeliveryMetric('Latest run', latestRun ? getRunOutcomeLabel(latestRun.outcome) : 'No runs yet', latestRun ? formatDate(latestRun.createdAt) : 'Scheduler has not attempted this post yet')}
          ${renderDeliveryMetric('Attempts', String(post.attemptCount || 0), post.nextAttemptAt ? `Next retry ${formatDate(post.nextAttemptAt)}` : (post.lastError ? post.lastError : 'No retry scheduled'))}
          ${renderDeliveryMetric('Published', post.postedAt ? formatDate(post.postedAt) : 'Not posted', post.lastPublishedAt ? `Last publish ${formatDate(post.lastPublishedAt)}` : 'Waiting on a successful run')}
        </div>
      </article>

      <section class="delivery-section">
        <div class="delivery-section__head">
          <div>
            <p class="eyebrow">Routes</p>
            <h3>Account path</h3>
          </div>
          <span class="hint">${post.platforms.length} target${post.platforms.length === 1 ? '' : 's'}</span>
        </div>
        <div class="delivery-route-grid">
          ${routeCards || '<div class="empty-state">No routes configured yet.</div>'}
        </div>
      </section>

      <section class="delivery-section">
        <div class="delivery-section__head">
          <div>
            <p class="eyebrow">Latest result</p>
            <h3>Most recent execution</h3>
          </div>
          <span class="hint">${latestRun ? escapeHtml(latestRun.summary || 'Scheduler run recorded.') : 'No scheduler run recorded yet.'}</span>
        </div>
        <div class="delivery-results-grid">
          ${latestResults || '<div class="empty-state">No platform-level results yet. Run the scheduler or deliver this post first.</div>'}
        </div>
      </section>

      <section class="delivery-section">
        <div class="delivery-section__head">
          <div>
            <p class="eyebrow">Timeline</p>
            <h3>Run history</h3>
          </div>
          <span class="hint">${history.length ? `${history.length} recorded run${history.length === 1 ? '' : 's'}` : 'History appears after the scheduler touches this post.'}</span>
        </div>
        <div class="delivery-history-list">
          ${history.length
            ? history.map((entry) => renderDeliveryHistoryItem(entry)).join('')
            : '<div class="empty-state">This post has not gone through a scheduler run yet.</div>'}
        </div>
      </section>
    </section>
  `;
}

function renderDeliveryMetric(label, value, detail) {
  return `
    <article class="delivery-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function renderDeliveryHistoryItem(entry) {
  const results = Array.isArray(entry.results) ? entry.results : [];
  return `
    <article class="delivery-history-item delivery-history-item--${escapeHtml(entry.outcome || 'failed')}">
      <div class="delivery-history-item__head">
        <div>
          <strong>${escapeHtml(getRunOutcomeLabel(entry.outcome))}</strong>
          <small>${escapeHtml(entry.statusBefore || 'queue')} -> ${escapeHtml(entry.statusAfter || 'queue')}</small>
        </div>
        <time>${formatDate(entry.createdAt)}</time>
      </div>
      <p>${escapeHtml(entry.summary || entry.reason || 'Scheduler update recorded.')}</p>
      <div class="delivery-history-item__meta">
        <span>${entry.attemptCount ? `Attempt ${entry.attemptCount}` : 'First pass'}</span>
        ${entry.nextAttemptAt ? `<span>Retry ${escapeHtml(formatDate(entry.nextAttemptAt))}</span>` : ''}
        ${entry.reason && entry.reason !== entry.summary ? `<span>${escapeHtml(entry.reason)}</span>` : ''}
      </div>
      ${results.length ? `
        <div class="delivery-history-item__results">
          ${results.map((result) => `<span class="delivery-history-chip delivery-history-chip--${result.ok ? 'ok' : 'error'}">${escapeHtml(getPlatformLabel(result.platform))}: ${escapeHtml(result.message)}</span>`).join('')}
        </div>
      ` : ''}
    </article>
  `;
}

function getInspectorPost() {
  return state.posts.find((post) => post.id === state.activePostId) ?? null;
}

function getRunOutcomeLabel(outcome) {
  switch (outcome) {
    case 'posted':
      return 'Posted';
    case 'retrying':
      return 'Retrying';
    case 'failed':
      return 'Failed';
    default:
      return 'Run logged';
  }
}

function renderDraftPersistenceNote() {
  dom.draftPersistenceNote.textContent = state.composerDraftSavedAt
    ? `Autosaved locally at ${formatDate(state.composerDraftSavedAt)}.`
    : 'Composer drafts autosave locally on this device.';
}

function renderMediaList() {
  const remoteAssets = getRemoteAssetEntries(collectComposerValues());
  if (!state.composerMedia.length && !remoteAssets.length) {
    dom.mediaList.innerHTML = '<div class="empty-state">No assets attached yet. Add local image, video, or audio files, or drop in remote asset URLs.</div>';
    return;
  }

  dom.mediaList.innerHTML = [
    ...remoteAssets.map((item) => `
      <article class="media-item media-item--remote">
        <div class="media-item__preview media-item__preview--remote">
          <span class="media-kind media-kind--remote">Remote</span>
          <strong>${escapeHtml(item.label)}</strong>
        </div>
        <div class="media-item__body">
          <span>Remote asset slot</span>
          <small>${escapeHtml(item.url)}</small>
        </div>
      </article>
    `),
    ...state.composerMedia.map((item) => `
      <article class="media-item">
        ${renderMediaPreview(item)}
        <div class="media-item__body">
          <div class="media-item__top">
            <span class="media-kind">${escapeHtml(item.kind.toUpperCase())}</span>
            <button class="link-button" type="button" data-remove-media-id="${item.id}">Remove</button>
          </div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.width && item.height ? `${item.width}x${item.height}` : item.kind === 'audio' ? 'Soundtrack reference' : 'Local upload'}</span>
          <small>${formatBytes(item.sizeBytes)}${item.durationSeconds ? ` | ${item.durationSeconds.toFixed(1)}s` : ''}</small>
        </div>
      </article>
    `)
  ].join('');
}

function renderMediaPreview(item) {
  if (item.kind === 'video' && item.previewUrl) {
    return `
      <div class="media-item__preview">
        <video src="${escapeHtml(item.previewUrl)}" muted playsinline preload="metadata"></video>
      </div>
    `;
  }

  if ((item.kind === 'image' || item.kind === 'gif') && item.previewUrl) {
    return `
      <div class="media-item__preview">
        <img src="${escapeHtml(item.previewUrl)}" alt="${escapeHtml(item.name)} preview" />
      </div>
    `;
  }

  return `
    <div class="media-item__preview media-item__preview--audio">
      <span>Audio</span>
      <strong>Soundtrack reference</strong>
    </div>
  `;
}

function renderPlatformTargetGrid() {
  const platforms = getSelectedPlatforms();
  syncComposerPlatformTargets(platforms);

  if (!platforms.length) {
    dom.platformTargetGrid.innerHTML = '<div class="empty-state">Select at least one destination to unlock structured platform targets.</div>';
    return;
  }

  const basePost = collectComposerValues();
  dom.platformTargetGrid.innerHTML = platforms.map((platform) => {
    const target = createTargetDraft(platform, state.composerPlatformTargets[platform]);
    const panelCopy = PLATFORM_PANEL_COPY[platform] || {
      eyebrow: `${getPlatformLabel(platform)} brief`,
      title: 'Tune the target details.',
      hint: 'Override only what this destination genuinely needs.'
    };
    const accountOptions = state.accounts
      .filter((account) => account.platform === platform)
      .map((account) => `
        <option value="${account.id}" ${target.accountId === account.id ? 'selected' : ''}>
          ${escapeHtml(account.label)} (${escapeHtml(account.handle)})
        </option>
      `)
      .join('');

    return `
      <article class="target-card" data-target-card="${platform}">
        <div class="target-card__head">
          <div>
            <span class="queue-card__status status--${platform === 'instagram' ? 'approved' : platform === 'tiktok' ? 'scheduled' : platform === 'youtube' || platform === 'shorts' ? 'posted' : 'draft'}">${escapeHtml(panelCopy.eyebrow)}</span>
            <h3>${escapeHtml(panelCopy.title)}</h3>
          </div>
          <span class="target-card__inherit">${escapeHtml(getTargetInheritanceNote(target))}</span>
        </div>
        <p class="target-card__meta">${escapeHtml(panelCopy.hint)}</p>
        <div class="target-card__route-row">
          <label class="field">
            <span class="field__label">Route account</span>
            <select class="field__control" data-target-platform="${platform}" data-target-field="accountId">
              <option value="">No account selected</option>
              ${accountOptions}
            </select>
          </label>
        </div>
        ${renderPlatformSpecificFields(platform, target)}
        <details class="target-card__fold" ${target.title || target.caption || target.hashtags ? 'open' : ''}>
          <summary class="target-card__fold-summary">
            <span>Copy overrides</span>
            <small>Optional platform-specific title, caption, and tags</small>
          </summary>
          <div class="target-card__fold-body">
            <div class="target-card__grid">
              ${platformNeedsTitle(platform) ? `
                <label class="field">
                  <span class="field__label">${platform === 'youtube' || platform === 'shorts' ? 'Upload title' : 'Platform title'}</span>
                  <input
                    class="field__control"
                    type="text"
                    data-target-platform="${platform}"
                    data-target-field="title"
                    value="${escapeHtml(target.title)}"
                    placeholder="${escapeHtml(dom.titleInput.value || 'Optional override of the base title')}"
                  />
                </label>
              ` : ''}
              <label class="field">
                <span class="field__label">${platform === 'youtube' || platform === 'shorts' ? 'Tags / hashtags' : 'Hashtags'}</span>
                <input
                  class="field__control"
                  type="text"
                  data-target-platform="${platform}"
                  data-target-field="hashtags"
                  value="${escapeHtml(target.hashtags)}"
                  placeholder="${platform === 'youtube' || platform === 'shorts' ? '#launch #studio' : '#launch #verticalcut'}"
                />
              </label>
            </div>
            <label class="field">
              <span class="field__label">${platform === 'youtube' || platform === 'shorts' ? 'Description override' : 'Caption override'}</span>
              <textarea
                class="field__control field__control--notes"
                data-target-platform="${platform}"
                data-target-field="caption"
                placeholder="Optional platform-specific copy override"
              >${escapeHtml(target.caption)}</textarea>
            </label>
          </div>
        </details>
        <div class="target-card__summary">
          ${renderTargetSummaryChips(platform, target)}
        </div>
        <div class="target-card__preview">
          <strong>${escapeHtml(getEffectiveTargetTitle(basePost, platform) || 'Untitled target')}</strong>
          <p>${escapeHtml(buildPublishText({
            ...basePost,
            platformTargets: {
              ...basePost.platformTargets,
              [platform]: target
            }
          }, platform) || 'No effective copy yet.')}</p>
        </div>
      </article>
    `;
  }).join('');
}

function renderPlatformSpecificFields(platform, target) {
  if (platform === 'instagram') {
    return `
      <details class="target-card__fold" ${shouldOpenTargetControls(platform, target) ? 'open' : ''}>
        <summary class="target-card__fold-summary">
          <span>Instagram controls</span>
          <small>Choose the format before the connector prepares media</small>
        </summary>
        <div class="target-card__fold-body">
          <div class="target-card__grid target-card__grid--dense">
            <label class="field">
              <span class="field__label">Publish type</span>
              <select class="field__control" data-target-platform="${platform}" data-target-setting="publishType">
                <option value="feed" ${target.settings.publishType === 'feed' ? 'selected' : ''}>Feed post</option>
                <option value="reel" ${target.settings.publishType === 'reel' ? 'selected' : ''}>Reel</option>
                <option value="carousel" ${target.settings.publishType === 'carousel' ? 'selected' : ''}>Carousel</option>
              </select>
            </label>
            <label class="field">
              <span class="field__label">First comment</span>
              <input
                class="field__control"
                type="text"
                data-target-platform="${platform}"
                data-target-setting="firstComment"
                value="${escapeHtml(target.settings.firstComment)}"
                placeholder="Optional first comment"
              />
            </label>
          </div>
          <div class="target-card__grid">
            <label class="field">
              <span class="field__label">Alt text</span>
              <textarea
                class="field__control field__control--notes"
                data-target-platform="${platform}"
                data-target-setting="altText"
                placeholder="Describe the image or cover frame for accessibility."
              >${escapeHtml(target.settings.altText)}</textarea>
            </label>
            <label class="field field--toggle">
              <span class="field__label">Reel feed toggle</span>
              <span class="toggle">
                <input
                  type="checkbox"
                  data-target-platform="${platform}"
                  data-target-setting="shareToFeed"
                  ${target.settings.shareToFeed ? 'checked' : ''}
                />
                <span class="toggle__visual"></span>
                <span class="toggle__copy">Share Reels into the main feed when supported</span>
              </span>
            </label>
          </div>
        </div>
      </details>
    `;
  }

  if (platform === 'tiktok') {
    const brandedDisabled = !target.settings.commercialContent;
    const policyDisabled = !target.settings.discloseBrandedContent;
    return `
      <details class="target-card__fold" ${shouldOpenTargetControls(platform, target) ? 'open' : ''}>
        <summary class="target-card__fold-summary">
          <span>TikTok controls</span>
          <small>Privacy, interactions, and disclosures that mirror the live posting UI</small>
        </summary>
        <div class="target-card__fold-body">
          <div class="target-card__grid target-card__grid--dense">
            <label class="field">
              <span class="field__label">Delivery path</span>
              <select class="field__control" data-target-platform="${platform}" data-target-setting="postMode">
                <option value="draft" ${target.settings.postMode === 'draft' ? 'selected' : ''}>Upload as draft</option>
                <option value="direct" ${target.settings.postMode === 'direct' ? 'selected' : ''}>Direct post</option>
              </select>
            </label>
            <label class="field">
              <span class="field__label">Privacy</span>
              <select class="field__control" data-target-platform="${platform}" data-target-setting="privacyLevel">
                <option value="" ${!target.settings.privacyLevel ? 'selected' : ''}>Choose at publish time</option>
                <option value="PUBLIC_TO_EVERYONE" ${target.settings.privacyLevel === 'PUBLIC_TO_EVERYONE' ? 'selected' : ''}>Everyone</option>
                <option value="MUTUAL_FOLLOW_FRIENDS" ${target.settings.privacyLevel === 'MUTUAL_FOLLOW_FRIENDS' ? 'selected' : ''}>Friends</option>
                <option value="SELF_ONLY" ${target.settings.privacyLevel === 'SELF_ONLY' ? 'selected' : ''}>Only me</option>
              </select>
            </label>
            <label class="field">
              <span class="field__label">Cover timestamp (ms)</span>
              <input
                class="field__control"
                type="number"
                min="0"
                step="100"
                data-target-platform="${platform}"
                data-target-setting="videoCoverTimestampMs"
                value="${escapeHtml(String(target.settings.videoCoverTimestampMs ?? 0))}"
              />
            </label>
          </div>
          <div class="target-card__checklist">
            ${renderTargetCheckbox(platform, 'allowComment', 'Allow comments', target.settings.allowComment)}
            ${renderTargetCheckbox(platform, 'allowDuet', 'Allow duet', target.settings.allowDuet)}
            ${renderTargetCheckbox(platform, 'allowStitch', 'Allow stitch', target.settings.allowStitch)}
            ${renderTargetCheckbox(platform, 'commercialContent', 'Commercial content disclosure', target.settings.commercialContent)}
            ${renderTargetCheckbox(platform, 'discloseYourBrand', 'Promotes your own brand', target.settings.discloseYourBrand, brandedDisabled)}
            ${renderTargetCheckbox(platform, 'discloseBrandedContent', 'Paid partnership / third-party brand', target.settings.discloseBrandedContent, brandedDisabled)}
            ${renderTargetCheckbox(platform, 'musicUsageConfirmed', 'I confirm TikTok music usage consent will be shown before posting', target.settings.musicUsageConfirmed)}
            ${renderTargetCheckbox(platform, 'brandedContentPolicyConfirmed', 'I confirm TikTok branded content policy consent will be shown when required', target.settings.brandedContentPolicyConfirmed, policyDisabled)}
          </div>
        </div>
      </details>
    `;
  }

  if (platform === 'youtube' || platform === 'shorts') {
    return `
      <details class="target-card__fold" ${shouldOpenTargetControls(platform, target) ? 'open' : ''}>
        <summary class="target-card__fold-summary">
          <span>${platform === 'shorts' ? 'Shorts controls' : 'YouTube controls'}</span>
          <small>Privacy, audience, tags, and playlist routing</small>
        </summary>
        <div class="target-card__fold-body">
          <div class="target-card__grid target-card__grid--dense">
            <label class="field">
              <span class="field__label">Privacy</span>
              <select class="field__control" data-target-platform="${platform}" data-target-setting="privacyStatus">
                <option value="" ${!target.settings.privacyStatus ? 'selected' : ''}>Choose privacy</option>
                <option value="private" ${target.settings.privacyStatus === 'private' ? 'selected' : ''}>Private</option>
                <option value="unlisted" ${target.settings.privacyStatus === 'unlisted' ? 'selected' : ''}>Unlisted</option>
                <option value="public" ${target.settings.privacyStatus === 'public' ? 'selected' : ''}>Public</option>
              </select>
            </label>
            <label class="field">
              <span class="field__label">Audience</span>
              <select class="field__control" data-target-platform="${platform}" data-target-setting="madeForKids">
                <option value="" ${!target.settings.madeForKids ? 'selected' : ''}>Choose audience</option>
                <option value="no" ${target.settings.madeForKids === 'no' ? 'selected' : ''}>Not made for kids</option>
                <option value="yes" ${target.settings.madeForKids === 'yes' ? 'selected' : ''}>Made for kids</option>
              </select>
            </label>
            <label class="field field--toggle">
              <span class="field__label">Notify subscribers</span>
              <span class="toggle">
                <input
                  type="checkbox"
                  data-target-platform="${platform}"
                  data-target-setting="notifySubscribers"
                  ${target.settings.notifySubscribers ? 'checked' : ''}
                />
                <span class="toggle__visual"></span>
                <span class="toggle__copy">Ping subscribers when the upload goes live</span>
              </span>
            </label>
          </div>
          <div class="target-card__grid target-card__grid--dense">
            <label class="field">
              <span class="field__label">Tags</span>
              <input
                class="field__control"
                type="text"
                data-target-platform="${platform}"
                data-target-setting="tags"
                value="${escapeHtml(target.settings.tags)}"
                placeholder="launch, studio, behind the scenes"
              />
            </label>
            <label class="field">
              <span class="field__label">Category</span>
              <input
                class="field__control"
                type="text"
                data-target-platform="${platform}"
                data-target-setting="category"
                value="${escapeHtml(target.settings.category)}"
                placeholder="Entertainment"
              />
            </label>
            <label class="field">
              <span class="field__label">Playlist</span>
              <input
                class="field__control"
                type="text"
                data-target-platform="${platform}"
                data-target-setting="playlist"
                value="${escapeHtml(target.settings.playlist)}"
                placeholder="Optional playlist name"
              />
            </label>
          </div>
        </div>
      </details>
    `;
  }

  return '';
}

function renderTargetSummaryChips(platform, target) {
  const summary = buildTargetSummary(platform, target)
    .filter(Boolean)
    .map((entry) => `<span class="asset-chip">${escapeHtml(entry)}</span>`)
    .join('');

  return summary || '<span class="asset-chip">Base copy and defaults</span>';
}

function shouldOpenTargetControls(platform, target) {
  if (!target.accountId) {
    return true;
  }

  if (platform === 'instagram') {
    return target.settings.publishType !== 'feed' || Boolean(target.settings.firstComment) || Boolean(target.settings.altText);
  }

  if (platform === 'tiktok') {
    return !target.settings.privacyLevel
      || !target.settings.musicUsageConfirmed
      || (target.settings.discloseBrandedContent && !target.settings.brandedContentPolicyConfirmed);
  }

  if (platform === 'youtube' || platform === 'shorts') {
    return !target.settings.privacyStatus || !target.settings.madeForKids;
  }

  return false;
}

function buildTargetSummary(platform, target) {
  if (platform === 'instagram') {
    return [
      `Format: ${target.settings.publishType}`,
      target.settings.shareToFeed ? 'Feed share on' : 'Feed share off',
      target.settings.firstComment ? 'First comment set' : '',
      target.settings.altText ? 'Alt text ready' : ''
    ];
  }

  if (platform === 'tiktok') {
    return [
      `Mode: ${target.settings.postMode}`,
      target.settings.privacyLevel ? `Privacy: ${formatTikTokPrivacy(target.settings.privacyLevel)}` : 'Privacy unset',
      target.settings.commercialContent ? 'Commercial disclosure on' : '',
      target.settings.musicUsageConfirmed ? 'Music consent ready' : ''
    ];
  }

  if (platform === 'youtube' || platform === 'shorts') {
    return [
      target.settings.privacyStatus ? `Privacy: ${target.settings.privacyStatus}` : 'Privacy unset',
      target.settings.madeForKids ? `Audience: ${target.settings.madeForKids === 'yes' ? 'made for kids' : 'not made for kids'}` : 'Audience unset',
      target.settings.tags ? 'Tags ready' : '',
      target.settings.playlist ? `Playlist: ${target.settings.playlist}` : ''
    ];
  }

  return [
    target.title ? 'Title override' : '',
    target.caption ? 'Caption override' : '',
    target.hashtags ? 'Tag override' : ''
  ];
}

function describeQueuePlatformTag(post, platform) {
  const target = createTargetDraft(platform, post.platformTargets?.[platform]);
  const account = state.accounts.find((item) => item.id === (target.accountId || post.accountTargets?.[platform]));
  const routing = account ? `${getPlatformLabel(platform)} -> ${account.label}` : getPlatformLabel(platform);
  const summary = buildTargetSummary(platform, target).find(Boolean);
  return summary ? `${routing} | ${summary}` : `${routing} | base brief`;
}

function renderTargetCheckbox(platform, settingKey, label, checked, disabled = false) {
  return `
    <label class="target-check ${disabled ? 'is-disabled' : ''}">
      <input
        type="checkbox"
        data-target-platform="${platform}"
        data-target-setting="${settingKey}"
        ${checked ? 'checked' : ''}
        ${disabled ? 'disabled' : ''}
      />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function platformNeedsTitle(platform) {
  return platform === 'tiktok' || platform === 'youtube' || platform === 'shorts';
}

function formatTikTokPrivacy(value) {
  if (value === 'PUBLIC_TO_EVERYONE') return 'everyone';
  if (value === 'MUTUAL_FOLLOW_FRIENDS') return 'friends';
  if (value === 'SELF_ONLY') return 'only me';
  return value;
}

function renderAccounts() {
  if (!state.accounts.length) {
    dom.accountGrid.innerHTML = '<div class="empty-state">No accounts yet. Add one to unlock routing.</div>';
    return;
  }

  dom.accountGrid.innerHTML = state.accounts
    .map((account) => {
      const platform = platformCatalog[account.platform];
      const envEntry = state.config.envStatus[account.platform] || {};
      const provider = platform.authProvider || account.platform;
      const appReady = Boolean(envEntry.appReady || envEntry.ready);
      const secureReady = envEntry.secureStorageReady !== false;
      const connected = account.authStatus === 'connected';
      const authLabel = account.mode === 'dry-run'
        ? 'Dry run'
        : connected
          ? 'Connected'
          : account.authStatus === 'needs_reauth'
            ? 'Reconnect'
            : 'Not connected';
      const authTone = account.mode === 'dry-run'
        ? 'connected'
        : connected
          ? 'connected'
          : account.authStatus === 'needs_reauth'
            ? 'warning'
            : 'error';
      const capabilities = Array.isArray(account.capabilities) ? account.capabilities : [];
      const canConnect = ['instagram', 'tiktok', 'youtube'].includes(provider);
      return `
        <article class="account-card" data-account-id="${account.id}">
          <div class="account-card__head">
            <div>
              <span class="queue-card__status status--${account.mode === 'dry-run' || connected ? 'posted' : 'failed'}">${account.mode}</span>
              <h3>${escapeHtml(account.label)}</h3>
            </div>
            <span>${getPlatformLabel(account.platform)}</span>
          </div>
          <div class="account-card__meta">
            <span>${escapeHtml(account.handle)}</span>
            <span>${account.isDefault ? 'Default route' : 'Secondary route'}</span>
            <span>${account.status}</span>
          </div>
          <div class="account-card__capabilities">
            <span class="account-badge account-badge--${authTone}">${escapeHtml(authLabel)}</span>
            <span class="account-badge ${appReady && secureReady ? 'account-badge--connected' : 'account-badge--warning'}">${appReady && secureReady ? 'App ready' : 'Missing env'}</span>
            ${capabilities.map((capability) => `<span class="account-badge">${escapeHtml(capability)}</span>`).join('')}
          </div>
          <p class="account-card__requirement">${platformCatalog[account.platform].accountRequirement}</p>
          ${account.lastAuthError ? `<p class="account-card__requirement">Last auth issue: ${escapeHtml(account.lastAuthError)}</p>` : ''}
          <div class="account-card__actions">
            ${canConnect ? `<button class="button button--ghost action-connect-account" type="button">${connected ? 'Reconnect' : 'Connect'}</button>` : ''}
            ${canConnect && account.tokenStored ? '<button class="button button--ghost action-disconnect-account" type="button">Disconnect</button>' : ''}
            <button class="button button--ghost action-edit-account" type="button">Edit</button>
            <button class="button button--ghost action-delete-account" type="button">Delete</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderQueue() {
  const visiblePosts = getVisiblePosts();
  dom.queueList.innerHTML = '';

  if (!visiblePosts.length) {
    dom.queueList.innerHTML = '<div class="empty-state">Nothing matches the current search and filter.</div>';
    return;
  }

  visiblePosts.forEach((post) => {
    const checks = validatePost(post, {
      accounts: state.accounts,
      posts: state.posts,
      envStatus: state.config.envStatus
    });
    const summary = summariseChecks(checks);
    const fragment = dom.queueCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.queue-card');
    const statusElement = fragment.querySelector('.queue-card__status');
    const actionToggle = fragment.querySelector('.action-toggle');
    const actionReview = fragment.querySelector('.action-review');
    card.dataset.postId = post.id;
    card.classList.toggle('is-active', state.activePostId === post.id);
    statusElement.textContent = getStatusLabel(post.status);
    statusElement.classList.add(`status--${getStatusTone(post.status)}`);
    fragment.querySelector('.queue-card__title').textContent = post.title;
    fragment.querySelector('.queue-card__time').textContent = post.status === 'posted' && post.postedAt
      ? `Posted ${formatDate(post.postedAt)}`
      : formatDate(post.scheduleAt);
    fragment.querySelector('.queue-card__caption').textContent = buildPublishText(post, post.platforms[0]) || 'No caption added yet.';
    fragment.querySelector('.queue-card__meta').textContent = `${post.group} | ${post.mediaType} | ${post.ratio} | ${countPrimaryAssetSlots(post)} assets | ${summary.blocked} blocked | ${summary.warning} warnings`;
    fragment.querySelector('.queue-card__platforms').innerHTML = post.platforms
      .map((platform) => `<span class="platform-tag">${escapeHtml(describeQueuePlatformTag(post, platform))}</span>`)
      .join('');
    fragment.querySelector('.queue-card__assets').innerHTML = getAssetSummaryChips(post).join('')
      || '<span class="asset-chip">No assets attached</span>';
    actionReview.textContent = post.publishHistory?.length ? `Review Runs (${post.publishHistory.length})` : 'Review Runs';
    actionToggle.textContent = getAdvanceButtonLabel(post.status);
    dom.queueList.appendChild(fragment);
  });
}

function renderCalendar() {
  renderCalendarControls();
  if (state.calendarView === 'month') {
    renderMonthCalendar();
    return;
  }

  renderWeekCalendar();
}

function renderWeekCalendar() {
  const weekStart = getStartOfWeek(state.calendarFocusDate);
  const headingEnd = addDays(weekStart, 6);
  dom.calendarHeading.textContent = `${formatCalendarRangeDate(weekStart)} to ${formatCalendarRangeDate(headingEnd)}`;

  const visiblePosts = getVisiblePosts().filter((post) => {
    const scheduledTime = new Date(post.scheduleAt).getTime();
    return scheduledTime >= weekStart.getTime() && scheduledTime < addDays(weekStart, 7).getTime();
  });

  dom.calendarGrid.classList.remove('calendar-grid--month');
  dom.calendarGrid.innerHTML = Array.from({ length: 7 }).map((_, dayIndex) => {
    const dayDate = addDays(weekStart, dayIndex);
    const items = visiblePosts.filter((post) => isSameLocalDay(post.scheduleAt, dayDate));

    return `
      <section class="day-column" data-day-date="${getDateKey(dayDate)}">
        <header>
          <div>
            <span>${dayDate.toLocaleDateString(undefined, { weekday: 'long' })}</span>
            <strong>${dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
          </div>
          <strong>${items.length}</strong>
        </header>
        <div class="day-column__cards">
          ${items.length
            ? items.map((post) => renderCalendarCard(post)).join('')
            : '<div class="calendar-empty">No pipeline items</div>'}
        </div>
      </section>
    `;
  }).join('');
}

function renderMonthCalendar() {
  const monthStart = getStartOfMonth(state.calendarFocusDate);
  const gridStart = getStartOfWeek(monthStart);
  const visiblePosts = getVisiblePosts().filter((post) => isSameLocalMonth(post.scheduleAt, monthStart));

  dom.calendarHeading.textContent = monthStart.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  dom.calendarGrid.classList.add('calendar-grid--month');
  dom.calendarGrid.innerHTML = Array.from({ length: 42 }).map((_, index) => {
    const dayDate = addDays(gridStart, index);
    const items = visiblePosts.filter((post) => isSameLocalDay(post.scheduleAt, dayDate));
    const inMonth = isSameLocalMonth(dayDate, monthStart);

    return `
      <section class="day-column day-column--month ${inMonth ? '' : 'day-column--muted'}" data-day-date="${getDateKey(dayDate)}">
        <header>
          <span>${dayDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
          <strong>${dayDate.getDate()}</strong>
        </header>
        <div class="day-column__cards">
          ${items.length
            ? items.slice(0, 3).map((post) => renderCalendarCard(post, { compact: true })).join('')
            : '<div class="calendar-empty">No items</div>'}
          ${items.length > 3 ? `<div class="calendar-empty">+${items.length - 3} more</div>` : ''}
        </div>
      </section>
    `;
  }).join('');
}

function renderCalendarControls() {
  dom.calendarWeekViewBtn.classList.toggle('is-active', state.calendarView === 'week');
  dom.calendarMonthViewBtn.classList.toggle('is-active', state.calendarView === 'month');
  dom.currentWeekBtn.textContent = state.calendarView === 'month' ? 'This Month' : 'This Week';
}

function renderCalendarCard(post, options = {}) {
  const compactClass = options.compact ? ' calendar-card--compact' : '';
  return `
    <button class="calendar-card${compactClass}" type="button" data-load-post="${post.id}" data-post-id="${post.id}" draggable="true">
      <span>${post.status === 'posted' && post.postedAt ? 'Posted' : formatTime(post.scheduleAt)}</span>
      <strong>${escapeHtml(post.title)}</strong>
      <small>${post.platforms.map((platform) => getPlatformLabel(platform)).join(', ')}</small>
    </button>
  `;
}

function renderAlerts() {
  const openAlerts = state.alerts.filter((alert) => !alert.resolved);
  if (!openAlerts.length) {
    dom.alertList.innerHTML = '<div class="empty-state">No open alerts. The rail is clear.</div>';
    return;
  }

  dom.alertList.innerHTML = openAlerts
    .map((alert) => `
      <article class="alert-item alert-item--${alert.level}">
        <div class="alert-item__head">
          <strong>${escapeHtml(alert.postTitle)}</strong>
          <time>${formatDate(alert.createdAt)}</time>
        </div>
        <p>${escapeHtml(alert.message)}</p>
        <button class="link-button" type="button" data-alert-id="${alert.id}">Resolve</button>
      </article>
    `)
    .join('');
}

function renderActivity() {
  if (!state.activity.length) {
    dom.activityList.innerHTML = '<div class="empty-state">No delivery activity yet.</div>';
    return;
  }

  dom.activityList.innerHTML = state.activity
    .slice(0, 8)
    .map((item) => `
      <article class="activity-item">
        <div class="activity-item__head">
          <strong>${escapeHtml(item.postTitle || item.type)}</strong>
          <time>${formatDate(item.createdAt)}</time>
        </div>
        <p class="activity-item__detail">${escapeHtml(item.detail || 'Scheduler update')}</p>
      </article>
    `)
    .join('');
}

function applyTemplate(templateId) {
  const template = templates[templateId];
  if (!template) {
    return;
  }

  const next = normalisePost({
    ...createEmptyPost(),
    ...template,
    scheduleAt: buildFutureDate(2, 11, 0)
  }, state.accounts);
  setComposerFromPost(next, { persistDraft: true });
  showBanner(`Loaded the ${next.title.toLowerCase()} template.`);
}

function collectComposerValues() {
  const active = state.posts.find((post) => post.id === state.activePostId);
  const now = new Date().toISOString();
  const platforms = getSelectedPlatforms();
  syncComposerPlatformTargets(platforms);

  const platformTargets = Object.fromEntries(Object.entries(state.composerPlatformTargets).map(([platform, target]) => [
    platform,
    {
      ...createTargetDraft(platform, target),
      enabled: platforms.includes(platform)
    }
  ]));
  const accountTargets = Object.fromEntries(platforms.map((platform) => [
    platform,
    platformTargets[platform]?.accountId || ''
  ]));

  const post = normalisePost({
    ...active,
    id: state.activePostId || crypto.randomUUID(),
    title: dom.titleInput.value.trim(),
    caption: dom.captionInput.value,
    hashtags: dom.hashtagsInput.value,
    scheduleAt: dom.scheduleInput.value,
    platforms,
    accountTargets,
    platformTargets,
    group: dom.groupInput.value,
    mediaType: dom.mediaTypeInput.value,
    ratio: dom.ratioInput.value,
    duration: Number(dom.durationInput.value || 0),
    mediaCount: Number(dom.mediaCountInput.value || 0),
    media: state.composerMedia,
    assetUrls: {
      image: dom.imageUrlInput.value.trim(),
      video: dom.videoUrlInput.value.trim(),
      thumbnail: dom.thumbnailUrlInput.value.trim(),
      audio: dom.audioUrlInput.value.trim()
    },
    sourceUrl: dom.sourceUrlInput.value.trim(),
    quoteMode: dom.quoteToggle.checked,
    notes: dom.notesInput.value.trim(),
    status: dom.statusInput.value,
    approvedAt: active?.approvedAt || '',
    postedAt: active?.postedAt || '',
    lastPublishedAt: active?.lastPublishedAt || '',
    createdAt: active?.createdAt || now,
    updatedAt: now
  }, state.accounts);

  return applyStatusTimestamps(post, post.status, active);
}

function setComposerFromPost(post, options = {}) {
  const target = normalisePost(post, state.accounts);
  state.composerHydrating = true;
  state.activePostId = target.id;
  state.composerMedia = target.media || [];
  state.composerPlatformTargets = { ...target.platformTargets };

  dom.titleInput.value = target.title || '';
  dom.captionInput.value = target.caption || '';
  dom.hashtagsInput.value = target.hashtags || '';
  dom.scheduleInput.value = normaliseLocalDateTime(target.scheduleAt);
  dom.groupInput.value = target.group || 'Art Drop';
  dom.statusInput.value = target.status || 'idea';
  dom.mediaTypeInput.value = target.mediaType || 'image';
  dom.ratioInput.value = target.ratio || '9:16';
  dom.durationInput.value = target.duration ?? 0;
  dom.mediaCountInput.value = target.mediaCount ?? countPrimaryAssetSlots(target);
  dom.imageUrlInput.value = target.assetUrls?.image || '';
  dom.videoUrlInput.value = target.assetUrls?.video || '';
  dom.thumbnailUrlInput.value = target.assetUrls?.thumbnail || '';
  dom.audioUrlInput.value = target.assetUrls?.audio || '';
  dom.sourceUrlInput.value = target.sourceUrl || '';
  dom.quoteToggle.checked = Boolean(target.quoteMode);
  dom.notesInput.value = target.notes || '';

  Array.from(dom.platformOptions.querySelectorAll('input')).forEach((input) => {
    input.checked = target.platforms.includes(input.value);
  });

  state.composerHydrating = false;
  updateCaptionCount();
  renderAll();

  if (options.persistDraft) {
    queueComposerDraftSave();
  }
}

async function saveComposer(forcedStatus = null) {
  const current = collectComposerValues();
  const previous = state.posts.find((item) => item.id === state.activePostId);
  const post = applyStatusTimestamps(current, forcedStatus || current.status, previous);
  post.status = forcedStatus || post.status;

  if (!post.title.trim()) {
    showBanner('Give the post a title first.');
    return;
  }

  const checks = validatePost(post, {
    accounts: state.accounts,
    posts: state.posts,
    envStatus: state.config.envStatus
  });

  await savePostObject(post);
  clearComposerDraft();
  const blockingIssues = checks.filter((item) => item.level === 'blocked').length;
  showBanner(blockingIssues ? 'Saved with blocked checks still to fix.' : `Saved into ${getStatusLabel(post.status)}.`);
}

async function savePostObject(post) {
  if (state.backendReady) {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post })
    });
    const payload = await response.json();
    upsertPost(payload.post);
  } else {
    upsertPost(post);
  }

  state.activePostId = post.id;
  persistCache();
  renderAll();
}

function upsertPost(post) {
  const index = state.posts.findIndex((item) => item.id === post.id);
  const normalised = normalisePost(post, state.accounts);
  if (index >= 0) {
    state.posts[index] = normalised;
  } else {
    state.posts.unshift(normalised);
  }
}

function resetComposer() {
  clearComposerDraft();
  setComposerFromPost(createEmptyPost(), { persistDraft: false });
  showBanner('Composer reset.');
}

function duplicateComposer() {
  const post = collectComposerValues();
  post.id = crypto.randomUUID();
  post.title = `${post.title || 'Untitled'} copy`;
  post.status = 'draft';
  post.attemptCount = 0;
  post.lastError = '';
  post.nextAttemptAt = '';
  post.deliveryResults = [];
  post.publishHistory = [];
  post.approvedAt = '';
  post.postedAt = '';
  post.lastPublishedAt = '';
  post.createdAt = new Date().toISOString();
  post.updatedAt = new Date().toISOString();
  setComposerFromPost(post, { persistDraft: true });
  showBanner('Composer duplicated into a new draft.');
}

function loadPost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  setComposerFromPost(post, { persistDraft: false });
  showBanner(`Loaded "${post.title}" into the composer.`);
}

async function duplicatePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  const clone = normalisePost({
    ...post,
    id: crypto.randomUUID(),
    title: `${post.title} copy`,
    status: 'draft',
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
  }, state.accounts);
  await savePostObject(clone);
  showBanner('Queue item duplicated.');
}

async function cycleStatus(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  const nextStatus = STATUS_FLOW[post.status] || 'draft';
  const nextPost = applyStatusTimestamps({
    ...post,
    status: nextStatus,
    updatedAt: new Date().toISOString()
  }, nextStatus, post);
  await savePostObject(nextPost);
  showBanner(`"${post.title}" is now ${getStatusLabel(nextStatus)}.`);
}

async function removePost(postId) {
  const post = state.posts.find((item) => item.id === postId);

  if (state.backendReady) {
    await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
  }

  state.posts = state.posts.filter((item) => item.id !== postId);
  if (state.activePostId === postId) {
    clearComposerDraft();
    setComposerFromPost(createEmptyPost(), { persistDraft: false });
  }
  persistCache();
  renderAll();
  showBanner(post ? `Deleted "${post.title}".` : 'Post deleted.');
}

function openRouteDialog(postId) {
  const post = state.posts.find((item) => item.id === postId) ?? collectComposerValues();
  state.pendingRoutePostId = post.id;
  syncComposerPlatformTargets(post.platforms);

  dom.routeFields.innerHTML = post.platforms.map((platform) => {
    const target = createTargetDraft(platform, state.composerPlatformTargets[platform]);
    const options = state.accounts
      .filter((account) => account.platform === platform)
      .map((account) => `
        <option value="${account.id}" ${target.accountId === account.id ? 'selected' : ''}>
          ${escapeHtml(account.label)} (${escapeHtml(account.handle)})
        </option>
      `)
      .join('');

    return `
      <label class="route-field">
        <span class="field__label">${getPlatformLabel(platform)}</span>
        <select class="field__control" data-platform="${platform}">
          <option value="">No account selected</option>
          ${options}
        </select>
      </label>
    `;
  }).join('');

  dom.routeDialog.showModal();
}

function openAccountDialog(accountId = '') {
  const account = state.accounts.find((item) => item.id === accountId);
  dom.accountIdInput.value = account?.id || '';
  dom.accountPlatformInput.value = account?.platform || getSelectedPlatforms()[0] || 'instagram';
  dom.accountLabelInput.value = account?.label || '';
  dom.accountHandleInput.value = account?.handle || '';
  dom.accountModeInput.value = account?.mode || 'dry-run';
  dom.accountStatusInput.value = account?.status || 'active';
  dom.accountDefaultInput.checked = Boolean(account?.isDefault);
  dom.accountDialog.showModal();
}

async function saveAccountFromDialog() {
  const account = normaliseAccount({
    id: dom.accountIdInput.value || crypto.randomUUID(),
    platform: dom.accountPlatformInput.value,
    label: dom.accountLabelInput.value.trim(),
    handle: dom.accountHandleInput.value.trim(),
    mode: dom.accountModeInput.value,
    status: dom.accountStatusInput.value,
    isDefault: dom.accountDefaultInput.checked
  }, state.config.envStatus);

  if (!account.handle) {
    showBanner('Give the account a handle or channel name.');
    return;
  }

  if (state.backendReady) {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account })
    });
    const payload = await response.json();
    state.accounts = payload.accounts.map((item) => normaliseAccount(item, state.config.envStatus));
  } else {
    if (account.isDefault) {
      state.accounts = state.accounts.map((item) => item.platform === account.platform ? { ...item, isDefault: false } : item);
    }
    const index = state.accounts.findIndex((item) => item.id === account.id);
    if (index >= 0) {
      state.accounts[index] = account;
    } else {
      state.accounts.unshift(account);
    }
  }

  syncAllPostTargets();
  persistCache();
  dom.accountDialog.close();
  renderAll();
  showBanner('Account saved.');
}

function connectAccount(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) {
    return;
  }

  const provider = platformCatalog[account.platform]?.authProvider || account.platform;
  window.location.assign(`/api/auth/${provider}/start?accountId=${encodeURIComponent(accountId)}`);
}

async function disconnectAccount(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account || !state.backendReady) {
    return;
  }

  const response = await fetch(`/api/accounts/${accountId}/disconnect`, { method: 'POST' });
  const payload = await response.json();
  state.accounts = payload.accounts.map((item) => normaliseAccount(item, state.config.envStatus));
  syncAllPostTargets();
  persistCache();
  renderAll();
  showBanner(`Disconnected ${account.label}.`);
}

async function deleteAccount(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) {
    return;
  }

  if (state.backendReady) {
    const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
    const payload = await response.json();
    state.accounts = payload.accounts.map((item) => normaliseAccount(item, state.config.envStatus));
    state.posts = payload.posts.map((post) => normalisePost(post, state.accounts));
  } else {
    state.accounts = state.accounts.filter((item) => item.id !== accountId);
    syncAllPostTargets();
  }

  persistCache();
  renderAll();
  showBanner(`Removed ${account.label}.`);
}

async function resolveAlert(alertId) {
  if (state.backendReady) {
    const response = await fetch('/api/alerts/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId })
    });
    const payload = await response.json();
    state.alerts = payload.alerts;
  } else {
    state.alerts = state.alerts.map((alert) => alert.id === alertId ? { ...alert, resolved: true } : alert);
  }

  persistCache();
  renderAlerts();
}

async function runDueNow() {
  if (!state.backendReady) {
    showBanner('Run Due Now needs the local backend. Start the app with start.cmd or npm.cmd start.');
    return;
  }

  const response = await fetch('/api/run-due', { method: 'POST' });
  const payload = await response.json();
  state.posts = payload.posts.map((post) => normalisePost(post, state.accounts));
  state.alerts = payload.alerts;
  state.activity = payload.activity;
  persistCache();
  renderAll();
  showBanner(payload.processed.length ? `Processed ${payload.processed.length} due item${payload.processed.length === 1 ? '' : 's'}.` : 'No due items needed action.');
}

async function movePostToCalendarDate(postId, dateKey) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  const nextPost = {
    ...post,
    scheduleAt: setDateKeepingTime(post.scheduleAt, `${dateKey}T00:00`),
    updatedAt: new Date().toISOString()
  };

  const checks = validatePost(nextPost, {
    accounts: state.accounts,
    posts: state.posts,
    envStatus: state.config.envStatus
  });

  const blockingCollision = checks.find((item) => item.level === 'blocked' && (item.label.includes('collision') || item.label.includes('daily cadence')));
  if (blockingCollision) {
    showBanner(blockingCollision.message);
    return;
  }

  await savePostObject(nextPost);
  showBanner(`Moved "${post.title}" to ${formatCalendarRangeDate(new Date(`${dateKey}T00:00`))}.`);
}

async function handleMediaSelection(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }

  const metadata = await Promise.all(files.map(readMediaMetadata));
  let stored = [];
  if (state.backendReady) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await fetch('/api/uploads', { method: 'POST', body: formData });
    const payload = await response.json();
    stored = payload.items || [];
  }

  const merged = metadata.map((item, index) => ({
    ...item,
    ...stored[index]
  }));

  state.composerMedia = [...state.composerMedia, ...merged];
  updateDerivedMediaFields();
  renderMediaList();
  renderValidationRail();
  queueComposerDraftSave();
  dom.mediaInput.value = '';
  showBanner(`${merged.length} media asset${merged.length === 1 ? '' : 's'} attached.`);
}

function clearComposerMedia() {
  state.composerMedia.forEach((item) => {
    if (item.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
  state.composerMedia = [];
  updateDerivedMediaFields();
  renderMediaList();
  renderValidationRail();
  queueComposerDraftSave();
}

function removeComposerMedia(mediaId) {
  const target = state.composerMedia.find((item) => item.id === mediaId);
  if (target?.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(target.previewUrl);
  }
  state.composerMedia = state.composerMedia.filter((item) => item.id !== mediaId);
  updateDerivedMediaFields();
  renderMediaList();
  renderValidationRail();
  queueComposerDraftSave();
}

async function handleQueueImport(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incomingPosts = Array.isArray(parsed) ? parsed : parsed.posts;

    if (!Array.isArray(incomingPosts)) {
      throw new Error('Queue file must contain a posts array.');
    }

    for (const item of incomingPosts) {
      const post = normalisePost(item, state.accounts);
      await savePostObject(post);
    }
    showBanner(`Imported ${incomingPosts.length} queue item${incomingPosts.length === 1 ? '' : 's'}.`);
  } catch {
    showBanner('That queue file could not be imported.');
  } finally {
    dom.importQueueInput.value = '';
  }
}

function exportQueue() {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    posts: state.posts
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'signal-stack-pipeline.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showBanner('Queue exported.');
}

function handlePlatformTargetInput(event) {
  const platform = event.target.dataset.targetPlatform;
  const field = event.target.dataset.targetField;
  const setting = event.target.dataset.targetSetting;
  if (!platform || (!field && !setting)) {
    return;
  }

  const nextTarget = createTargetDraft(platform, state.composerPlatformTargets[platform]);
  let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  if (field === 'hashtags') {
    value = normaliseHashtagString(value);
    event.target.value = value;
  }

  if (setting) {
    nextTarget.settings = {
      ...nextTarget.settings,
      [setting]: event.target.type === 'number'
        ? Number(value || 0)
        : value
    };
  } else {
    nextTarget[field] = value;
  }
  nextTarget.enabled = true;
  state.composerPlatformTargets[platform] = nextTarget;
  renderValidationRail();
  renderPlatformTargetGrid();
  queueComposerDraftSave();
}

function updateCaptionCount() {
  dom.captionCount.textContent = `${dom.captionInput.value.length} characters`;
}

function updateDerivedMediaFields() {
  dom.mediaCountInput.value = String(countPrimaryAssetSlots({
    media: state.composerMedia,
    assetUrls: {
      image: dom.imageUrlInput.value.trim(),
      video: dom.videoUrlInput.value.trim(),
      thumbnail: dom.thumbnailUrlInput.value.trim(),
      audio: dom.audioUrlInput.value.trim()
    }
  }));
  const longestVideo = state.composerMedia
    .filter((item) => item.durationSeconds)
    .reduce((max, item) => Math.max(max, item.durationSeconds), 0);

  if (longestVideo) {
    dom.durationInput.value = String(Math.round(longestVideo));
  }
}

function syncComposerPlatformTargets(explicitPlatforms = null) {
  const platforms = explicitPlatforms || getSelectedPlatforms();
  const nextTargets = { ...state.composerPlatformTargets };

  Object.keys(nextTargets).forEach((platform) => {
    nextTargets[platform] = {
      ...createTargetDraft(platform, nextTargets[platform]),
      enabled: platforms.includes(platform)
    };
  });

  platforms.forEach((platform) => {
    nextTargets[platform] = {
      ...createTargetDraft(platform, nextTargets[platform]),
      enabled: true
    };
  });

  state.composerPlatformTargets = nextTargets;
}

function syncAllPostTargets() {
  state.posts = state.posts.map((post) => normalisePost(post, state.accounts));
  syncComposerPlatformTargets();
}

function getVisiblePosts() {
  return [...state.posts]
    .sort((left, right) => new Date(left.scheduleAt).getTime() - new Date(right.scheduleAt).getTime())
    .filter((post) => {
      const matchesFilter = state.filter === 'all' ? true : post.status === state.filter;
      const haystack = `${post.title} ${post.caption} ${post.hashtags} ${post.group} ${post.platforms.join(' ')}`.toLowerCase();
      const matchesSearch = state.search ? haystack.includes(state.search) : true;
      return matchesFilter && matchesSearch;
    });
}

function getSelectedPlatforms() {
  return Array.from(dom.platformOptions.querySelectorAll('input:checked')).map((input) => input.value);
}

function switchCalendarView(nextView) {
  if (!CALENDAR_VIEWS.includes(nextView)) {
    return;
  }

  state.calendarView = nextView;
  state.calendarFocusDate = nextView === 'month'
    ? getStartOfMonth(state.calendarFocusDate)
    : getStartOfWeek(state.calendarFocusDate);
  renderCalendar();
}

function loadLayoutPrefs() {
  try {
    const raw = localStorage.getItem(LAYOUT_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const inspectorTab = INSPECTOR_TABS.includes(parsed.inspectorTab) ? parsed.inspectorTab : 'checks';
    return {
      compact: Boolean(parsed.compact),
      heroCollapsed: Boolean(parsed.heroCollapsed),
      inspectorOpen: parsed.inspectorOpen !== false,
      inspectorTab
    };
  } catch {
    return {
      compact: false,
      heroCollapsed: false,
      inspectorOpen: true,
      inspectorTab: 'checks'
    };
  }
}

function persistLayoutPrefs() {
  localStorage.setItem(LAYOUT_PREFS_KEY, JSON.stringify(state.ui));
}

function shiftCalendarFocusBackward() {
  if (state.calendarView === 'month') {
    const previousMonth = new Date(state.calendarFocusDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    state.calendarFocusDate = getStartOfMonth(previousMonth);
  } else {
    state.calendarFocusDate = addDays(getStartOfWeek(state.calendarFocusDate), -7);
  }
  renderCalendar();
}

function shiftCalendarFocusForward() {
  if (state.calendarView === 'month') {
    const nextMonth = new Date(state.calendarFocusDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    state.calendarFocusDate = getStartOfMonth(nextMonth);
  } else {
    state.calendarFocusDate = addDays(getStartOfWeek(state.calendarFocusDate), 7);
  }
  renderCalendar();
}

function persistCache() {
  if (state.session.requireAuth) {
    localStorage.removeItem(CACHE_KEY);
    return;
  }

  const cache = {
    posts: state.posts,
    accounts: state.accounts,
    alerts: state.alerts,
    activity: state.activity,
    config: state.config,
    calendarView: state.calendarView
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadLocalDraft(accounts) {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.post) {
      return null;
    }

    return {
      savedAt: parsed.savedAt || '',
      post: normalisePost(parsed.post, accounts)
    };
  } catch {
    return null;
  }
}

function clearComposerDraft() {
  localStorage.removeItem(LOCAL_DRAFT_KEY);
  state.composerDraftSavedAt = '';
  renderDraftPersistenceNote();
}

function queueComposerDraftSave() {
  if (state.composerHydrating) {
    return;
  }

  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(() => {
    persistComposerDraft();
  }, 200);
}

function persistComposerDraft() {
  if (state.composerHydrating) {
    return;
  }

  const savedAt = new Date().toISOString();
  const payload = {
    savedAt,
    post: collectComposerValues()
  };
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
  state.composerDraftSavedAt = savedAt;
  renderDraftPersistenceNote();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

async function readMediaMetadata(file) {
  const previewUrl = URL.createObjectURL(file);
  const base = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    kind: file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
        ? 'audio'
        : file.type === 'image/gif'
          ? 'gif'
          : 'image',
    sizeBytes: file.size,
    width: 0,
    height: 0,
    durationSeconds: 0,
    previewUrl
  };

  if (base.kind === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          ...base,
          width: video.videoWidth,
          height: video.videoHeight,
          durationSeconds: video.duration || 0
        });
      };
      video.onerror = () => resolve(base);
      video.src = previewUrl;
    });
  }

  if (base.kind === 'audio') {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve({
          ...base,
          durationSeconds: audio.duration || 0
        });
      };
      audio.onerror = () => resolve(base);
      audio.src = previewUrl;
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({
      ...base,
      width: image.naturalWidth,
      height: image.naturalHeight
    });
    image.onerror = () => resolve(base);
    image.src = previewUrl;
  });
}

function describePipelineStep(status) {
  switch (status) {
    case 'idea':
      return 'Capture the hook and rough shape.';
    case 'draft':
      return 'Build copy, assets, and targets.';
    case 'approved':
      return 'Ready for sign-off and slotting.';
    case 'scheduled':
      return 'Queued for the scheduler.';
    case 'posted':
      return 'Delivered and logged.';
    default:
      return 'Operational state.';
  }
}

function describeTargetCard(platform) {
  if (platform === 'instagram') return 'Instagram target';
  if (platform === 'tiktok') return 'TikTok target';
  if (platform === 'youtube') return 'YouTube target';
  if (platform === 'shorts') return 'Shorts target';
  return `${getPlatformLabel(platform)} target`;
}

function getTargetInheritanceNote(target) {
  if (target.title || target.caption || target.hashtags) {
    return 'Overrides active';
  }

  return 'Inherits base title and copy';
}

function createTargetDraft(platform, current = {}) {
  const resolvedAccountId = state.accounts.find((account) => account.id === current.accountId && account.platform === platform)?.id
    ?? state.accounts.find((account) => account.platform === platform && account.isDefault)?.id
    ?? state.accounts.find((account) => account.platform === platform)?.id
    ?? '';

  return {
    enabled: current.enabled !== false,
    accountId: resolvedAccountId,
    title: typeof current.title === 'string' ? current.title : '',
    caption: typeof current.caption === 'string' ? current.caption : '',
    hashtags: normaliseHashtagString(current.hashtags || ''),
    settings: {
      ...createDefaultPlatformSettings(platform),
      ...(current.settings && typeof current.settings === 'object' ? current.settings : {})
    }
  };
}

function getAdvanceButtonLabel(status) {
  if (status === 'failed') return 'Recover';
  if (status === 'retrying') return 'Mark Failed';
  if (status === 'posted') return 'Recycle';
  return 'Advance Stage';
}

function getAssetSummaryChips(post) {
  const remoteAssets = getRemoteAssetEntries(post).map((item) => `<span class="asset-chip">${escapeHtml(item.label)}</span>`);
  const uploadedAssets = (post.media || []).map((item) => `<span class="asset-chip">${escapeHtml(item.name)}</span>`);
  return [...remoteAssets, ...uploadedAssets];
}

function getRemoteAssetEntries(post) {
  const assetUrls = post.assetUrls || {};
  return [
    assetUrls.image ? { label: 'Image URL', url: assetUrls.image } : null,
    assetUrls.video ? { label: 'Video URL', url: assetUrls.video } : null,
    assetUrls.thumbnail ? { label: 'Thumbnail URL', url: assetUrls.thumbnail } : null,
    assetUrls.audio ? { label: 'Audio URL', url: assetUrls.audio } : null
  ].filter(Boolean);
}

function applyStatusTimestamps(post, nextStatus, previousPost = null) {
  const nextPost = {
    ...post,
    status: nextStatus
  };

  if (nextStatus === 'approved' && !nextPost.approvedAt) {
    nextPost.approvedAt = new Date().toISOString();
  }

  if (nextStatus === 'posted' && !nextPost.postedAt) {
    nextPost.postedAt = new Date().toISOString();
    nextPost.lastPublishedAt = nextPost.postedAt;
  }

  if (['idea', 'draft'].includes(nextStatus)) {
    nextPost.postedAt = '';
    nextPost.lastPublishedAt = '';
    nextPost.approvedAt = '';
  }

  if (nextStatus === 'scheduled' && previousPost?.status === 'posted') {
    nextPost.postedAt = '';
    nextPost.lastPublishedAt = '';
  }

  return nextPost;
}

function getDateKey(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatCalendarRangeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function showBanner(message) {
  const banner = document.createElement('div');
  banner.className = 'toast';
  banner.textContent = message;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));
  window.setTimeout(() => {
    banner.classList.remove('is-visible');
    window.setTimeout(() => banner.remove(), 240);
  }, 2800);
}

function metricCard(label, value, detail) {
  return `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
