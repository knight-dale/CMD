/*
  projects-section.js
  Renders projects uploaded in the admin console into the homepage "Selected work" grid.
  Shows the newest 3 first; a button reveals the rest.

  Load order in index.html: projects.js, supabase-client.js, app.js, projects-section.js
*/
(function () {
  'use strict';

  const INITIAL_COUNT = 3;
  const STAGE_LABELS = {
    Concept: 'CAD concept',
    Prototype: 'Prototype',
    Fabricated: 'Fabricated'
  };

  const grid = document.getElementById('featured-projects-grid');
  const toggleRow = document.getElementById('projects-toggle-row');
  const toggleBtn = document.getElementById('projects-toggle-btn');
  const headerLink = document.getElementById('view-all-projects-link');
  let total = 0;

  if (!grid) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // Allow http(s), inline images and relative paths. Reject file:, C:\ and javascript: values.
  function safeUrl(value) {
    if (typeof value !== 'string') return '';
    const u = value.trim();
    if (!u || u === '#') return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) {
      return /^(https?:|data:image\/)/i.test(u) ? u : '';
    }
    return u;
  }

  function toList(value) {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return [];
  }

  function cardHtml(project, index) {
    const title = esc(project.title);
    const img = safeUrl(project.image_url);
    const pdf = safeUrl(project.pdf_url);
    const category = project.category || '';
    const stage = STAGE_LABELS[project.stage] || project.stage || '';
    const meta = [category, stage].filter(Boolean).map(esc).join(' / ');
    const specs = toList(project.specs).slice(0, 2);
    const tools = toList(project.tools).slice(0, 4);
    const extraClass = index >= INITIAL_COUNT ? ' is-extra' : '';

    return `
      <article class="project-editorial-card${extraClass}">
        <div class="project-card-image-wrap${img ? '' : ' is-empty'}" data-label="${esc(category || 'Project')}">
          ${img ? `<img src="${esc(img)}" alt="${title} render" class="project-card-image" loading="${index < INITIAL_COUNT ? 'eager' : 'lazy'}">` : ''}
        </div>
        <div class="project-card-meta">${meta}</div>
        <div class="project-card-title-row">
          <h3 class="project-card-title">${title}</h3>
          ${pdf ? `<a class="project-card-link" href="${esc(pdf)}" target="_blank" rel="noopener" aria-label="Open drawing sheet for ${title}">&nearr;</a>` : ''}
        </div>
        <p class="project-card-desc">${esc(project.description)}</p>
        ${specs.length ? `<ul class="project-card-specs">${specs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${tools.length ? `<div class="project-card-tools">${tools.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      </article>
    `;
  }

  function setExpanded(expanded, scrollToTop) {
    grid.classList.toggle('show-all', expanded);
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-expanded', String(expanded));
    toggleBtn.textContent = expanded ? 'Show fewer projects' : `View all ${total} projects`;
    if (!expanded && scrollToTop) {
      const section = document.getElementById('projects');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function render(projects) {
    total = projects.length;
    grid.innerHTML = projects.map(cardHtml).join('');

    // A broken image URL falls back to the labelled placeholder instead of a broken icon.
    grid.querySelectorAll('.project-card-image').forEach(img => {
      img.addEventListener('error', () => {
        const wrap = img.closest('.project-card-image-wrap');
        if (wrap) wrap.classList.add('is-empty');
        img.remove();
      });
    });

    const hasMore = total > INITIAL_COUNT;

    if (!toggleRow || !toggleBtn) {
      grid.classList.add('show-all');
      return;
    }

    toggleRow.hidden = !hasMore;
    if (hasMore) {
      setExpanded(false);
      toggleBtn.addEventListener('click', () => {
        setExpanded(!grid.classList.contains('show-all'), true);
      });
      if (headerLink) {
        headerLink.addEventListener('click', () => setExpanded(true));
      }
    } else if (headerLink) {
      headerLink.style.display = 'none';
    }
  }

  async function load() {
    let projects = [];
    try {
      if (window.cmdSupabase && window.cmdSupabase.fetchProjects) {
        projects = await window.cmdSupabase.fetchProjects({});
      }
    } catch (err) {
      console.error('Could not load projects:', err);
    }

    projects = (projects || []).filter(p => p && p.title);

    // Nothing uploaded yet (or the database is unreachable): keep the three static cards in index.html.
    if (projects.length === 0) {
      if (headerLink) headerLink.style.display = 'none';
      return;
    }

    render(projects); // fetchProjects already returns newest first
  }

  load();
})();
