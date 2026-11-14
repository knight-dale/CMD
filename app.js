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

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  if (type === 'success' || type === 'error') {
    const infos = container.querySelectorAll('.toast-msg.info');
    infos.forEach(i => i.remove());
  }
  const t = document.createElement('div');
  t.className = `toast-msg ${type}`;
  t.textContent = message;
  container.appendChild(t);
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 220);
  }, 3000);
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

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadLeaderboardTable() {
  const tbody = document.getElementById('leaderboard-table-rows');
  if (!tbody) return;

  const list = window.cmdSupabase ? await window.cmdSupabase.fetchLeaderboard() : null;
  const msgRow = text =>
    `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-light-secondary);">${text}</td></tr>`;

  if (list === null) { tbody.innerHTML = msgRow('Could not load standings. Please refresh.'); return; }
  if (list.length === 0) { tbody.innerHTML = msgRow('No scores yet. Submit a model to take the first spot.'); return; }

  list.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));

  tbody.innerHTML = '';
  list.forEach((item, index) => {
    const rankNum = index + 1;
    const rankClass = rankNum === 1 ? 'gold' : rankNum === 2 ? 'silver' : rankNum === 3 ? 'bronze' : '';
    const badgesHtml = (item.badges || []).map(b => `<span class="badge-tag">${escapeHtml(b)}</span>`).join(' ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-text-pill ${rankClass}">${rankNum}</span></td>
      <td style="font-weight:700;">${escapeHtml(item.display_name)}</td>
      <td style="font-family:var(--font-mono);font-weight:700;">${Number(item.points) || 0} PTS</td>
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
    feed.innerHTML = `
      <div style="background:#FFFFFF;border:1px dashed var(--border-light);border-radius:4px;padding:32px 20px;text-align:center;">
        <span class="mono-tag orange" style="font-size:0.68rem;">COMMUNITY PIPELINE</span>
        <h4 style="font-size:1.05rem;font-weight:700;margin:10px 0 6px;color:var(--text-light-primary);">No proposals yet</h4>
        <p style="font-size:0.85rem;color:var(--text-light-secondary);margin:0;">No proposals yet. Submit one using the form below to begin community voting.</p>
      </div>
    `;
    return;
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

  votedKeys.push(id);
  localStorage.setItem(`cmd_votes_${user.id}`, JSON.stringify(votedKeys));
  btn.classList.add('voted');
  btn.disabled = true;
  const textSpan = btn.querySelector('.vote-btn-text');
  if (textSpan) textSpan.textContent = 'Voted';
  const countEl = document.getElementById(`count-${id}`);
  const prevCount = countEl ? parseInt(countEl.textContent || '0', 10) : 0;
  if (countEl) countEl.textContent = prevCount + 1;
  showToast('Vote confirmed', 'success');

  try {
    await window.cmdSupabase.voteOnSuggestion(id);
  } catch (err) {
    const revertKeys = votedKeys.filter(k => k !== id);
    localStorage.setItem(`cmd_votes_${user.id}`, JSON.stringify(revertKeys));
    btn.classList.remove('voted');
    btn.disabled = false;
    if (textSpan) textSpan.textContent = 'Click to vote';
    if (countEl) countEl.textContent = prevCount;
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

  const submitBtn = form.querySelector('button[type="submit"]');

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

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting pitch...';
    }

    try {
      await window.cmdSupabase.submitSuggestion(text);
      input.value = '';
      showToast('Design idea submitted for community vote', 'success');
      loadCommunitySuggestions();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Design Pitch \u2197';
      }
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
  const formView = document.getElementById('modal-form-view');
  const resultsView = document.getElementById('modal-results-view');
  const submitBtn = document.getElementById('entry-submit-btn');
  const gotoLbBtn = document.getElementById('res-goto-leaderboard-btn');
  const submitAnotherBtn = document.getElementById('res-submit-another-btn');

  let latestResult = null;
  let lastMass = null;
  let lastCog = null;

  if (!modal) return;

  function resetModalState() {
    if (formView) formView.style.display = 'block';
    if (resultsView) resultsView.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload Model for Evaluation \u2192';
      submitBtn.style.background = '';
      submitBtn.style.color = '';
    }
    latestResult = null;
    lastMass = null;
    lastCog = null;
  }

    let submissionToken = 0;

  function setResultsHeader(tagText, bg, color, message) {
    const tag = resultsView.querySelector('.mono-tag');
    const msg = resultsView.querySelector('p');
    if (tag) { tag.textContent = tagText; tag.style.background = bg; tag.style.color = color; }
    if (msg) msg.textContent = message;
  }

  function showPending(mass, cog) {
    if (!resultsView) return;
    if (formView) formView.style.display = 'none';
    resultsView.style.display = 'block';
    setResultsHeader('SUBMISSION RECEIVED', '#E8F0FE', '#1A73E8',
      'Your entry is in. Verifying in the background; your score will appear here in a few seconds.');

    const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    const setBadge = id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = 'VERIFYING...'; el.style.background = '#F0F2F5'; el.style.color = 'var(--text-light-secondary)'; }
    };
    setText('res-mass-val', mass != null ? `${mass} g` : 'N/A');
    setText('res-cog-val', cog && cog.x != null ? `X ${cog.x}, Y ${cog.y}, Z ${cog.z} mm` : 'N/A');
    setText('res-prompt-val', 'Checking...');
    setBadge('res-mass-badge'); setBadge('res-cog-badge'); setBadge('res-prompt-badge');
    setText('res-round-points', '...');
    setText('res-total-points', '...');
  }

  function displayResults(result, mass, cog) {
    if (!resultsView) return;
    if (formView) formView.style.display = 'none';
    resultsView.style.display = 'block';
    setResultsHeader('EVALUATION COMPLETE', '#E6F9EE', '#0B8A3E',
      'Your parameters have been scored and your total points updated on the leaderboard.');

    const massVal = document.getElementById('res-mass-val');
    const massBadge = document.getElementById('res-mass-badge');
    const cogVal = document.getElementById('res-cog-val');
    const cogBadge = document.getElementById('res-cog-badge');
    const promptVal = document.getElementById('res-prompt-val');
    const promptBadge = document.getElementById('res-prompt-badge');
    const roundPts = document.getElementById('res-round-points');
    const totalPts = document.getElementById('res-total-points');

    if (massVal) massVal.textContent = mass != null ? `${mass} kg` : 'N/A';
    if (massBadge) {
      if (result.massTier === 'EXACT' || result.massPoints === 30) {
        massBadge.textContent = 'EXACT (+30 PTS)';
        massBadge.style.background = '#E6F9EE';
        massBadge.style.color = '#0B8A3E';
      } else if (result.massTier === 'TOLERANCE' || result.massPoints === 15) {
        massBadge.textContent = 'IN TOLERANCE (+15 PTS)';
        massBadge.style.background = '#E8F0FE';
        massBadge.style.color = '#1A73E8';
      } else {
        massBadge.textContent = 'OFF TOLERANCE (+0 PTS)';
        massBadge.style.background = '#FEECEB';
        massBadge.style.color = '#C8322B';
      }
    }

    if (cogVal) cogVal.textContent = (cog && cog.x != null) ? `X ${cog.x}, Y ${cog.y}, Z ${cog.z} mm` : 'N/A';
    if (cogBadge) {
      if (result.cogTier === 'EXACT' || result.cogPoints === 15) {
        cogBadge.textContent = 'EXACT (+15 PTS)';
        cogBadge.style.background = '#E6F9EE';
        cogBadge.style.color = '#0B8A3E';
      } else if (result.cogTier === 'TOLERANCE' || result.cogPoints === 7) {
        cogBadge.textContent = 'IN TOLERANCE (+7 PTS)';
        cogBadge.style.background = '#E8F0FE';
        cogBadge.style.color = '#1A73E8';
      } else {
        cogBadge.textContent = 'OFF TOLERANCE (+0 PTS)';
        cogBadge.style.background = '#FEECEB';
        cogBadge.style.color = '#C8322B';
      }
    }

    if (promptVal) {
      promptVal.textContent = result.promptBonus ? 'Within 2 Hours Window' : 'Standard Window';
    }
    if (promptBadge) {
      promptBadge.textContent = result.promptBonus ? '+10 PTS' : '+0 PTS';
      promptBadge.style.background = result.promptBonus ? '#E6F9EE' : '#F0F2F5';
      promptBadge.style.color = result.promptBonus ? '#0B8A3E' : 'var(--text-light-secondary)';
    }

    if (roundPts) roundPts.textContent = `+${result.pointsAwarded || 0} PTS`;
    if (totalPts) totalPts.textContent = `${result.totalPoints || result.pointsAwarded || 0} PTS`;

    loadLeaderboardTable();
  }

  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', async () => {
        if (!window.cmdSupabase) {
          showToast('Connection unconfigured', 'error');
          return;
        }
        const user = await window.cmdSupabase.getCurrentUser();
        if (!user) {
          showToast('Please sign in to submit CAD models', 'error');
          setTimeout(() => {
            window.location.href = 'auth.html';
          }, 800);
          return;
        }

        const nameEl = document.getElementById('modal-logged-user-name');
        const emailEl = document.getElementById('modal-logged-user-email');
        if (nameEl) nameEl.textContent = user.user_metadata?.display_name || user.email.split('@')[0];
        if (emailEl) emailEl.textContent = user.email;

        resetModalState();
        modal.style.display = 'flex';
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resetModalState();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      resetModalState();
    }
  });

  if (gotoLbBtn) {
    gotoLbBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resetModalState();
      const lbSection = document.getElementById('leaderboard');
      if (lbSection) {
        lbSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (submitAnotherBtn) {
    submitAnotherBtn.addEventListener('click', () => {
      if (form) form.reset();
      resetModalState();
    });
  }

    if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.cmdSupabase) return;

      const fileInput = document.getElementById('entry-pdf');
      const readNum = id => { const el = document.getElementById(id); return el && el.value !== '' ? parseFloat(el.value) : null; };
      const submittedMass = readNum('entry-mass');
      const cog = { x: readNum('entry-cog-x'), y: readNum('entry-cog-y'), z: readNum('entry-cog-z') };

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a PDF document', 'error');
        return;
      }
      const file = fileInput.files[0];
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are accepted for review', 'error');
        return;
      }

      const user = await window.cmdSupabase.getCurrentUser();
      if (!user) {
        showToast('Please sign in to submit CAD models', 'error');
        setTimeout(() => { window.location.href = 'auth.html'; }, 800);
        return;
      }

      const name = user.user_metadata?.display_name || user.email.split('@')[0];
      const path = `submissions/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const pdfUrl = window.cmdSupabase.getPublicUrl('submissions', path);
      const token = ++submissionToken;

      // Instant feedback
      showPending(submittedMass, cog);
      showToast('Submission received. Verifying in the background...', 'success');

      // Background: PDF upload
      window.cmdSupabase.uploadFile('submissions', path, file)
        .catch(err => console.error('PDF upload failed:', err));

      // Background: scoring
      window.cmdSupabase.submitChallengeEntryWithScoring({
        member_name: name,
        member_email: user.email,
        model_title: 'CAD Competition Submission',
        pdf_url: pdfUrl,
        notes: '',
        submitted_mass: submittedMass,
        submitted_cog_x: cog.x,
        submitted_cog_y: cog.y,
        submitted_cog_z: cog.z
      }).then(result => {
        const stillViewing = token === submissionToken && resultsView.style.display === 'block';
        if (stillViewing) {
          displayResults(result, submittedMass, cog);
        } else {
          showToast(`Verified: +${result.pointsAwarded} pts`, 'success');
        }
        if (result.syncDone) result.syncDone.then(loadLeaderboardTable);
      }).catch(err => {
        if (token === submissionToken && resultsView.style.display === 'block') {
          setResultsHeader('VERIFICATION FAILED', '#FEECEB', '#C8322B',
            `We could not verify this entry: ${err.message || 'unknown error'}. Please submit again.`);
        }
        showToast(err.message || 'Verification failed', 'error');
      });
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

  let lastY = window.scrollY;
  function handleNavScroll() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    const curY = window.scrollY;
    if (curY > lastY && curY > 80) {
      nav.classList.add('hide');
    } else {
      nav.classList.remove('hide');
    }
    if (curY > 80) nav.classList.add('sticky');
    else nav.classList.remove('sticky');
    lastY = curY;
  }
  window.addEventListener('scroll', handleNavScroll);
});