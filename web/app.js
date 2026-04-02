const STORAGE_KEY = 'signal-stack-posts-v2';
const FILTERS = ['all', 'scheduled', 'draft', 'published'];

const platformCatalog = {
  instagram: {
    label: 'Instagram',
    color: '#ff6a3d',
    captionLimit: 2200,
    requiresMedia: true,
    ratios: ['1:1', '4:5', '9:16']
  },
  tiktok: {
    label: 'TikTok',
    color: '#2ad2c9',
    captionLimit: 2200,
    requiresMedia: true,
    ratios: ['9:16'],
    maxDuration: 180
  },
  youtube: {
    label: 'YouTube',
    color: '#ff4d4d',
    captionLimit: 5000,
    requiresMedia: true,
    ratios: ['16:9', '9:16']
  },
  shorts: {
    label: 'Shorts',
    color: '#ffd166',
    captionLimit: 100,
    requiresMedia: true,
    ratios: ['9:16'],
    maxDuration: 60
  }
};

const templates = {
  'reel-teaser': {
    title: 'Image teaser batch',
    caption: 'Fresh image batch dropping later today. Pick your favourite frame before the full release lands.',
    platforms: ['instagram', 'tiktok', 'shorts'],
    group: 'Art Drop',
    mediaType: 'video',
    ratio: '9:16',
    duration: 18,
    mediaCount: 1,
    quoteMode: false,
    notes: 'Use vertical teaser cut with bold opening frame.',
    status: 'scheduled'
  },
  'youtube-drop': {
    title: 'YouTube main video release',
    caption: 'Full video is live now. Shorts and clips roll out behind it for the rest of the day.',
    platforms: ['youtube', 'shorts'],
    group: 'Video Push',
    mediaType: 'video',
    ratio: '16:9',
    duration: 480,
    mediaCount: 1,
    quoteMode: false,
    notes: 'Prep long-form thumbnail and a 9:16 cutdown.',
    status: 'scheduled'
  },
  'trailer-pulse': {
    title: 'Trailer beat campaign',
    caption: 'A short punchy trailer pulse with a quote hook, launch time, and one strong CTA.',
    platforms: ['instagram', 'tiktok', 'youtube'],
    group: 'Launch Beat',
    mediaType: 'mixed',
    ratio: '9:16',
    duration: 32,
    mediaCount: 3,
    quoteMode: true,
    sourceUrl: 'https://x.com/example/status/1234567890',
    notes: 'Lead with strongest scene and keep the CTA in the final third.',
    status: 'draft'
  }
};

const seedPosts = [
  {
    id: crypto.randomUUID(),
    title: 'Morning art teaser',
    caption: 'Three-frame teaser for the next Midjourney set. Push vertical first, square backup ready.',
    scheduleAt: buildFutureDate(3, 9, 30),
    platforms: ['instagram', 'tiktok', 'shorts'],
    group: 'Art Drop',
    mediaType: 'video',
    ratio: '9:16',
    duration: 21,
    mediaCount: 1,
    quoteMode: false,
    sourceUrl: '',
    notes: 'Need cover frame with bold type.',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: 'YouTube release support',
    caption: 'Long-form release goes live at lunch, with one Short and one IG clip driving people in.',
    scheduleAt: buildFutureDate(4, 12, 15),
    platforms: ['youtube', 'shorts', 'instagram'],
    group: 'Video Push',
    mediaType: 'video',
    ratio: '16:9',
    duration: 540,
    mediaCount: 2,
    quoteMode: false,
    sourceUrl: '',
    notes: 'Need separate vertical cutdown.',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: 'Trailer pulse draft',
    caption: 'A short trailer pulse built around one key quote and a fast CTA.',
    scheduleAt: buildFutureDate(5, 18, 45),
    platforms: ['instagram', 'tiktok'],
    group: 'Launch Beat',
    mediaType: 'mixed',
    ratio: '9:16',
    duration: 30,
    mediaCount: 3,
    quoteMode: true,
    sourceUrl: 'https://x.com/example/status/1234567890',
    notes: 'Strongest line should land inside first two seconds.',
    status: 'draft',
    createdAt: new Date().toISOString()
  }
];

const state = {
  posts: loadPosts(),
  activePostId: null,
  filter: 'all',
  search: ''
};

const dom = {
  composerForm: document.getElementById('composerForm'),
  titleInput: document.getElementById('titleInput'),
  scheduleInput: document.getElementById('scheduleInput'),
  captionInput: document.getElementById('captionInput'),
  captionCount: document.getElementById('captionCount'),
  platformOptions: document.getElementById('platformOptions'),
  groupInput: document.getElementById('groupInput'),
  statusInput: document.getElementById('statusInput'),
  mediaTypeInput: document.getElementById('mediaTypeInput'),
  ratioInput: document.getElementById('ratioInput'),
  durationInput: document.getElementById('durationInput'),
  mediaCountInput: document.getElementById('mediaCountInput'),
  sourceUrlInput: document.getElementById('sourceUrlInput'),
  quoteToggle: document.getElementById('quoteToggle'),
  notesInput: document.getElementById('notesInput'),
  saveDraftBtn: document.getElementById('saveDraftBtn'),
  resetComposerBtn: document.getElementById('resetComposerBtn'),
  duplicateComposerBtn: document.getElementById('duplicateComposerBtn'),
  exportQueueBtn: document.getElementById('exportQueueBtn'),
  queueList: document.getElementById('queueList'),
  calendarGrid: document.getElementById('calendarGrid'),
  validationList: document.getElementById('validationList'),
  insightStats: document.getElementById('insightStats'),
  filterTabs: document.getElementById('filterTabs'),
  searchInput: document.getElementById('searchInput'),
  queueCardTemplate: document.getElementById('queueCardTemplate')
};

renderPlatformOptions();
renderFilterTabs();
setComposerFromPost(getEmptyPost());
attachEvents();
render();

function attachEvents() {
  dom.composerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveComposer();
  });

  dom.saveDraftBtn.addEventListener('click', () => saveComposer('draft'));
  dom.resetComposerBtn.addEventListener('click', resetComposer);
  dom.duplicateComposerBtn.addEventListener('click', duplicateComposer);
  dom.exportQueueBtn.addEventListener('click', exportQueue);
  dom.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderQueue();
    renderCalendar();
  });

  dom.captionInput.addEventListener('input', updateCaptionCount);
  dom.composerForm.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', renderValidationRail);
    field.addEventListener('change', renderValidationRail);
  });

  document.querySelectorAll('[data-template]').forEach((button) => {
    button.addEventListener('click', () => applyTemplate(button.dataset.template));
  });
}

function render() {
  sortPosts();
  persistPosts();
  renderQueue();
  renderCalendar();
  renderValidationRail();
  renderInsightStats();
}

function renderPlatformOptions() {
  dom.platformOptions.innerHTML = Object.entries(platformCatalog)
    .map(([key, platform]) => `
      <label class="platform-option" style="--platform-color: ${platform.color}">
        <input type="checkbox" name="platforms" value="${key}" />
        <span class="platform-option__box">
          <strong>${platform.label}</strong>
          <small>${platform.requiresMedia ? 'Media-first' : 'Flexible'}</small>
        </span>
      </label>
    `)
    .join('');
}

function renderFilterTabs() {
  dom.filterTabs.innerHTML = FILTERS
    .map((filter) => `
      <button class="filter-tab ${state.filter === filter ? 'is-active' : ''}" type="button" data-filter="${filter}">
        ${filter[0].toUpperCase() + filter.slice(1)}
      </button>
    `)
    .join('');

  dom.filterTabs.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      renderFilterTabs();
      renderQueue();
      renderCalendar();
    });
  });
}

function renderQueue() {
  dom.queueList.innerHTML = '';
  const visiblePosts = getVisiblePosts();

  if (!visiblePosts.length) {
    dom.queueList.innerHTML = '<div class="empty-state">Nothing matches the current filter yet.</div>';
    return;
  }

  visiblePosts.forEach((post) => {
    const fragment = dom.queueCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.queue-card');
    const validation = validatePost(post);
    const nextIssues = validation.filter((item) => item.level !== 'ready').length;

    card.classList.toggle('is-active', state.activePostId === post.id);
    fragment.querySelector('.queue-card__status').textContent = post.status;
    fragment.querySelector('.queue-card__status').classList.add(`status--${post.status}`);
    fragment.querySelector('.queue-card__title').textContent = post.title;
    fragment.querySelector('.queue-card__time').textContent = formatDate(post.scheduleAt);
    fragment.querySelector('.queue-card__caption').textContent = post.caption || 'No caption added yet.';
    fragment.querySelector('.queue-card__meta').textContent = `${post.group} | ${post.mediaType} | ${post.ratio} | ${post.duration || 0}s | ${nextIssues} checks`;
    fragment.querySelector('.queue-card__platforms').innerHTML = post.platforms
      .map((platform) => `<span class="platform-tag">${platformCatalog[platform]?.label || platform}</span>`)
      .join('');

    fragment.querySelector('.action-load').addEventListener('click', () => loadPost(post.id));
    fragment.querySelector('.action-duplicate').addEventListener('click', () => duplicatePost(post.id));
    fragment.querySelector('.action-toggle').addEventListener('click', () => cycleStatus(post.id));
    fragment.querySelector('.action-delete').addEventListener('click', () => deletePost(post.id));

    dom.queueList.appendChild(fragment);
  });
}

function renderCalendar() {
  const visiblePosts = getVisiblePosts();
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  dom.calendarGrid.innerHTML = weekdays
    .map((dayName, index) => {
      const items = visiblePosts.filter((post) => getWeekdayIndex(post.scheduleAt) === index);
      const cards = items.length
        ? items.map((post) => `
            <button class="calendar-card" type="button" data-load-post="${post.id}">
              <span>${formatTime(post.scheduleAt)}</span>
              <strong>${post.title}</strong>
              <small>${post.platforms.map((platform) => platformCatalog[platform]?.label || platform).join(', ')}</small>
            </button>
          `).join('')
        : '<div class="calendar-empty">No scheduled items</div>';

      return `
        <section class="day-column">
          <header>
            <span>${dayName}</span>
            <strong>${items.length}</strong>
          </header>
          <div class="day-column__cards">${cards}</div>
        </section>
      `;
    })
    .join('');

  dom.calendarGrid.querySelectorAll('[data-load-post]').forEach((button) => {
    button.addEventListener('click', () => loadPost(button.dataset.loadPost));
  });
}

function renderValidationRail() {
  const composerPost = collectComposerValues();
  const validation = validatePost(composerPost);

  dom.validationList.innerHTML = validation
    .map((item) => `
      <li class="validation-item validation-item--${item.level}">
        <strong>${item.label}</strong>
        <p>${item.message}</p>
      </li>
    `)
    .join('');

  updateCaptionCount();
}

function renderInsightStats() {
  const posts = state.posts;
  const scheduled = posts.filter((post) => post.status === 'scheduled').length;
  const drafts = posts.filter((post) => post.status === 'draft').length;
  const published = posts.filter((post) => post.status === 'published').length;
  const platformCounts = Object.keys(platformCatalog).map((platform) => {
    const count = posts.filter((post) => post.platforms.includes(platform)).length;
    return `<div class="stat-card"><span>${platformCatalog[platform].label}</span><strong>${count}</strong></div>`;
  }).join('');

  dom.insightStats.innerHTML = `
    <div class="stat-card"><span>Total queued</span><strong>${posts.length}</strong></div>
    <div class="stat-card"><span>Scheduled</span><strong>${scheduled}</strong></div>
    <div class="stat-card"><span>Drafts</span><strong>${drafts}</strong></div>
    <div class="stat-card"><span>Published</span><strong>${published}</strong></div>
    ${platformCounts}
  `;
}

function saveComposer(forcedStatus = null) {
  const post = collectComposerValues();
  post.status = forcedStatus || post.status;
  const validation = validatePost(post);

  if (!post.title.trim()) {
    window.alert('Give the post a title first.');
    return;
  }

  if (!post.platforms.length) {
    window.alert('Choose at least one platform.');
    return;
  }

  const existingIndex = state.posts.findIndex((item) => item.id === post.id);
  if (existingIndex >= 0) {
    state.posts[existingIndex] = post;
  } else {
    state.posts.unshift(post);
  }

  state.activePostId = post.id;
  render();

  const blockingIssues = validation.filter((item) => item.level === 'blocked').length;
  showBanner(blockingIssues ? 'Saved with blocked checks to fix before launch.' : 'Post saved into the queue.');
}

function duplicateComposer() {
  const post = collectComposerValues();
  post.id = crypto.randomUUID();
  post.title = `${post.title || 'Untitled'} copy`;
  post.status = 'draft';
  post.createdAt = new Date().toISOString();
  state.posts.unshift(post);
  state.activePostId = post.id;
  render();
  showBanner('Composer duplicated into a new draft.');
}

function loadPost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  state.activePostId = post.id;
  setComposerFromPost(post);
  renderQueue();
  renderValidationRail();
  showBanner(`Loaded "${post.title}" into the composer.`);
}

function duplicatePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  const clone = {
    ...post,
    id: crypto.randomUUID(),
    title: `${post.title} copy`,
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  state.posts.unshift(clone);
  state.activePostId = clone.id;
  render();
  showBanner('Queue item duplicated.');
}

function cycleStatus(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  const flow = {
    draft: 'scheduled',
    scheduled: 'published',
    published: 'draft'
  };

  post.status = flow[post.status] || 'draft';
  render();
  showBanner(`"${post.title}" is now ${post.status}.`);
}

function deletePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  state.posts = state.posts.filter((item) => item.id !== postId);

  if (state.activePostId === postId) {
    state.activePostId = null;
    setComposerFromPost(getEmptyPost());
  }

  render();
  showBanner(post ? `Deleted "${post.title}".` : 'Post deleted.');
}

function resetComposer() {
  state.activePostId = null;
  setComposerFromPost(getEmptyPost());
  renderValidationRail();
  renderQueue();
}

function applyTemplate(templateId) {
  const template = templates[templateId];
  if (!template) {
    return;
  }

  setComposerFromPost({
    ...getEmptyPost(),
    ...template,
    scheduleAt: buildFutureDate(2, 11, 0)
  });
  renderValidationRail();
  showBanner(`Loaded the ${template.title.toLowerCase()} template.`);
}

function exportQueue() {
  const blob = new Blob([JSON.stringify(state.posts, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'signal-stack-queue.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showBanner('Queue exported.');
}

function collectComposerValues() {
  const selectedPlatforms = Array.from(dom.platformOptions.querySelectorAll('input:checked')).map((input) => input.value);

  return {
    id: state.activePostId || crypto.randomUUID(),
    title: dom.titleInput.value.trim(),
    caption: dom.captionInput.value.trim(),
    scheduleAt: dom.scheduleInput.value,
    platforms: selectedPlatforms,
    group: dom.groupInput.value,
    mediaType: dom.mediaTypeInput.value,
    ratio: dom.ratioInput.value,
    duration: Number(dom.durationInput.value || 0),
    mediaCount: Number(dom.mediaCountInput.value || 1),
    sourceUrl: dom.sourceUrlInput.value.trim(),
    quoteMode: dom.quoteToggle.checked,
    notes: dom.notesInput.value.trim(),
    status: dom.statusInput.value,
    createdAt: state.posts.find((post) => post.id === state.activePostId)?.createdAt || new Date().toISOString()
  };
}

function setComposerFromPost(post) {
  dom.titleInput.value = post.title || '';
  dom.captionInput.value = post.caption || '';
  dom.scheduleInput.value = normaliseDateInput(post.scheduleAt);
  dom.groupInput.value = post.group || 'Art Drop';
  dom.statusInput.value = post.status || 'scheduled';
  dom.mediaTypeInput.value = post.mediaType || 'image';
  dom.ratioInput.value = post.ratio || '9:16';
  dom.durationInput.value = post.duration ?? 30;
  dom.mediaCountInput.value = post.mediaCount ?? 1;
  dom.sourceUrlInput.value = post.sourceUrl || '';
  dom.quoteToggle.checked = Boolean(post.quoteMode);
  dom.notesInput.value = post.notes || '';

  Array.from(dom.platformOptions.querySelectorAll('input')).forEach((input) => {
    input.checked = post.platforms?.includes(input.value) || false;
  });

  updateCaptionCount();
}

function getEmptyPost() {
  return {
    title: '',
    caption: '',
    scheduleAt: buildFutureDate(1, 10, 0),
    platforms: ['instagram'],
    group: 'Art Drop',
    mediaType: 'image',
    ratio: '9:16',
    duration: 30,
    mediaCount: 1,
    sourceUrl: '',
    quoteMode: false,
    notes: '',
    status: 'scheduled'
  };
}

function validatePost(post) {
  const checks = [];

  if (!post.platforms.length) {
    checks.push({ level: 'blocked', label: 'No platforms', message: 'Choose at least one destination before saving this item.' });
  } else {
    checks.push({ level: 'ready', label: 'Platforms selected', message: `${post.platforms.length} target${post.platforms.length === 1 ? '' : 's'} currently selected.` });
  }

  post.platforms.forEach((platformKey) => {
    const platform = platformCatalog[platformKey];
    if (!platform) {
      return;
    }

    if (platform.requiresMedia && post.mediaCount < 1) {
      checks.push({ level: 'blocked', label: `${platform.label} needs media`, message: 'This platform needs at least one image or video asset.' });
    }

    if (!platform.ratios.includes(post.ratio)) {
      checks.push({ level: 'warning', label: `${platform.label} ratio mismatch`, message: `${post.ratio} is not the cleanest fit for ${platform.label}.` });
    }

    if (platform.maxDuration && post.duration > platform.maxDuration) {
      checks.push({ level: 'blocked', label: `${platform.label} duration limit`, message: `Current duration of ${post.duration}s exceeds the ${platform.label} limit.` });
    }

    if (platform.captionLimit && post.caption.length > platform.captionLimit) {
      checks.push({ level: 'warning', label: `${platform.label} caption length`, message: `Caption is longer than the usual ${platform.label} limit.` });
    }
  });

  if (post.mediaType === 'carousel' && post.mediaCount < 2) {
    checks.push({ level: 'warning', label: 'Carousel too small', message: 'Carousel posts usually want at least two assets.' });
  }

  if (post.quoteMode && !post.sourceUrl) {
    checks.push({ level: 'blocked', label: 'Quote mode needs a URL', message: 'Add a source or quote URL before treating this as a quote-style post.' });
  }

  if (post.sourceUrl && !/^https?:\/\//i.test(post.sourceUrl)) {
    checks.push({ level: 'warning', label: 'Source URL format', message: 'Source URLs should start with http:// or https://.' });
  }

  if (!post.caption.trim()) {
    checks.push({ level: 'warning', label: 'No caption yet', message: 'You can still save the draft, but the post text is empty.' });
  }

  if (!post.scheduleAt) {
    checks.push({ level: 'blocked', label: 'Missing schedule', message: 'Pick a date and time so it lands in the queue correctly.' });
  }

  return checks;
}

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...seedPosts];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...seedPosts];
  } catch (_) {
    return [...seedPosts];
  }
}

function persistPosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
}

function sortPosts() {
  state.posts.sort((left, right) => {
    const leftTime = new Date(left.scheduleAt).getTime();
    const rightTime = new Date(right.scheduleAt).getTime();
    return leftTime - rightTime;
  });
}

function getVisiblePosts() {
  return state.posts.filter((post) => {
    const matchesFilter = state.filter === 'all' ? true : post.status === state.filter;
    const haystack = `${post.title} ${post.caption} ${post.group} ${post.platforms.join(' ')}`.toLowerCase();
    const matchesSearch = state.search ? haystack.includes(state.search) : true;
    return matchesFilter && matchesSearch;
  });
}

function updateCaptionCount() {
  dom.captionCount.textContent = `${dom.captionInput.value.length} characters`;
}

function buildFutureDate(daysAhead, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, minute, 0, 0);
  return normaliseDateInput(date.toISOString());
}

function normaliseDateInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return buildFutureDate(1, 10, 0);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(value) {
  const date = new Date(value);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getWeekdayIndex(value) {
  const date = new Date(value);
  return (date.getDay() + 6) % 7;
}

function showBanner(message) {
  const banner = document.createElement('div');
  banner.className = 'toast';
  banner.textContent = message;
  document.body.appendChild(banner);

  window.setTimeout(() => banner.classList.add('is-visible'), 10);
  window.setTimeout(() => {
    banner.classList.remove('is-visible');
    window.setTimeout(() => banner.remove(), 220);
  }, 2600);
}
