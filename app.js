/* ─────────────────────────────────────────────
   TOOL HUB — app.js
   Version 1.0 | localStorage + JSON backup
───────────────────────────────────────────── */

const STORAGE_KEY = 'toolhub_v1';
const THEME_KEY   = 'toolhub_theme';

// ─── STATE ───────────────────────────────────
let state = {
  tools: [],
  categories: [],
  filter: {
    view: 'all',       // 'all' | 'favorites' | 'recent' | category name
    search: '',
    status: '',
    tag: '',
    sort: 'name',
  },
  viewMode: 'grid',    // 'grid' | 'list'
  editingId: null,
};

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadData();
  bindEvents();
  render();
});

// ─── DATA LAYER ──────────────────────────────
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      state.tools = saved.tools || [];
      state.categories = saved.categories || defaultCategories();
      return;
    } catch (e) { console.warn('Corrupted storage, loading defaults.'); }
  }
  loadSampleData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tools: state.tools,
    categories: state.categories,
  }));
}

function loadSampleData() {
  fetch('data/sample-tools.json')
    .then(r => r.json())
    .then(data => {
      state.tools = data.tools || [];
      state.categories = data.categories || defaultCategories();
      saveData();
      render();
      toast('Sample data loaded', 'success');
    })
    .catch(() => {
      // If fetch fails (file:// protocol), use embedded defaults
      state.tools = EMBEDDED_SAMPLE.tools;
      state.categories = EMBEDDED_SAMPLE.categories;
      saveData();
      render();
    });
}

function defaultCategories() {
  return ['Real Estate Analysis', 'Market Research', 'Maps & Location', 'Utilities', 'Travel'];
}

// ─── THEME ───────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

// ─── BIND EVENTS ─────────────────────────────
function bindEvents() {
  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Mobile menu
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // Theme
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Search
  document.getElementById('searchInput').addEventListener('input', e => {
    state.filter.search = e.target.value.trim().toLowerCase();
    render();
  });

  // Status filter
  document.getElementById('statusFilter').addEventListener('change', e => {
    state.filter.status = e.target.value;
    render();
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', e => {
    state.filter.sort = e.target.value;
    render();
  });

  // View mode
  document.getElementById('gridViewBtn').addEventListener('click', () => setViewMode('grid'));
  document.getElementById('listViewBtn').addEventListener('click', () => setViewMode('list'));

  // Add tool buttons
  ['addToolBtn', 'addToolBtnTop', 'emptyAddLink'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); openEditModal(null); });
  });

  // Manage categories
  document.getElementById('manageCategoriesBtn').addEventListener('click', e => {
    e.preventDefault();
    openCatModal();
  });

  // Edit modal
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('toolForm').addEventListener('submit', saveTool);
  document.getElementById('deleteToolBtn').addEventListener('click', confirmDeleteTool);
  document.getElementById('duplicateToolBtn').addEventListener('click', duplicateTool);
  document.getElementById('newCategoryInlineBtn').addEventListener('click', addCategoryInline);

  // Tool detail modal
  document.getElementById('closeToolModal').addEventListener('click', closeToolModal);
  document.getElementById('modalEditBtn').addEventListener('click', () => {
    closeToolModal();
    openEditModal(state._viewingId);
  });
  document.getElementById('modalFavBtn').addEventListener('click', () => {
    const tool = getTool(state._viewingId);
    if (tool) { tool.favorite = !tool.favorite; saveData(); render(); openToolModal(tool.id); }
  });

  // Categories modal
  document.getElementById('closeCatModal').addEventListener('click', closeCatModal);
  document.getElementById('closeCatModalBtn').addEventListener('click', closeCatModal);
  document.getElementById('addCatBtn').addEventListener('click', addCategory);
  document.getElementById('newCatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
  });

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click', exportBackup);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importBackup);

  // Data bar
  document.getElementById('resetSampleBtn').addEventListener('click', () => {
    confirmAction('Reset to sample data? Your current tools will be replaced.', () => {
      localStorage.removeItem(STORAGE_KEY);
      loadSampleData();
    });
  });
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    confirmAction('Delete ALL tools and data? This cannot be undone.', () => {
      state.tools = [];
      state.categories = defaultCategories();
      saveData();
      render();
      toast('All data cleared');
    });
  });

  // Nav items
  document.addEventListener('click', e => {
    // Sidebar nav
    const navItem = e.target.closest('.nav-item[data-view]');
    if (navItem) {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      navItem.classList.add('active');
      state.filter.view = navItem.dataset.view;
      state.filter.tag = '';
      render();
    }

    // Category nav
    const catItem = e.target.closest('.nav-item[data-category]');
    if (catItem) {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      catItem.classList.add('active');
      state.filter.view = 'category';
      state.filter.category = catItem.dataset.category;
      state.filter.tag = '';
      render();
    }

    // Close modal on backdrop click
    if (e.target.classList.contains('modal-backdrop')) {
      closeEditModal(); closeToolModal(); closeCatModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEditModal(); closeToolModal(); closeCatModal(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
}

// ─── RENDER ──────────────────────────────────
function render() {
  renderStats();
  renderCategoryNav();
  renderTools();
  renderActiveFilters();
}

function renderStats() {
  const counts = { total: 0, active: 0, testing: 0, broken: 0, archived: 0, favorites: 0 };
  state.tools.forEach(t => {
    counts.total++;
    counts[t.status]++;
    if (t.favorite) counts.favorites++;
  });

  const statDefs = [
    { key: 'total',    label: 'Total',    color: '#8B949E' },
    { key: 'active',   label: 'Active',   color: 'var(--status-active)' },
    { key: 'testing',  label: 'Testing',  color: 'var(--status-testing)' },
    { key: 'broken',   label: 'Broken',   color: 'var(--status-broken)' },
    { key: 'favorites',label: 'Favorites',color: 'var(--amber)' },
  ];

  document.getElementById('statsBar').innerHTML = statDefs.map(s => `
    <div class="stat-card" data-stat="${s.key}" title="Filter by ${s.label}">
      <div class="stat-dot" style="background:${s.color}"></div>
      <div>
        <div class="stat-val">${counts[s.key]}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>
  `).join('');

  // Stat card click filtering
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.stat;
      if (key === 'total') {
        state.filter.status = '';
        state.filter.view = 'all';
      } else if (key === 'favorites') {
        state.filter.view = 'favorites';
      } else {
        state.filter.status = key;
        document.getElementById('statusFilter').value = key;
      }
      render();
    });
  });
}

function renderCategoryNav() {
  const nav = document.getElementById('categoryNav');
  const counts = {};
  state.tools.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });

  nav.innerHTML = state.categories.map(cat => `
    <a href="#" class="nav-item${state.filter.view === 'category' && state.filter.category === cat ? ' active' : ''}" data-category="${escHtml(cat)}">
      <span class="nav-icon">◉</span>
      <span style="flex:1">${escHtml(cat)}</span>
      <span style="font-size:.65rem;color:var(--text-muted)">${counts[cat] || 0}</span>
    </a>
  `).join('');
}

function getFilteredTools() {
  let tools = [...state.tools];

  // View filter
  if (state.filter.view === 'favorites') tools = tools.filter(t => t.favorite);
  else if (state.filter.view === 'recent') tools = tools.sort((a,b) => b.dateAdded > a.dateAdded ? 1 : -1).slice(0, 10);
  else if (state.filter.view === 'category') tools = tools.filter(t => t.category === state.filter.category);

  // Status filter
  if (state.filter.status) tools = tools.filter(t => t.status === state.filter.status);

  // Tag filter
  if (state.filter.tag) tools = tools.filter(t => t.tags && t.tags.includes(state.filter.tag));

  // Search
  if (state.filter.search) {
    const q = state.filter.search;
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.shortDesc || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort
  tools.sort((a, b) => {
    switch (state.filter.sort) {
      case 'name':     return a.name.localeCompare(b.name);
      case 'category': return a.category.localeCompare(b.category);
      case 'updated':  return b.dateUpdated > a.dateUpdated ? 1 : -1;
      case 'added':    return b.dateAdded > a.dateAdded ? 1 : -1;
      default:         return 0;
    }
  });

  return tools;
}

function renderTools() {
  const grid = document.getElementById('toolsGrid');
  const empty = document.getElementById('emptyState');
  const tools = getFilteredTools();

  // Title
  const titleMap = {
    all: 'All Tools',
    favorites: 'Favorites',
    recent: 'Recently Added',
    category: state.filter.category,
  };
  document.getElementById('contentTitle').textContent =
    (titleMap[state.filter.view] || 'Tools') +
    (tools.length ? ` (${tools.length})` : '');

  if (!tools.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = tools.map(t => renderCard(t)).join('');

  // Bind card events
  grid.querySelectorAll('.tool-card').forEach(card => {
    const id = card.dataset.id;
    card.addEventListener('click', e => {
      if (e.target.closest('.card-fav-btn') || e.target.closest('.card-action-btn')) return;
      openToolModal(id);
    });
  });

  grid.querySelectorAll('.card-fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });

  grid.querySelectorAll('.card-action-btn[data-action="open"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      window.open(btn.dataset.url, '_blank', 'noopener');
    });
  });

  grid.querySelectorAll('.card-action-btn[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });

  grid.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      e.stopPropagation();
      state.filter.tag = chip.dataset.tag;
      render();
    });
  });
}

function renderCard(t) {
  const tags = (t.tags || []).slice(0, 3).map(tag =>
    `<span class="tag-chip" data-tag="${escHtml(tag)}">${escHtml(tag)}</span>`
  ).join('');

  const videoIcon = t.videoUrl
    ? `<span title="Has tutorial video" style="color:var(--amber);font-size:.8rem">▶</span>`
    : '';

  return `
    <div class="tool-card${t.status === 'archived' ? ' archived' : ''}" data-id="${t.id}">
      <div class="card-status-bar bar-${t.status}"></div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-badges">
            <span class="status-badge status-${t.status}">${t.status}</span>
            <span class="category-badge">${escHtml(t.category)}</span>
            ${videoIcon}
          </div>
          <button class="card-fav-btn${t.favorite ? ' active' : ''}" data-id="${t.id}" title="Toggle favorite">
            ${t.favorite ? '★' : '☆'}
          </button>
        </div>
        <div class="card-name">${escHtml(t.name)}</div>
        <div class="card-desc">${escHtml(t.shortDesc || '')}</div>
        <div class="card-tags">${tags}</div>
        <div class="card-footer">
          <span class="card-date">Updated ${formatDate(t.dateUpdated)}</span>
          <div class="card-actions">
            <button class="card-action-btn" data-action="edit" data-id="${t.id}">Edit</button>
            <button class="card-action-btn primary" data-action="open" data-url="${escHtml(t.url)}">Open ↗</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderActiveFilters() {
  const chips = [];
  if (state.filter.tag) chips.push({ label: `Tag: ${state.filter.tag}`, clear: () => { state.filter.tag = ''; render(); } });
  if (state.filter.status) chips.push({ label: `Status: ${state.filter.status}`, clear: () => { state.filter.status = ''; document.getElementById('statusFilter').value = ''; render(); } });
  if (state.filter.search) chips.push({ label: `Search: "${state.filter.search}"`, clear: () => { state.filter.search = ''; document.getElementById('searchInput').value = ''; render(); } });

  const el = document.getElementById('activeFilters');
  el.innerHTML = chips.map((c,i) => `
    <span class="filter-chip">
      ${escHtml(c.label)}
      <button data-chip="${i}">✕</button>
    </span>
  `).join('');

  el.querySelectorAll('button[data-chip]').forEach(btn => {
    btn.addEventListener('click', () => chips[parseInt(btn.dataset.chip)].clear());
  });
}

// ─── TOOL DETAIL MODAL ───────────────────────
function openToolModal(id) {
  state._viewingId = id;
  const t = getTool(id);
  if (!t) return;

  document.getElementById('modalTitle').textContent = t.name;
  document.getElementById('modalStatus').textContent = t.status;
  document.getElementById('modalStatus').className = `modal-status-badge status-badge status-${t.status}`;
  document.getElementById('modalCategory').textContent = t.category;
  document.getElementById('modalDesc').textContent = t.shortDesc || '—';
  document.getElementById('modalFavBtn').textContent = t.favorite ? '★' : '☆';
  document.getElementById('modalFavBtn').style.color = t.favorite ? 'var(--amber)' : '';
  document.getElementById('modalUpdated').textContent = formatDate(t.dateUpdated);
  document.getElementById('modalAdded').textContent = formatDate(t.dateAdded);

  // Instructions
  const instrSection = document.getElementById('modalInstructionsSection');
  if (t.instructions) {
    document.getElementById('modalInstructions').textContent = t.instructions;
    instrSection.style.display = '';
  } else {
    instrSection.style.display = 'none';
  }

  // Tags
  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = (t.tags || []).map(tag =>
    `<span class="tag-chip" data-tag="${escHtml(tag)}">${escHtml(tag)}</span>`
  ).join('') || '<span style="color:var(--text-muted)">No tags</span>';

  // Resources
  const resSection = document.getElementById('modalResourcesSection');
  const resEl = document.getElementById('modalResources');
  if (t.resources && t.resources.length) {
    resEl.innerHTML = t.resources.map(r =>
      `<a class="resource-link" href="${escHtml(r.url)}" target="_blank" rel="noopener">↗ ${escHtml(r.label)}</a>`
    ).join('');
    resSection.style.display = '';
  } else {
    resSection.style.display = 'none';
  }

  // Open button
  document.getElementById('modalOpenBtn').href = t.url;

  // Video
  renderVideoPanel(t.videoUrl);

  document.getElementById('toolModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeToolModal() {
  document.getElementById('toolModal').style.display = 'none';
  document.body.style.overflow = '';
}

function renderVideoPanel(url) {
  const panel = document.getElementById('videoPanel');
  const embed = document.getElementById('videoEmbed');
  const openBtn = document.getElementById('videoOpenBtn');

  if (!url) { panel.style.display = 'none'; return; }
  panel.style.display = 'flex';
  openBtn.href = url;

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);

  if (ytMatch) {
    embed.innerHTML = `<iframe class="video-embed-frame" src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe>`;
  } else if (vimeoMatch) {
    embed.innerHTML = `<iframe class="video-embed-frame" src="https://player.vimeo.com/video/${vimeoMatch[1]}" allowfullscreen></iframe>`;
  } else if (loomMatch) {
    embed.innerHTML = `<iframe class="video-embed-frame" src="https://www.loom.com/embed/${loomMatch[1]}" allowfullscreen></iframe>`;
  } else {
    embed.innerHTML = `
      <div class="video-thumb-btn" onclick="window.open('${escHtml(url)}','_blank','noopener')">
        <div class="video-play-icon">▶</div>
      </div>
    `;
  }
}

// ─── EDIT MODAL ──────────────────────────────
function openEditModal(id) {
  state.editingId = id;
  const form = document.getElementById('toolForm');
  form.reset();

  // Populate category dropdown
  const catSelect = document.getElementById('fCategory');
  catSelect.innerHTML = state.categories.map(c =>
    `<option value="${escHtml(c)}">${escHtml(c)}</option>`
  ).join('');

  const deleteBtn = document.getElementById('deleteToolBtn');
  const dupBtn = document.getElementById('duplicateToolBtn');

  if (id) {
    // Edit existing
    document.getElementById('editModalTitle').textContent = 'Edit Tool';
    deleteBtn.style.display = '';
    dupBtn.style.display = '';
    const t = getTool(id);
    if (!t) return;
    document.getElementById('editToolId').value = t.id;
    document.getElementById('fName').value = t.name || '';
    document.getElementById('fCategory').value = t.category || '';
    document.getElementById('fShortDesc').value = t.shortDesc || '';
    document.getElementById('fInstructions').value = t.instructions || '';
    document.getElementById('fUrl').value = t.url || '';
    document.getElementById('fStatus').value = t.status || 'active';
    document.getElementById('fVideoUrl').value = t.videoUrl || '';
    document.getElementById('fTags').value = (t.tags || []).join(', ');
    document.getElementById('fFavorite').checked = !!t.favorite;
    document.getElementById('fResources').value = (t.resources || []).map(r => `${r.label} | ${r.url}`).join('\n');
  } else {
    // New tool
    document.getElementById('editModalTitle').textContent = 'Add New Tool';
    deleteBtn.style.display = 'none';
    dupBtn.style.display = 'none';
    document.getElementById('editToolId').value = '';
  }

  document.getElementById('editModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('fName').focus(), 100);
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.body.style.overflow = '';
  state.editingId = null;
}

function saveTool(e) {
  e.preventDefault();
  const id = document.getElementById('editToolId').value || generateId();
  const isNew = !document.getElementById('editToolId').value;

  const tags = document.getElementById('fTags').value
    .split(',').map(t => t.trim()).filter(Boolean);

  const resources = document.getElementById('fResources').value
    .split('\n').map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return { label: parts[0].trim(), url: parts.slice(1).join('|').trim() };
      }
      return null;
    }).filter(Boolean);

  const now = todayStr();

  if (isNew) {
    const tool = {
      id,
      name: document.getElementById('fName').value.trim(),
      category: document.getElementById('fCategory').value,
      shortDesc: document.getElementById('fShortDesc').value.trim(),
      instructions: document.getElementById('fInstructions').value.trim(),
      url: document.getElementById('fUrl').value.trim(),
      status: document.getElementById('fStatus').value,
      videoUrl: document.getElementById('fVideoUrl').value.trim(),
      tags,
      favorite: document.getElementById('fFavorite').checked,
      resources,
      dateAdded: now,
      dateUpdated: now,
    };
    state.tools.unshift(tool);
    toast('Tool added ✓', 'success');
  } else {
    const tool = getTool(id);
    if (!tool) return;
    tool.name = document.getElementById('fName').value.trim();
    tool.category = document.getElementById('fCategory').value;
    tool.shortDesc = document.getElementById('fShortDesc').value.trim();
    tool.instructions = document.getElementById('fInstructions').value.trim();
    tool.url = document.getElementById('fUrl').value.trim();
    tool.status = document.getElementById('fStatus').value;
    tool.videoUrl = document.getElementById('fVideoUrl').value.trim();
    tool.tags = tags;
    tool.favorite = document.getElementById('fFavorite').checked;
    tool.resources = resources;
    tool.dateUpdated = now;
    toast('Tool saved ✓', 'success');
  }

  saveData();
  closeEditModal();
  render();
}

function confirmDeleteTool() {
  const id = state.editingId;
  confirmAction('Delete this tool? This cannot be undone.', () => {
    state.tools = state.tools.filter(t => t.id !== id);
    saveData();
    closeEditModal();
    render();
    toast('Tool deleted');
  });
}

function duplicateTool() {
  const id = state.editingId;
  const tool = getTool(id);
  if (!tool) return;
  const copy = { ...tool, id: generateId(), name: tool.name + ' (Copy)', dateAdded: todayStr(), dateUpdated: todayStr() };
  state.tools.unshift(copy);
  saveData();
  closeEditModal();
  render();
  toast('Tool duplicated ✓', 'success');
}

function toggleFavorite(id) {
  const tool = getTool(id);
  if (!tool) return;
  tool.favorite = !tool.favorite;
  saveData();
  render();
}

// ─── CATEGORIES MODAL ────────────────────────
function openCatModal() {
  renderCatList();
  document.getElementById('catModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCatModal() {
  document.getElementById('catModal').style.display = 'none';
  document.body.style.overflow = '';
}

function renderCatList() {
  const list = document.getElementById('catList');
  list.innerHTML = state.categories.map((cat, i) => `
    <div class="tag-manager-item">
      <span>${escHtml(cat)}</span>
      <button data-catidx="${i}" title="Delete category">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('button[data-catidx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.catidx);
      const cat = state.categories[idx];
      const inUse = state.tools.some(t => t.category === cat);
      if (inUse) {
        toast(`Can't delete "${cat}" — it's used by ${state.tools.filter(t=>t.category===cat).length} tool(s)`, 'error');
        return;
      }
      state.categories.splice(idx, 1);
      saveData();
      renderCatList();
      renderCategoryNav();
    });
  });
}

function addCategory() {
  const input = document.getElementById('newCatInput');
  const val = input.value.trim();
  if (!val) return;
  if (state.categories.includes(val)) { toast('Category already exists', 'error'); return; }
  state.categories.push(val);
  saveData();
  renderCatList();
  renderCategoryNav();
  input.value = '';
  toast('Category added ✓', 'success');
}

function addCategoryInline() {
  const name = prompt('New category name:');
  if (!name || !name.trim()) return;
  const val = name.trim();
  if (!state.categories.includes(val)) {
    state.categories.push(val);
    saveData();
  }
  const sel = document.getElementById('fCategory');
  const opt = document.createElement('option');
  opt.value = val; opt.textContent = val;
  sel.appendChild(opt);
  sel.value = val;
}

// ─── CONFIRM MODAL ───────────────────────────
function confirmAction(message, onOk) {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const ok = document.getElementById('confirmOk');
  const cancel = document.getElementById('confirmCancel');

  const cleanup = () => {
    document.getElementById('confirmModal').style.display = 'none';
    document.body.style.overflow = '';
    ok.replaceWith(ok.cloneNode(true));
    cancel.replaceWith(cancel.cloneNode(true));
  };

  document.getElementById('confirmOk').addEventListener('click', () => { cleanup(); onOk(); });
  document.getElementById('confirmCancel').addEventListener('click', cleanup);
}

// ─── EXPORT / IMPORT ─────────────────────────
function exportBackup() {
  const payload = {
    tools: state.tools,
    categories: state.categories,
    meta: { version: '1.0', exportDate: new Date().toISOString() }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `toolhub-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup downloaded ✓', 'success');
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result);
      if (!data.tools) throw new Error('Invalid format');
      confirmAction(`Import ${data.tools.length} tools? This will replace your current data.`, () => {
        state.tools = data.tools;
        state.categories = data.categories || defaultCategories();
        saveData();
        render();
        toast(`Imported ${data.tools.length} tools ✓`, 'success');
      });
    } catch {
      toast('Import failed — invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ─── VIEW MODE ───────────────────────────────
function setViewMode(mode) {
  state.viewMode = mode;
  const grid = document.getElementById('toolsGrid');
  grid.className = mode === 'list' ? 'tools-grid list-view' : 'tools-grid';
  document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
}

// ─── HELPERS ─────────────────────────────────
function getTool(id) { return state.tools.find(t => t.id === id); }
function generateId() { return 'tool-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function formatDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return str; }
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ` ${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

// ─── EMBEDDED SAMPLE (fallback for file:// protocol) ─────
const EMBEDDED_SAMPLE = {
  tools: [
    { id:'tool-001', name:'Zillow / AirDNA Lead Viewer', shortDesc:'Cross-reference Zillow listings with AirDNA short-term rental income estimates', instructions:'1. Export leads from Zillow in CSV format\n2. Run the AirDNA scraper for target ZIP codes\n3. Paste both CSVs into the tool\n4. Use the income-to-price filter to surface high-ROI candidates', url:'/tools/zillow-airdna-lead-viewer/index.html', videoUrl:'', category:'Real Estate Analysis', tags:['zillow','airdna','short-term rental','lead gen'], status:'active', favorite:true, resources:[{label:'AirDNA',url:'https://www.airdna.co'}], dateAdded:'2024-11-15', dateUpdated:'2025-02-10' },
    { id:'tool-002', name:'Redfin Property Tracker', shortDesc:'Track price changes, days on market, and deal potential for target properties', instructions:'Paste Redfin search URL for your target ZIP codes. Flags listings over 30 DOM as potential motivated sellers.', url:'/tools/redfin-property-tracker/index.html', videoUrl:'', category:'Real Estate Analysis', tags:['redfin','comps','ARV','fix-and-flip'], status:'active', favorite:true, resources:[], dateAdded:'2024-10-02', dateUpdated:'2025-01-28' },
    { id:'tool-003', name:'Restaurant Map', shortDesc:'Map and filter restaurants near target properties or neighborhoods', instructions:'Enter a zip code. The tool pulls nearby restaurants and scores walkability for tenant appeal.', url:'/tools/restaurant-map/index.html', videoUrl:'', category:'Maps & Location', tags:['maps','restaurants','walkability'], status:'active', favorite:false, resources:[], dateAdded:'2025-01-10', dateUpdated:'2025-01-10' },
    { id:'tool-004', name:'TickPick Ticket Analyzer', shortDesc:'Find underpriced event tickets for resale on secondary markets', instructions:'Paste TickPick event URL. Score above 70 = likely profitable flip.\nBest for: concerts, sports, comedy shows.', url:'/tools/tickpick-ticket-analyzer/index.html', videoUrl:'', category:'Ticket Flipping', tags:['tickpick','resale','tickets','arbitrage'], status:'testing', favorite:false, resources:[], dateAdded:'2025-03-01', dateUpdated:'2025-03-15' },
    { id:'tool-005', name:'Google Maps Storage Finder', shortDesc:'Find self-storage facilities near target areas for cost comparison', instructions:'Searches for storage facilities within a radius. Returns price per sq ft and competitor density.', url:'/tools/google-maps-storage-finder/index.html', videoUrl:'', category:'Maps & Location', tags:['google maps','storage','market research'], status:'active', favorite:false, resources:[], dateAdded:'2025-02-20', dateUpdated:'2025-02-20' },
    { id:'tool-006', name:'Southwest Low Fare Calendar Helper', shortDesc:'Compare Southwest fares across date ranges for trip planning', instructions:'Enter origin, destination, and date window. Highlights lowest fares by day.', url:'/tools/southwest-fare-calendar/index.html', videoUrl:'', category:'Travel', tags:['southwest','flights','travel hacking'], status:'archived', favorite:false, resources:[], dateAdded:'2024-09-05', dateUpdated:'2024-12-01' },
    { id:'tool-007', name:'Real Estate Lead Viewer', shortDesc:'Central view of all active leads across multiple acquisition sources', instructions:'Aggregates leads from driving for dollars, direct mail, probate, and cold call lists. Import CSV and score by motivation.', url:'/tools/real-estate-lead-viewer/index.html', videoUrl:'', category:'Real Estate Analysis', tags:['leads','CRM','acquisitions','pipeline'], status:'testing', favorite:true, resources:[], dateAdded:'2025-04-01', dateUpdated:'2025-05-12' },
    { id:'tool-008', name:'Hospital / Top ZIP Code Checker', shortDesc:'Identify high-demand rental ZIP codes near hospitals and employers', instructions:'Enter a city or metro. Returns top ZIP codes by healthcare employment, vacancy rates, and rent-to-price ratios.', url:'/tools/zip-code-checker/index.html', videoUrl:'', category:'Market Research', tags:['zip codes','hospitals','rental market','demographics'], status:'broken', favorite:false, resources:[], dateAdded:'2025-01-22', dateUpdated:'2025-02-05' },
  ],
  categories: ['Real Estate Analysis', 'Market Research', 'Maps & Location', 'Ticket Flipping', 'Travel', 'Utilities']
};
