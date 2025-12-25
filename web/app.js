const scheduleGrid = document.getElementById('schedule-grid');
const validationList = document.getElementById('validation-list');

const sampleSlots = [
  {
    day: 'Mon',
    time: '09:30',
    title: 'Art drop — teaser',
    meta: 'Will post to Instagram, TikTok, Shorts',
    platforms: ['Instagram', 'TikTok', 'Shorts'],
  },
  {
    day: 'Tue',
    time: '12:15',
    title: 'News: feature launch',
    meta: 'X quote planned from @koltregaskes',
    platforms: ['X · main'],
  },
  {
    day: 'Wed',
    time: '18:45',
    title: 'Full video release',
    meta: 'YouTube plus mirrored snippet to Shorts',
    platforms: ['YouTube', 'Shorts'],
  },
  {
    day: 'Fri',
    time: '07:20',
    title: 'Forwarded pick',
    meta: 'Move later to X alt if slots are full',
    platforms: ['X · alt'],
  },
];

const validations = [
  {
    status: 'ready',
    label: 'Image & video size checks',
    desc: 'Warn and auto-resize before upload.',
  },
  {
    status: 'pending',
    label: 'Per-platform limits',
    desc: 'Caption length, aspect ratios, and Shorts vs YouTube timing.',
  },
  {
    status: 'pending',
    label: 'Quote detection',
    desc: 'Toggle to mark pasted X link as quote; surface API errors clearly.',
  },
  {
    status: 'blocked',
    label: 'OAuth wiring',
    desc: 'Needs client IDs/secrets for each platform before live tests.',
  },
];

function renderSchedule() {
  scheduleGrid.innerHTML = '';
  sampleSlots.forEach((slot) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="row-top">
        <time>${slot.day} · ${slot.time}</time>
        <div class="platforms">${slot.platforms.map((p) => `<span class="pill">${p}</span>`).join('')}</div>
      </div>
      <div class="title">${slot.title}</div>
      <div class="meta">${slot.meta}</div>
    `;
    scheduleGrid.appendChild(card);
  });
}

function renderValidations() {
  validationList.innerHTML = '';
  validations.forEach((item) => {
    const li = document.createElement('li');
    li.className = `validation-item ${item.status}`;
    li.innerHTML = `
      <span class="status-dot"></span>
      <div>
        <div class="label">${item.label}</div>
        <p class="desc">${item.desc}</p>
      </div>
    `;
    validationList.appendChild(li);
  });
}

renderSchedule();
renderValidations();
