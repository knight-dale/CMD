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

function initAdminNavigation() {
  const triggers = document.querySelectorAll('.admin-tab-trigger');
  const panes = document.querySelectorAll('.admin-pane');
  const heading = document.getElementById('admin-page-heading');
  const catTag = document.getElementById('admin-category-tag');

  const titles = {
    'pane-projects': 'Projects Vault',
    'pane-challenges': 'Weekly Competitions',
    'pane-submissions': 'Member Submissions',
    'pane-leaderboard': 'Edit Leaderboard',
    'pane-suggestions': 'Community Polls',
    'pane-media': 'Site Media Manager'
  };

  const categories = {
    'pane-projects': 'SYSTEM ARCHIVE',
    'pane-challenges': 'COMPETITION PIPELINE',
    'pane-submissions': 'STUDENT WORK',
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
    });
  });
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
      <td style="font-weight:700;">${p.title}</td>
      <td><span class="mono-tag" style="color:#C8CDD5;">${p.category}</span></td>
      <td><span class="mono-tag orange">${p.stage}</span></td>
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${(p.tools || []).join(', ')}</td>
      <td style="text-align:right;">
        <button type="button" class="btn-sm-danger btn-delete-project" data-id="${p.id}">Delete</button>
      </td>
    `;

    const delBtn = tr.querySelector('.btn-delete-project');
    delBtn.addEventListener('click', async () => {
      if (confirm('Confirm deletion of this CAD project?')) {
        try {
          await window.cmdSupabase.deleteProject(p.id);
          showToast('Project removed from vault', 'success');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('p-title').value;
    const category = document.getElementById('p-category').value;
    const stage = document.getElementById('p-stage').value;
    const toolsStr = document.getElementById('p-tools').value;
    const specsStr = document.getElementById('p-specs').value;
    const desc = document.getElementById('p-desc').value;

    let pdfUrl = document.getElementById('p-pdf-url').value.trim();
    let imgUrl = document.getElementById('p-img-url').value.trim();
    const pdfFile = document.getElementById('p-pdf-file').files[0];
    const imgFile = document.getElementById('p-img-file').files[0];

    showToast('Uploading CAD project data...', 'info');

    try {
      if (pdfFile && window.cmdSupabase) {
        const path = `drawings/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        pdfUrl = await window.cmdSupabase.uploadFile('projects', path, pdfFile);
      }
      if (imgFile && window.cmdSupabase) {
        const path = `renders/${Date.now()}_${imgFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        imgUrl = await window.cmdSupabase.uploadFile('projects', path, imgFile);
      }

      const tools = toolsStr.split(',').map(s => s.trim()).filter(Boolean);
      const specs = specsStr.split(',').map(s => s.trim()).filter(Boolean);

      await window.cmdSupabase.addProject({
        title,
        category,
        stage,
        tools,
        specs,
        description: desc,
        pdf_url: pdfUrl,
        image_url: imgUrl,
        featured: true,
        votes: 0
      });

      showToast('Project successfully registered in vault', 'success');
      form.reset();
      renderProjectsList();
    } catch (err) {
      showToast(err.message || 'Error saving project', 'error');
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
    const answerCogInput = document.getElementById('c-answer-cog').value;
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
        answer_mass_tolerance: massTolInput !== '' ? parseFloat(massTolInput) : 5,
        answer_cog: answerCogInput !== '' ? parseFloat(answerCogInput) : null,
        answer_cog_tolerance: cogTolInput !== '' ? parseFloat(cogTolInput) : 10
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
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:var(--text-dark-secondary);padding:24px;">No member submissions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  subs.forEach(s => {
    const tr = document.createElement('tr');
    const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent';
    const isCleanUrl = s.pdf_url && typeof s.pdf_url === 'string' && s.pdf_url !== '#' && !s.pdf_url.startsWith('file:') && !s.pdf_url.startsWith('C:') && !s.pdf_url.startsWith('D:');
    const massOk = s.mass_correct ? 'YES' : 'NO';
    const cogOk = s.cog_correct ? 'YES' : 'NO';
    const massStyle = s.mass_correct ? 'color:var(--neon-green);font-weight:700;' : 'color:#E05C5C;';
    const cogStyle = s.cog_correct ? 'color:var(--neon-green);font-weight:700;' : 'color:#E05C5C;';

    tr.innerHTML = `
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;">${dateStr}</td>
      <td style="font-weight:700;">${s.member_name}</td>
      <td style="font-size:0.8rem;color:var(--text-dark-secondary);">${s.member_email}</td>
      <td>${s.model_title}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_mass != null ? s.submitted_mass + ' kg' : 'N/A'}</td>
      <td style="${massStyle}font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_mass != null ? massOk : 'N/A'}</td>
      <td style="font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_cog != null ? s.submitted_cog + ' mm' : 'N/A'}</td>
      <td style="${cogStyle}font-family:var(--font-mono);font-size:0.85rem;">${s.submitted_cog != null ? cogOk : 'N/A'}</td>
      <td style="font-family:var(--font-mono);color:var(--neon-green);font-weight:700;">${s.points_awarded || 0}</td>
      <td>
        ${isCleanUrl ? `<a href="${s.pdf_url}" target="_blank" class="btn-sm-action">Inspect PDF &nearr;</a>` : `<span style="color:var(--text-dark-secondary);">No PDF</span>`}
      </td>
      <td style="color:var(--text-dark-secondary);font-size:0.8rem;max-width:200px;">${s.notes || 'None'}</td>
    `;
    tbody.appendChild(tr);
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
      document.getElementById('lb-name').value = m.display_name;
      document.getElementById('lb-points').value = m.points;
      document.getElementById('lb-count').value = m.submission_count || 0;
      document.getElementById('lb-badges').value = (m.badges || []).join(', ');

      const cancelBtn = document.getElementById('lb-cancel-button');
      const submitBtn = document.getElementById('lb-submit-button');
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.textContent = 'Update Member Record &nearr;';
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
      if (submitBtn) submitBtn.textContent = 'Save Member Standings &nearr;';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('lb-id').value;
    const name = document.getElementById('lb-name').value;
    const points = parseInt(document.getElementById('lb-points').value, 10);
    const count = parseInt(document.getElementById('lb-count').value, 10);
    const badgesStr = document.getElementById('lb-badges').value;

    const badges = badgesStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    try {
      if (id) {
        await window.cmdSupabase.updateLeaderboardEntry(id, {
          display_name: name,
          points,
          submission_count: count,
          badges
        });
        showToast('Member standings updated', 'success');
      } else {
        await window.cmdSupabase.addLeaderboardEntry({
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
      if (submitBtn) submitBtn.textContent = 'Save Member Standings &nearr;';
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
});
