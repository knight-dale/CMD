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

function initAdminNavigation() {
  const triggers = document.querySelectorAll('.admin-tab-trigger');
  const panes = document.querySelectorAll('.admin-pane');
  const heading = document.getElementById('admin-page-heading');
  const catTag = document.getElementById('admin-category-tag');

  const titles = {
    'pane-projects': 'Projects Vault',
    'pane-challenges': 'Weekly Competitions',
    'pane-submissions': 'Member Submissions',
    'pane-members': 'Registered Club Members',
    'pane-leaderboard': 'Edit Leaderboard',
    'pane-suggestions': 'Community Polls',
    'pane-media': 'Site Media Manager'
  };

  const categories = {
    'pane-projects': 'SYSTEM ARCHIVE',
    'pane-challenges': 'COMPETITION PIPELINE',
    'pane-submissions': 'STUDENT WORK',
    'pane-members': 'MEMBER DIRECTORY',
    'pane-leaderboard': 'STANDINGS MANAGEMENT',
    'pane-suggestions': 'COMMUNITY VOTES',
    'pane-media': 'ASSET REPLACEMENT'
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetPaneId = trigger.getAttribute('data-tab');

      triggers.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      trigger.classList.add('active');
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.classList.add('active');

      if (heading) heading.textContent = titles[targetPaneId] || 'Console';
      if (catTag) catTag.textContent = categories[targetPaneId] || 'MANAGEMENT';
      if (targetPaneId === 'pane-members') renderMembersList();
    });
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function listToText(value) {
  return Array.isArray(value) ? value.join(', ') : (value || '');
}

// Select a value even if the saved project uses a category/stage that is no longer in the dropdown.
function setSelectValue(select, value) {
  if (value && ![...select.options].some(o => o.value === value)) {
    const opt = new Option(value, value);
    opt.dataset.temp = '1';
    select.add(opt);
  }
  select.value = value || select.options[0].value;
}

function resetProjectForm() {
  document.querySelectorAll('#p-category option[data-temp], #p-stage option[data-temp]')
    .forEach(o => o.remove());

  const form = document.getElementById('project-admin-form');
  if (form) form.reset();

  document.getElementById('p-id').value = '';
  document.getElementById('project-form-tag').textContent = 'NEW CAD MODEL';
  document.getElementById('project-form-heading').textContent = 'Upload Project to Archive';
  document.getElementById('p-submit-button').textContent = 'Register Project in Vault';
  document.getElementById('p-cancel-button').style.display = 'none';
  document.getElementById('p-edit-hint').style.display = 'none';
}

function startProjectEdit(p) {
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-title').value = p.title || '';
  setSelectValue(document.getElementById('p-category'), p.category);
  setSelectValue(document.getElementById('p-stage'), p.stage);
  document.getElementById('p-tools').value = listToText(p.tools);
  document.getElementById('p-specs').value = listToText(p.specs);
  document.getElementById('p-pdf-url').value = p.pdf_url || '';
  document.getElementById('p-img-url').value = p.image_url || '';
  document.getElementById('p-desc').value = p.description || '';
  document.getElementById('p-pdf-file').value = '';
  document.getElementById('p-img-file').value = '';

  document.getElementById('project-form-tag').textContent = 'EDITING PROJECT';
  document.getElementById('project-form-heading').textContent = 'Edit Project Details';
  document.getElementById('p-submit-button').textContent = 'Save Changes';
  document.getElementById('p-cancel-button').style.display = 'inline-flex';
  document.getElementById('p-edit-hint').style.display = 'block';

  document.getElementById('project-form-heading').closest('.admin-box')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function renderProjectsList() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;

  let projects = [];
  if (window.cmdSupabase) {
    projects = await window.cmdSupabase.fetchProjects({});
  }

  if (!projects || projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No projects registered in the vault yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  projects.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700;">${escapeHtml(p.title)}</td>
      <td><span class="mono-tag" style="color:#C8CDD5;">${escapeHtml(p.category)}</span></td>
      <td><span class="mono-tag orange">${escapeHtml(p.stage)}</span></td>
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${escapeHtml(listToText(p.tools))}</td>
      <td style="text-align:right;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" class="btn-sm-action btn-edit-project">Edit</button>
          <button type="button" class="btn-sm-danger btn-delete-project">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-edit-project').addEventListener('click', () => startProjectEdit(p));

    tr.querySelector('.btn-delete-project').addEventListener('click', async () => {
      if (confirm('Confirm deletion of this CAD project?')) {
        try {
          await window.cmdSupabase.deleteProject(p.id);
          showToast('Project removed from vault', 'success');
          // If this project was open in the form, clear it so it can't be "saved" back.
          if (document.getElementById('p-id').value === String(p.id)) resetProjectForm();
          renderProjectsList();
        } catch (err) {
          showToast(err.message || 'Error deleting project', 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function initProjectUploadForm() {
  const form = document.getElementById('project-admin-form');
  if (!form) return;

  const submitBtn = document.getElementById('p-submit-button');
  const cancelBtn = document.getElementById('p-cancel-button');
  if (cancelBtn) cancelBtn.addEventListener('click', resetProjectForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const isEdit = Boolean(id);

    const title = document.getElementById('p-title').value.trim();
    const category = document.getElementById('p-category').value;
    const stage = document.getElementById('p-stage').value;
    const toolsStr = document.getElementById('p-tools').value;
    const specsStr = document.getElementById('p-specs').value;
    const desc = document.getElementById('p-desc').value;

    // When editing, these hold the current URLs. A newly chosen file replaces them.
    let pdfUrl = document.getElementById('p-pdf-url').value.trim();
    let imgUrl = document.getElementById('p-img-url').value.trim();
    const pdfFile = document.getElementById('p-pdf-file').files[0];
    const imgFile = document.getElementById('p-img-file').files[0];

    if (submitBtn) submitBtn.disabled = true;
    showToast(isEdit ? 'Saving project changes...' : 'Uploading CAD project data...', 'info');

    try {
      if (pdfFile && window.cmdSupabase) {
        const path = `drawings/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        pdfUrl = await window.cmdSupabase.uploadFile('projects', path, pdfFile);
      }
      if (imgFile && window.cmdSupabase) {
        const path = `renders/${Date.now()}_${imgFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        imgUrl = await window.cmdSupabase.uploadFile('projects', path, imgFile);
      }

      const fields = {
        title,
        category,
        stage,
        tools: toolsStr.split(',').map(s => s.trim()).filter(Boolean),
        specs: specsStr.split(',').map(s => s.trim()).filter(Boolean),
        description: desc,
        pdf_url: pdfUrl,
        image_url: imgUrl
      };

      if (isEdit) {
        const rows = await window.cmdSupabase.updateProject(id, fields);
        // Supabase returns no error and zero rows when a row-level security policy blocks an update.
        if (Array.isArray(rows) && rows.length === 0) {
          throw new Error('No changes were saved. The projects table may not allow updates (see RLS policy).');
        }
        showToast('Project updated', 'success');
      } else {
        await window.cmdSupabase.addProject({ ...fields, featured: true, votes: 0 });
        showToast('Project successfully registered in vault', 'success');
      }

      resetProjectForm();
      renderProjectsList();
    } catch (err) {
      showToast(err.message || 'Error saving project', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

async function renderChallengesList() {
  const tbody = document.getElementById('challenges-table-body');
  if (!tbody) return;

  let challenges = [];
  if (window.cmdSupabase) {
    challenges = await window.cmdSupabase.fetchAllChallenges();
  }

  if (!challenges || challenges.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No challenges published yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  challenges.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);font-weight:700;">WEEK ${c.week_number}</td>
      <td style="font-weight:700;">${c.title}</td>
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${c.end_date}</td>
      <td>
        ${c.is_active ? `<span class="mono-tag" style="color:var(--neon-green);">LIVE BRIEF</span>` : `<span class="mono-tag muted-dark">ARCHIVED</span>`}
      </td>
      <td style="text-align:right;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          ${!c.is_active ? `<button type="button" class="btn-sm-action btn-set-active" data-id="${c.id}">Activate</button>` : ''}
          <button type="button" class="btn-sm-danger btn-del-challenge" data-id="${c.id}">Delete</button>
        </div>
      </td>
    `;

    const actBtn = tr.querySelector('.btn-set-active');
    if (actBtn) {
      actBtn.addEventListener('click', async () => {
        try {
          await window.cmdSupabase.updateChallenge(c.id, { is_active: true });
          showToast(`Week ${c.week_number} challenge is now active live`, 'success');
          renderChallengesList();
        } catch (err) {
          showToast(err.message || 'Error updating status', 'error');
        }
      });
    }

    const delBtn = tr.querySelector('.btn-del-challenge');
    delBtn.addEventListener('click', async () => {
      if (confirm('Delete this weekly challenge?')) {
        try {
          await window.cmdSupabase.deleteChallenge(c.id);
          showToast('Challenge removed', 'success');
          renderChallengesList();
        } catch (err) {
          showToast(err.message || 'Error deleting challenge', 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function initChallengePublishForm() {
  const form = document.getElementById('challenge-admin-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const week = parseInt(document.getElementById('c-week').value, 10);
    const title = document.getElementById('c-title').value;
    const start = document.getElementById('c-start').value;
    const end = document.getElementById('c-end').value;
    const desc = document.getElementById('c-desc').value;
    const isActive = document.getElementById('c-active').checked;
    const answerMassInput = document.getElementById('c-answer-mass').value;
    const massTolInput = document.getElementById('c-mass-tol').value;
    const cogX = document.getElementById('c-answer-cog-x').value;
    const cogY = document.getElementById('c-answer-cog-y').value;
    const cogZ = document.getElementById('c-answer-cog-z').value;
    const cogTolInput = document.getElementById('c-cog-tol').value;

    let pdfUrl = document.getElementById('c-pdf-url').value.trim();
    const pdfFile = document.getElementById('c-pdf-file').files[0];

    showToast('Publishing CAD challenge brief...', 'info');

    try {
      if (pdfFile && window.cmdSupabase) {
        const path = `briefs/week_${week}_${Date.now()}.pdf`;
        pdfUrl = await window.cmdSupabase.uploadFile('projects', path, pdfFile);
      }

      await window.cmdSupabase.addChallenge({
        week_number: week,
        title,
        start_date: start,
        end_date: end,
        description: desc,
        brief_pdf_url: pdfUrl,
        is_active: isActive,
        answer_mass: answerMassInput !== '' ? parseFloat(answerMassInput) : null,
        answer_mass_tolerance: massTolInput !== '' ? parseFloat(massTolInput) : 0.05,
        answer_cog_x: cogX !== '' ? parseFloat(cogX) : null,
        answer_cog_y: cogY !== '' ? parseFloat(cogY) : null,
        answer_cog_z: cogZ !== '' ? parseFloat(cogZ) : null,
        answer_cog_tolerance: cogTolInput !== '' ? parseFloat(cogTolInput) : 2.0
      });

      showToast(`Week ${week} competition published`, 'success');
      form.reset();
      renderChallengesList();
    } catch (err) {
      showToast(err.message || 'Error publishing challenge', 'error');
    }
  });
}

async function renderSubmissionsList() {
  const tbody = document.getElementById('submissions-table-body');
  if (!tbody) return;

  let subs = [];
  if (window.cmdSupabase) {
    subs = await window.cmdSupabase.fetchSubmissions();
  }

  if (!subs || subs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No member submissions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  subs.forEach(s => {
    const tr = document.createElement('tr');
    const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent';
    const isCleanUrl = s.pdf_url && typeof s.pdf_url === 'string' && s.pdf_url !== '#' && !s.pdf_url.startsWith('file:') && !s.pdf_url.startsWith('C:') && !s.pdf_url.startsWith('D:');
    const massOk = s.mass_correct ? 'YES' : 'NO';
    const cogOk = s.cog_correct ? 'YES' : 'NO';
    const hasNewCog = s.submitted_cog_x != null && s.submitted_cog_y != null && s.submitted_cog_z != null;
    const hasAnyCog = hasNewCog || s.submitted_cog != null;
    const cogText = hasNewCog
      ? `X ${s.submitted_cog_x}, Y ${s.submitted_cog_y}, Z ${s.submitted_cog_z} mm`
      : (s.submitted_cog != null ? s.submitted_cog + ' mm' : 'N/A');
    const promptBonusText = s.prompt_bonus ? '+10 PTS' : 'NO';
    const massStyle = s.mass_correct ? 'color:var(--neon-green);font-weight:700;' : 'color:#E05C5C;';
    const cogStyle = s.cog_correct ? 'color:var(--neon-green);font-weight:700;' : 'color:#E05C5C;';
    const promptStyle = s.prompt_bonus ? 'color:var(--neon-green);font-weight:700;' : 'color:var(--text-dark-secondary);';

    tr.innerHTML = `
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${dateStr}</td>
      <td style="font-weight:700;">${s.member_name}</td>
      <td style="font-size:0.8rem;color:var(--text-dark-secondary);">${s.member_email}</td>
      <td>${s.model_title}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_mass != null ? s.submitted_mass + ' kg' : 'N/A'}</td>
      <td style="${massStyle}font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_mass != null ? massOk : 'N/A'}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;">${cogText}</td>
      <td style="${cogStyle}font-family:var(--font-mono);font-size:0.85rem;">${hasAnyCog ? cogOk : 'N/A'}</td>
      <td style="${promptStyle}font-family:var(--font-mono);font-size:0.85rem;">${promptBonusText}</td>
      <td style="font-family:var(--font-mono);color:var(--neon-green);font-weight:700;">${s.points_awarded || 0}</td>
      
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;max-width:200px;">${s.notes || 'None'}</td>
    `;
    tbody.appendChild(tr);
  });
}

let allMembersCache = [];

async function renderMembersList() {
  const tbody = document.getElementById('members-table-body');
  const countEl = document.getElementById('admin-member-count');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">Loading members directory...</td></tr>`;

  let members = [];
  if (window.cmdSupabase && window.cmdSupabase.fetchMembers) {
    try {
      members = await window.cmdSupabase.fetchMembers();
    } catch {}
  }

  allMembersCache = members || [];
  if (countEl) {
    countEl.textContent = allMembersCache.length;
  }

  renderFilteredMembers(allMembersCache);
}

function renderFilteredMembers(list) {
  const tbody = document.getElementById('members-table-body');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No registered members found.</td></tr>`;
    return;
  }

  const executiveEmails = [
    'jonathan.edwards22@students.dkut.ac.ke',
    'ouma.solomon22@students.dkut.ac.ke'
  ];

  tbody.innerHTML = '';
  list.forEach((m, idx) => {
    const tr = document.createElement('tr');
    const isExec = executiveEmails.includes((m.email || '').toLowerCase().trim());

    let dayJoined = 'N/A';
    if (m.created_at) {
      try {
        const d = new Date(m.created_at);
        dayJoined = isNaN(d.getTime()) ? String(m.created_at).slice(0, 10) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        dayJoined = String(m.created_at).slice(0, 10);
      }
    }

    const roleBadge = isExec
      ? `<span class="status-pill active" style="background:#FFE7E0;color:#FF4A22;">EXECUTIVE</span>`
      : `<span class="status-pill" style="background:#22262B;color:var(--text-dark-primary);">STUDENT</span>`;

    tr.innerHTML = `
      <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dark-secondary);">${idx + 1}</td>
      <td style="font-weight:700;">${m.display_name || (m.email ? m.email.split('@')[0] : 'Member')}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;color:var(--text-dark-secondary);">${m.email || 'N/A'}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;">${dayJoined}</td>
      <td>${roleBadge}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;color:var(--neon-green);font-weight:700;">${m.points || 0} PTS</td>
      <td style="text-align:right;font-family:var(--font-mono);font-size:0.85rem;color:var(--text-dark-secondary);">${m.submission_count || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initMembersSearch() {
  const searchInput = document.getElementById('member-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      renderFilteredMembers(allMembersCache);
      return;
    }
    const filtered = allMembersCache.filter(m => {
      const name = (m.display_name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
    renderFilteredMembers(filtered);
  });
}

async function renderLeaderboardAdmin() {
  const tbody = document.getElementById('leaderboard-admin-tbody');
  if (!tbody) return;

  let entries = [];
  if (window.cmdSupabase) {
    entries = await window.cmdSupabase.fetchLeaderboard();
  }

  if (!entries || entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No members recorded on leaderboard.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  entries.forEach((m, idx) => {
    const computedRank = idx + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);font-weight:700;">${computedRank}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem;">${m.member_email || ''}</td>
      <td style="font-weight:700;">${m.display_name}</td>
      <td style="font-family:var(--font-mono);color:var(--neon-green);font-weight:700;">${m.points}</td>
      <td style="font-size:0.75rem;color:var(--text-dark-secondary);">${(m.badges || []).join(', ')}</td>
      <td style="color:var(--text-dark-secondary);font-family:var(--font-mono);">${m.submission_count || 0}</td>
      <td style="text-align:right;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" class="btn-sm-action btn-edit-entry" data-id="${m.id}">Edit</button>
          <button type="button" class="btn-sm-danger btn-del-entry" data-id="${m.id}">Delete</button>
        </div>
      </td>
    `;

    const editBtn = tr.querySelector('.btn-edit-entry');
    editBtn.addEventListener('click', () => {
      document.getElementById('lb-id').value = m.id;
      document.getElementById('lb-email').value = m.member_email || '';
      document.getElementById('lb-name').value = m.display_name;
      document.getElementById('lb-points').value = m.points;
      document.getElementById('lb-count').value = m.submission_count || 0;
      document.getElementById('lb-badges').value = (m.badges || []).join(', ');

      const cancelBtn = document.getElementById('lb-cancel-button');
      const submitBtn = document.getElementById('lb-submit-button');
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.textContent = 'Update Member Record';
    });

    const delBtn = tr.querySelector('.btn-del-entry');
    delBtn.addEventListener('click', async () => {
      if (confirm(`Remove ${m.display_name} from leaderboard?`)) {
        try {
          await window.cmdSupabase.deleteLeaderboardEntry(m.id);
          showToast('Member removed from leaderboard', 'success');
          renderLeaderboardAdmin();
        } catch (err) {
          showToast(err.message || 'Error deleting member', 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function initLeaderboardEditorForm() {
  const form = document.getElementById('leaderboard-admin-form');
  const cancelBtn = document.getElementById('lb-cancel-button');
  const submitBtn = document.getElementById('lb-submit-button');
  if (!form) return;

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('lb-id').value = '';
      cancelBtn.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Save Member Standings';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('lb-id').value;
    const email = document.getElementById('lb-email').value.toLowerCase().trim();
    const name = document.getElementById('lb-name').value;
    const points = parseInt(document.getElementById('lb-points').value, 10);
    const count = parseInt(document.getElementById('lb-count').value, 10);
    const badgesStr = document.getElementById('lb-badges').value;

    if (!email) {
      showToast('Member email is required', 'error');
      return;
    }

    const badges = badgesStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    try {
      if (id) {
        await window.cmdSupabase.updateLeaderboardEntry(id, {
          member_email: email,
          display_name: name,
          points,
          submission_count: count,
          badges
        });
        showToast('Member standings updated', 'success');
      } else {
        await window.cmdSupabase.addLeaderboardEntry({
          member_email: email,
          display_name: name,
          points,
          submission_count: count,
          badges
        });
        showToast('Member added to leaderboard', 'success');
      }

      form.reset();
      document.getElementById('lb-id').value = '';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Save Member Standings';
      renderLeaderboardAdmin();
    } catch (err) {
      showToast(err.message || 'Error updating leaderboard', 'error');
    }
  });
}

async function renderSuggestionsAdmin() {
  const tbody = document.getElementById('suggestions-admin-tbody');
  if (!tbody) return;

  let list = [];
  if (window.cmdSupabase) {
    list = await window.cmdSupabase.fetchSuggestions();
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No community proposals submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  list.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);font-weight:700;color:var(--neon-green);font-size:1.1rem;">${s.votes || 0}</td>
      <td style="font-size:0.9rem;max-width:380px;">${s.text}</td>
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${s.display_name}</td>
      <td>
        ${s.is_selected ? `<span class="mono-tag" style="color:var(--neon-green);">SELECTED FOR BUILD</span>` : `<span class="mono-tag muted-dark">IN VOTING QUEUE</span>`}
      </td>
      <td style="text-align:right;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          ${!s.is_selected ? `<button type="button" class="btn-sm-action btn-select-winner" data-id="${s.id}">Select For Build</button>` : ''}
          <button type="button" class="btn-sm-danger btn-del-suggestion" data-id="${s.id}">Delete</button>
        </div>
      </td>
    `;

    const selBtn = tr.querySelector('.btn-select-winner');
    if (selBtn) {
      selBtn.addEventListener('click', async () => {
        try {
          await window.cmdSupabase.markSuggestionSelected(s.id);
          showToast('Suggestion marked as week build project', 'success');
          renderSuggestionsAdmin();
        } catch (err) {
          showToast(err.message || 'Error selecting build', 'error');
        }
      });
    }

    const delBtn = tr.querySelector('.btn-del-suggestion');
    delBtn.addEventListener('click', async () => {
      if (confirm('Delete this design suggestion?')) {
        try {
          await window.cmdSupabase.deleteSuggestion(s.id);
          showToast('Suggestion removed', 'success');
          renderSuggestionsAdmin();
        } catch (err) {
          showToast(err.message || 'Error deleting suggestion', 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function initSiteMediaManager() {
  const defaults = {
    hero_image: 'assets/cad-assembly.svg',
    project_1: 'assets/project-formula.svg',
    project_2: 'assets/project-robotarm.svg',
    project_3: 'assets/project-rover.svg',
    workshop_image: 'assets/workshop-photo.svg'
  };

  const getMediaMap = () => {
    try {
      return JSON.parse(localStorage.getItem('cmd_site_media')) || {};
    } catch {
      return {};
    }
  };

  const saveMediaMap = (map) => {
    localStorage.setItem('cmd_site_media', JSON.stringify(map));
  };

  const currentMap = getMediaMap();

  const slots = [
    { key: 'hero_image', fileId: 'media-hero-file', previewId: 'preview-hero-img', saveBtnId: 'save-hero-img-btn', resetBtnId: 'reset-hero-img-btn', label: 'Hero prototype graphic' },
    { key: 'project_1', fileId: 'media-proj1-file', previewId: 'preview-proj1-img', saveBtnId: 'save-proj1-img-btn', resetBtnId: 'reset-proj1-img-btn', label: 'Project 01 image' },
    { key: 'project_2', fileId: 'media-proj2-file', previewId: 'preview-proj2-img', saveBtnId: 'save-proj2-img-btn', resetBtnId: 'reset-proj2-img-btn', label: 'Project 02 image' },
    { key: 'project_3', fileId: 'media-proj3-file', previewId: 'preview-proj3-img', saveBtnId: 'save-proj3-img-btn', resetBtnId: 'reset-proj3-img-btn', label: 'Project 03 image' },
    { key: 'workshop_image', fileId: 'media-workshop-file', previewId: 'preview-workshop-img', saveBtnId: 'save-workshop-img-btn', resetBtnId: 'reset-workshop-img-btn', label: 'Workshop session image' }
  ];

  slots.forEach(slot => {
    const previewEl = document.getElementById(slot.previewId);
    if (previewEl && currentMap[slot.key]) {
      const srcVal = currentMap[slot.key];
      if (typeof srcVal === 'string' && !srcVal.startsWith('file:') && !srcVal.startsWith('C:') && !srcVal.startsWith('D:')) {
        previewEl.src = srcVal;
      }
    }

    const saveBtn = document.getElementById(slot.saveBtnId);
    const fileInput = document.getElementById(slot.fileId);

    if (saveBtn && fileInput) {
      saveBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
          showToast(`Please choose a JPG or PNG file to replace ${slot.label}`, 'error');
          return;
        }

        const file = fileInput.files[0];
        showToast(`Processing ${file.name}...`, 'info');

        let finalUrl = '';
        let uploadFailed = false;
        let uploadError = '';

        if (window.cmdSupabase && window.cmdSupabase.uploadFile) {
          try {
            const path = `site_media/${slot.key}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            finalUrl = await window.cmdSupabase.uploadFile('projects', path, file);
          } catch (err) {
            uploadFailed = true;
            uploadError = err.message || 'Storage error';
          }
        }

        if (finalUrl) {
          try {
            if (window.cmdSupabase && window.cmdSupabase.saveSiteMediaSlot) {
              await window.cmdSupabase.saveSiteMediaSlot(slot.key, finalUrl);
            }
            const updated = getMediaMap();
            updated[slot.key] = finalUrl;
            saveMediaMap(updated);
            if (previewEl) previewEl.src = finalUrl;
            showToast(`${slot.label} published live to Supabase for all devices`, 'success');
          } catch (err) {
            showToast(`Image uploaded to storage but database sync failed: ${err.message}. Run admin_migration.sql`, 'error');
          }
        } else {
          showToast(`Cloud storage upload failed: ${uploadError || 'projects bucket missing'}. Run admin_migration.sql in Supabase SQL editor`, 'error');
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const updated = getMediaMap();
            updated[slot.key] = dataUrl;
            saveMediaMap(updated);
            if (previewEl) previewEl.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const resetBtn = document.getElementById(slot.resetBtnId);
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const updated = getMediaMap();
        delete updated[slot.key];
        saveMediaMap(updated);
        if (window.cmdSupabase && window.cmdSupabase.resetSiteMediaSlot) {
          await window.cmdSupabase.resetSiteMediaSlot(slot.key);
        }
        if (previewEl) previewEl.src = defaults[slot.key];
        if (fileInput) fileInput.value = '';
        showToast(`${slot.label} restored to default`, 'info');
      });
    }
  });

  if (window.cmdSupabase && window.cmdSupabase.fetchSiteMedia) {
    window.cmdSupabase.fetchSiteMedia().then(remoteMap => {
      slots.forEach(slot => {
        const previewEl = document.getElementById(slot.previewId);
        if (previewEl && remoteMap && remoteMap[slot.key]) {
          const srcVal = remoteMap[slot.key];
          if (typeof srcVal === 'string' && !srcVal.startsWith('file:') && !srcVal.startsWith('C:') && !srcVal.startsWith('D:')) {
            previewEl.src = srcVal;
          }
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.cmdSupabase) {
    const isAdm = await window.cmdSupabase.isAdmin();
    if (!isAdm) {
      window.location.href = 'auth.html';
      return;
    }
  }

  initAdminNavigation();
  initProjectUploadForm();
  renderProjectsList();
  initChallengePublishForm();
  renderChallengesList();
  renderSubmissionsList();
  renderMembersList();
  initMembersSearch();
  initLeaderboardEditorForm();
  renderLeaderboardAdmin();
  renderSuggestionsAdmin();
  initSiteMediaManager();

  const reloadSubBtn = document.getElementById('reload-submissions-button');
  if (reloadSubBtn) {
    reloadSubBtn.addEventListener('click', () => {
      renderSubmissionsList();
      showToast('Submissions refreshed', 'info');
    });
  }

  const reloadMembersBtn = document.getElementById('reload-members-button');
  if (reloadMembersBtn) {
    reloadMembersBtn.addEventListener('click', async () => {
      await renderMembersList();
      showToast('Members directory refreshed', 'info');
    });
  }
});
