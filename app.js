const fallbackProjects = [
  {
    id: 'p1',
    title: 'Formula Student',
    category: 'AUTOMOTIVE / 2025',
    description: 'Our lightest, fastest single seater yet. Engineered from the chassis up.',
    tools: ['SolidWorks', 'FEA Frame', 'Carbon Fiber'],
    specs: ['Mass: 195 kg', 'Torsional Rigidity: 2400 Nm/deg'],
    image_url: 'assets/project-formula.svg',
    pdf_url: '#'
  },
  {
    id: 'p2',
    title: 'Atlas robotic arm',
    category: 'ROBOTICS / 2025',
    description: 'Six degrees of freedom. Endless possibility. Precision motion, built from scratch.',
    tools: ['Fusion 360', 'PETG 3D Print', 'Kinematics'],
    specs: ['DOF: 6', 'Payload: 2.5 kg'],
    image_url: 'assets/project-robotarm.svg',
    pdf_url: '#'
  },
  {
    id: 'p3',
    title: 'Off road, reimagined',
    category: 'MOBILITY / 2024',
    description: 'An all terrain rover designed to go where the road does not.',
    tools: ['Inventor', 'ANSYS', 'Rocker Bogie'],
    specs: ['Clearance: 140 mm', 'Drive: 6x6 Brushless'],
    image_url: 'assets/project-rover.svg',
    pdf_url: '#'
  }
];

const fallbackLeaderboard = [
  { rank: 1, display_name: 'Kelvin Mwangi', points: 1840, badges: ['GOLD', 'FEA SPECIALIST', 'TOP VOTER'], submission_count: 14 },
  { rank: 2, display_name: 'Faith Wanjiku', points: 1620, badges: ['SILVER', 'TOLERANCE MASTER'], submission_count: 11 },
  { rank: 3, display_name: 'Brian Kiprop', points: 1490, badges: ['BRONZE', 'FABRICATION LEAD'], submission_count: 9 },
  { rank: 4, display_name: 'Mercy Achieng', points: 1310, badges: ['SOLIDWORKS PRO'], submission_count: 8 },
  { rank: 5, display_name: 'Dennis Kimani', points: 1180, badges: ['SURFACE MODELER'], submission_count: 7 },
  { rank: 6, display_name: 'Grace Muthoni', points: 940, badges: ['CFD ENTHUSIAST'], submission_count: 5 }
];

const fallbackSuggestions = [
  { id: 's1', display_name: 'Samuel Karanja', text: 'Peristaltic chemical dosing pump with toolless snap fit rollers for medical laboratory titration rigs.', votes: 24, is_selected: true },
  { id: 's2', display_name: 'Ann Wambui', text: 'Compliant pantograph mechanism for solar panel angle tracking with zero pin joints.', votes: 19, is_selected: false },
  { id: 's3', display_name: 'Edwin Koech', text: 'Cycloidal drive speed reducer with custom eccentric bearing race for an omnidirectional rover wheel.', votes: 15, is_selected: false }
];

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast-msg ${type}`;
  t.textContent = message;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 260);
  }, 3400);
}

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
  const mobileAuthCta = document.getElementById('mobile-auth-cta');

  if (!window.cmdSupabase) return;

  const user = await window.cmdSupabase.getCurrentUser();

  if (user) {
    const meta = user.user_metadata || {};
    const rawName = meta.display_name || meta.full_name || meta.name || user.email.split('@')[0];
    const initial = rawName.charAt(0).toUpperCase();

    if (unauthDiv) unauthDiv.style.display = 'none';
    if (authDiv) authDiv.style.display = 'block';

    if (navAvatar) navAvatar.textContent = initial;
    if (navName) navName.textContent = rawName;
    if (dropName) dropName.textContent = rawName;
    if (dropEmail) dropEmail.textContent = user.email;

    const navAdminLink = document.getElementById('nav-admin-link');
    if (navAdminLink) {
      const isAdm = await window.cmdSupabase.isAdmin();
      navAdminLink.style.display = isAdm ? 'flex' : 'none';
    }

    if (mobileAuthCta) {
      mobileAuthCta.textContent = `Profile (${rawName})`;
      mobileAuthCta.href = '#top';
    }

    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!authDiv.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.cmdSupabase.signOut();
        showToast('Signed out of member profile', 'info');
        setTimeout(() => location.reload(), 500);
      });
    }
  } else {
    if (unauthDiv) unauthDiv.style.display = 'block';
    if (authDiv) authDiv.style.display = 'none';
  }
}

function startCountdown(targetDateString) {
  const targetTime = targetDateString
    ? new Date(targetDateString).getTime()
    : Date.now() + (4 * 24 * 60 * 60 * 1000) + (16 * 60 * 60 * 1000);

  function update() {
    const now = Date.now();
    const diff = Math.max(0, targetTime - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

async function loadActiveChallenge() {
  let challenge = null;
  if (window.cmdSupabase) {
    challenge = await window.cmdSupabase.fetchCurrentChallenge();
  }

  const weekLbl = document.getElementById('challenge-week-label');
  const titleEl = document.getElementById('challenge-title');
  const descEl = document.getElementById('challenge-desc');
  const dlBtn = document.getElementById('download-brief-btn');

  if (challenge) {
    if (weekLbl) weekLbl.textContent = `WEEK ${challenge.week_number} CHALLENGE`;
    if (titleEl) titleEl.textContent = challenge.title;
    if (descEl) descEl.textContent = challenge.description;
    if (dlBtn && challenge.brief_pdf_url) {
      dlBtn.href = challenge.brief_pdf_url;
    }
    startCountdown(challenge.end_date);
  } else {
    startCountdown(null);
  }
}

async function loadLeaderboardTable() {
  const tbody = document.getElementById('leaderboard-table-rows');
  if (!tbody) return;

  let list = [];
  if (window.cmdSupabase) {
    list = await window.cmdSupabase.fetchLeaderboard();
  }

  if (!list || list.length === 0) {
    list = fallbackLeaderboard;
  }

  tbody.innerHTML = '';
  list.forEach((item, index) => {
    const rankNum = item.rank || (index + 1);
    const tr = document.createElement('tr');

    let rankClass = '';
    if (rankNum === 1) rankClass = 'gold';
    else if (rankNum === 2) rankClass = 'silver';
    else if (rankNum === 3) rankClass = 'bronze';

    const badgesHtml = (item.badges || []).map(b => `<span class="badge-tag">${b}</span>`).join(' ');

    tr.innerHTML = `
      <td><span class="rank-text-pill ${rankClass}">${rankNum}</span></td>
      <td style="font-weight:700;">${item.display_name}</td>
      <td style="font-family:var(--font-mono);font-weight:700;">${item.points} PTS</td>
      <td>${badgesHtml || '<span style="color:var(--text-light-secondary);font-size:0.75rem;">MEMBER</span>'}</td>
      <td style="text-align:right;font-family:var(--font-mono);color:var(--text-light-secondary);">${item.submission_count || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadCommunitySuggestions() {
  const feed = document.getElementById('community-suggestions-feed');
  if (!feed) return;

  let items = [];
  if (window.cmdSupabase) {
    items = await window.cmdSupabase.fetchSuggestions();
  }

  if (!items || items.length === 0) {
    items = fallbackSuggestions;
  }

  const user = window.cmdSupabase ? await window.cmdSupabase.getCurrentUser() : null;
  const votedKeys = user ? JSON.parse(localStorage.getItem(`cmd_votes_${user.id}`) || '[]') : [];

  feed.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'suggestion-feed-item';

    const hasVoted = votedKeys.includes(item.id);
    const voteLabel = hasVoted ? 'Voted' : 'Click to vote';
    const votedClass = hasVoted ? 'voted' : '';

    card.innerHTML = `
      <div style="flex:1;">
        <p style="font-size:0.95rem;font-weight:600;color:var(--text-light-primary);line-height:1.55;">${item.text}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="mono-tag muted-light" style="font-size:0.65rem;">BY ${item.display_name || 'STUDENT'}</span>
            ${item.is_selected ? `<span class="mono-tag orange" style="font-size:0.65rem;background:#FFE7E0;padding:2px 6px;border-radius:2px;">SELECTED FOR WEEK BUILD</span>` : ''}
          </div>
          <button type="button" class="vote-action-btn ${votedClass}" data-id="${item.id}" ${hasVoted ? 'disabled' : ''} aria-label="Vote for this proposal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span class="vote-btn-text">${voteLabel}</span>
            <span class="vote-count-badge" id="count-${item.id}">${item.votes || 0}</span>
          </button>
        </div>
      </div>
    `;

    const btn = card.querySelector('.vote-action-btn');
    if (!hasVoted) {
      btn.addEventListener('click', async () => {
        await handleSuggestionVote(item.id, btn);
      });
    }

    feed.appendChild(card);
  });
}

async function handleSuggestionVote(id, btn) {
  if (!window.cmdSupabase) {
    showToast('Supabase client unconfigured', 'info');
    return;
  }

  const user = await window.cmdSupabase.getCurrentUser();
  if (!user) {
    showToast('Please sign in to vote on next week build', 'error');
    return;
  }

  const votedKeys = JSON.parse(localStorage.getItem(`cmd_votes_${user.id}`) || '[]');
  if (votedKeys.includes(id)) {
    showToast('You have already cast your vote for this proposal', 'error');
    return;
  }

  try {
    await window.cmdSupabase.voteOnSuggestion(id);
    votedKeys.push(id);
    localStorage.setItem(`cmd_votes_${user.id}`, JSON.stringify(votedKeys));

    btn.classList.add('voted');
    btn.disabled = true;
    const textSpan = btn.querySelector('.vote-btn-text');
    if (textSpan) textSpan.textContent = 'Voted';

    const countEl = document.getElementById(`count-${id}`);
    if (countEl) {
      countEl.textContent = parseInt(countEl.textContent || '0', 10) + 1;
    }
    showToast('Vote confirmed', 'success');
  } catch (err) {
    showToast(err.message || 'Vote could not be registered', 'error');
  }
}

function applyMediaSlot(id, url) {
  const el = document.getElementById(id);
  if (el && url && typeof url === 'string') {
    if (url.startsWith('file:') || url.startsWith('C:') || url.startsWith('D:')) return;
    el.src = url;
  }
}

async function loadSiteMedia() {
  const cached = localStorage.getItem('cmd_site_media');
  if (cached) {
    try {
      const media = JSON.parse(cached);
      if (media.hero_image) applyMediaSlot('hero-cad-image', media.hero_image);
      if (media.project_1) applyMediaSlot('project-img-1', media.project_1);
      if (media.project_2) applyMediaSlot('project-img-2', media.project_2);
      if (media.project_3) applyMediaSlot('project-img-3', media.project_3);
      if (media.workshop_image) applyMediaSlot('workshop-main-image', media.workshop_image);
    } catch {
    }
  }

  if (window.cmdSupabase && window.cmdSupabase.fetchSiteMedia) {
    try {
      const remote = await window.cmdSupabase.fetchSiteMedia();
      if (remote) {
        if (remote.hero_image) applyMediaSlot('hero-cad-image', remote.hero_image);
        if (remote.project_1) applyMediaSlot('project-img-1', remote.project_1);
        if (remote.project_2) applyMediaSlot('project-img-2', remote.project_2);
        if (remote.project_3) applyMediaSlot('project-img-3', remote.project_3);
        if (remote.workshop_image) applyMediaSlot('workshop-main-image', remote.workshop_image);
      }
    } catch {
    }
  }
}

function initSuggestionForm() {
  const form = document.getElementById('community-pitch-form');
  const input = document.getElementById('community-pitch-input');
  if (!form || !input) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    if (!window.cmdSupabase) {
      showToast('Supabase client unconfigured', 'info');
      return;
    }

    const user = await window.cmdSupabase.getCurrentUser();
    if (!user) {
      showToast('You must be signed in to submit design pitches', 'error');
      return;
    }

    try {
      await window.cmdSupabase.submitSuggestion(text);
      input.value = '';
      showToast('Design idea submitted for community vote', 'success');
      loadCommunitySuggestions();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    }
  });
}

function initUploadModal() {
  const modal = document.getElementById('model-upload-modal');
  const openBtns = [
    document.getElementById('open-upload-modal-btn'),
    document.getElementById('submit-model-modal-btn'),
    document.getElementById('open-submit-modal-link')
  ];
  const closeBtn = document.getElementById('modal-close-button');
  const form = document.getElementById('cad-pdf-submission-form');

  if (!modal) return;

  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        modal.style.display = 'flex';
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('entry-name').value;
      const email = document.getElementById('entry-email').value;
      const title = document.getElementById('entry-title').value;
      const notes = document.getElementById('entry-notes').value;
      const fileInput = document.getElementById('entry-pdf');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a PDF document', 'error');
        return;
      }

      const file = fileInput.files[0];
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are accepted for review', 'error');
        return;
      }

      showToast('Uploading CAD documentation...', 'info');

      try {
        let pdfUrl = '#';
        if (window.cmdSupabase) {
          const path = `submissions/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          try {
            pdfUrl = await window.cmdSupabase.uploadFile('submissions', path, file);
          } catch {
            pdfUrl = 'uploaded_locally';
          }

          await window.cmdSupabase.submitChallengeEntry({
            member_name: name,
            member_email: email,
            model_title: title,
            pdf_url: pdfUrl,
            notes
          });
        }

        showToast('CAD model PDF submitted successfully', 'success');
        form.reset();
        modal.style.display = 'none';
      } catch (err) {
        showToast(err.message || 'Submission encountered an error', 'error');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteMedia();
  initNavigation();
  initAuthState();
  loadActiveChallenge();
  loadCommunitySuggestions();
  initSuggestionForm();
  loadLeaderboardTable();
  initUploadModal();
});
