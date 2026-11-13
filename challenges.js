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

async function renderPastChallenges() {
  const container = document.getElementById('past-challenges-grid');
  const countBadge = document.getElementById('challenges-count-badge');
  if (!container) return;

  let challenges = [];
  if (window.cmdSupabase) {
    challenges = await window.cmdSupabase.fetchAllChallenges();
  }

  const now = Date.now();
  const pastChallenges = (challenges || []).filter(c => {
    if (c.end_date) {
      const deadline = new Date(c.end_date).getTime();
      if (!isNaN(deadline)) {
        return deadline <= now;
      }
    }
    return !c.is_active;
  });

  const displayList = pastChallenges.length > 0 ? pastChallenges : fallbackPastChallenges.filter(c => {
    if (c.end_date) {
      const dl = new Date(c.end_date).getTime();
      return isNaN(dl) || dl <= now;
    }
    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${displayList.length} CONCLUDED BRIEFS`;
  }

  if (displayList.length === 0) {
    container.innerHTML = `
      <div style="background:#FFFFFF;border:1px dashed var(--border-light);border-radius:4px;padding:48px 20px;text-align:center;grid-column:1/-1;">
        <span class="mono-tag orange" style="font-size:0.68rem;">COMPETITION ARCHIVE</span>
        <h4 style="font-size:1.15rem;font-weight:700;margin:12px 0 6px;color:var(--text-light-primary);">No past challenges yet</h4>
        <p style="font-size:0.88rem;color:var(--text-light-secondary);margin:0 0 20px;">Current competition briefs remain hidden until their official deadline passes to protect component targets.</p>
        <a href="index.html#challenge" class="btn-sm-action" style="background:#15181B;color:#FFFFFF;text-decoration:none;">View Active Live Challenge &rarr;</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  displayList.forEach(c => {
    const card = document.createElement('div');
    card.style.background = '#FFFFFF';
    card.style.border = '1px solid var(--border-light)';
    card.style.borderRadius = '4px';
    card.style.padding = '24px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const statusTag = `<span class="mono-tag muted-light" style="font-size:0.68rem;">CONCLUDED BRIEF</span>`;

    const hasPdf = c.brief_pdf_url && c.brief_pdf_url !== '#' && !c.brief_pdf_url.startsWith('file:');
    const startStr = c.start_date ? new Date(c.start_date).toLocaleDateString() : '';
    const endStr = c.end_date ? new Date(c.end_date).toLocaleDateString() : '';
    const dateRange = startStr && endStr ? `${startStr} to ${endStr}` : (endStr ? `Deadline: ${endStr}` : 'Sprint Week');

    const hasMass = c.answer_mass != null && c.answer_mass !== '';
    const hasCog = c.answer_cog != null && c.answer_cog !== '';

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="mono-tag orange" style="font-size:0.68rem;">WEEK ${c.week_number}</span>
        ${statusTag}
      </div>

      <div>
        <h3 style="font-size:1.25rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px;color:var(--text-light-primary);">${c.title}</h3>
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-light-secondary);">${dateRange}</div>
      </div>

      <p style="font-size:0.88rem;color:var(--text-light-secondary);line-height:1.6;margin:0;flex:1;">
        ${c.description}
      </p>

      ${hasMass || hasCog ? `
        <div style="background:#F0F2F5;padding:10px 12px;border-radius:4px;display:flex;gap:12px;flex-wrap:wrap;font-family:var(--font-mono);font-size:0.75rem;">
          ${hasMass ? `<div><span style="color:var(--text-light-secondary);">Official Mass:</span> <strong>${c.answer_mass} kg</strong></div>` : ''}
          ${hasCog ? `<div><span style="color:var(--text-light-secondary);">Official CoG:</span> <strong>${c.answer_cog} mm</strong></div>` : ''}
        </div>
      ` : ''}

      <div style="display:flex;gap:10px;margin-top:auto;padding-top:8px;">
        ${hasPdf ? `<a href="${c.brief_pdf_url}" target="_blank" class="btn-sm-action" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;">Download PDF Brief &nearr;</a>` : `<span style="font-size:0.75rem;color:var(--text-light-secondary);">No PDF brief attached</span>`}
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAuthState();
  renderPastChallenges();
});