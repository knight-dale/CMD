const fallbackPastChallenges = [
  {
    week_number: 13,
    title: 'Planar Four Bar Kinematic Rocker',
    description: 'Design a planar crank rocker mechanism optimized to clear a 40 mm transmission tunnel while maintaining a minimum transmission angle of 45 degrees throughout the full stroke cycle.',
    start_date: '2026-10-20',
    end_date: '2026-10-27',
    answer_mass: 1.84,
    answer_cog: 32.5,
    brief_pdf_url: '#',
    is_active: false
  },
  {
    week_number: 12,
    title: 'Helical Planetary Gear Carrier',
    description: 'Model a high torque planetary gear carrier with integrated thrust washers for a 3:1 stage reducer. Perform static FEA to verify allowable torsional deflection under 120 Nm torque.',
    start_date: '2026-10-10',
    end_date: '2026-10-17',
    answer_mass: 2.45,
    answer_cog: 28.0,
    brief_pdf_url: '#',
    is_active: false
  },
  {
    week_number: 11,
    title: 'Cycloidal Speed Reducer Disk',
    description: 'Generate the epicycloidal pin profile and ring gear housing for a 19:1 single stage robotic joint drive. Tolerance pins for needle roller clearance and balance the dual eccentric cam.',
    start_date: '2026-10-01',
    end_date: '2026-10-08',
    answer_mass: 0.92,
    answer_cog: 14.2,
    brief_pdf_url: '#',
    is_active: false
  }
];

function initNavigation() {
  const hamburger = document.getElementById('nav-hamburger-btn');
  const mobilePane = document.getElementById('mobile-nav-pane');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (hamburger && mobilePane) {
    hamburger.addEventListener('click', () => {
      mobilePane.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobilePane.classList.remove('open');
      });
    });
  }
}

async function initAuthState() {
  const unauthDiv = document.getElementById('auth-unauthenticated');
  const authDiv = document.getElementById('auth-authenticated');
  const toggleBtn = document.getElementById('user-profile-toggle');
  const dropdown = document.getElementById('profile-dropdown-menu');
  const navAvatar = document.getElementById('user-nav-avatar');
  const navName = document.getElementById('user-nav-name');
  const dropName = document.getElementById('dropdown-name');
  const dropEmail = document.getElementById('dropdown-email');
  const logoutBtn = document.getElementById('logout-button');
  const adminLink = document.getElementById('nav-admin-link');

  if (!window.cmdSupabase) return;

  const user = await window.cmdSupabase.getCurrentUser();

  if (user) {
    const rawName = user.user_metadata?.display_name || user.email.split('@')[0];
    const initial = rawName.charAt(0).toUpperCase();

    if (unauthDiv) unauthDiv.style.display = 'none';
    if (authDiv) authDiv.style.display = 'block';
    if (navAvatar) navAvatar.textContent = initial;
    if (navName) navName.textContent = rawName;
    if (dropName) dropName.textContent = rawName;
    if (dropEmail) dropEmail.textContent = user.email;

    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.cmdSupabase.signOut();
        window.location.reload();
      });
    }

    const isAdm = await window.cmdSupabase.isAdmin();
    if (isAdm && adminLink) {
      adminLink.style.display = 'block';
    }
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function renderPastChallenges() {
  const container = document.getElementById('past-challenges-grid');
  const countBadge = document.getElementById('challenges-count-badge');
  if (!container) return;

  const list = window.cmdSupabase ? await window.cmdSupabase.fetchPastChallenges() : null;

  if (list === null) {
    if (countBadge) countBadge.textContent = '';
    container.innerHTML = `<div class="past-empty"><p>Could not load past challenges. Please refresh.</p></div>`;
    return;
  }

  if (countBadge) countBadge.textContent = `${list.length} CONCLUDED CHALLENGES`;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="past-empty">
        <span class="mono-tag orange" style="font-size:0.68rem;">COMPETITION ARCHIVE</span>
        <h4>No past challenges yet</h4>
        <p>Official answers are published here once a challenge's timer runs out.</p>
        <a href="index.html#challenge" class="btn-sm-action">View the live challenge &rarr;</a>
      </div>`;
    return;
  }

  const num = v => (v === null || v === undefined || v === '') ? null : Number(v);
  const fmt = v => v === null ? '&mdash;' : String(Math.round(v * 1000) / 1000);

  container.innerHTML = '';
  list.forEach(c => {
    const mass = num(c.answer_mass);
    const cx = num(c.answer_cog_x), cy = num(c.answer_cog_y), cz = num(c.answer_cog_z);
    const hasAnswers = [mass, cx, cy, cz].some(v => v !== null);

    const hasPdf = /^https?:\/\//i.test(c.brief_pdf_url || '');
    const start = c.start_date ? new Date(c.start_date).toLocaleDateString() : '';
    const end = c.end_date ? new Date(c.end_date).toLocaleDateString() : '';
    const dateRange = start && end ? `${start} to ${end}` : (end ? `Ended ${end}` : '');

    const card = document.createElement('div');
    card.className = 'past-card';
    card.innerHTML = `
      <div class="past-card-top">
        <span class="mono-tag orange" style="font-size:0.68rem;">WEEK ${esc(c.week_number)}</span>
        <span class="mono-tag muted-light" style="font-size:0.68rem;">CONCLUDED</span>
      </div>

      <div>
        <h3 class="past-card-title">${esc(c.title)}</h3>
        <div class="past-card-dates">${esc(dateRange)}</div>
      </div>

      ${hasAnswers ? `
        <div class="answer-panel">
          <span class="answer-label">OFFICIAL ANSWERS</span>
          <div class="answer-mass">
            <span>Total mass</span>
            <strong>${fmt(mass)} g</strong>
          </div>
          <div class="answer-cog">
            <div><small>CoG X (mm)</small><strong>${fmt(cx)}</strong></div>
            <div><small>CoG Y (mm)</small><strong>${fmt(cy)}</strong></div>
            <div><small>CoG Z (mm)</small><strong>${fmt(cz)}</strong></div>
          </div>
        </div>` : ''}

      ${c.description ? `
        <details class="more-info">
          <summary>More info</summary>
          <p>${esc(c.description)}</p>
        </details>` : ''}

      <div class="past-card-foot">
        ${hasPdf
          ? `<a href="${esc(c.brief_pdf_url)}" target="_blank" rel="noopener" class="btn-sm-action">Download PDF Brief &nearr;</a>`
          : `<span style="font-size:0.75rem;color:var(--text-light-secondary);">No PDF brief attached</span>`}
      </div>`;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAuthState();
  renderPastChallenges();
});