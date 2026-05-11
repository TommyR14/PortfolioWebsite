let portfolioData = {};
let editingProjectImages = [];

// ===== INIT =====
async function init() {
  const res = await fetch('/api/auth-status');
  const { authenticated } = await res.json();
  if (!authenticated) { window.location.href = '/login.html'; return; }
  await loadData();
  setupNav();
  setupProfilePanel();
  setupSkillsPanel();
  setupCertsPanel();
  setupExpPanel();
  setupProjectsPanel();
  setupSettingsPanel();
  setupLogout();
}

async function loadData() {
  const res = await fetch('/api/portfolio');
  portfolioData = await res.json();
  portfolioData.skills = portfolioData.skills || [];
  portfolioData.certifications = portfolioData.certifications || [];
  portfolioData.experience = portfolioData.experience || [];
  portfolioData.projects = portfolioData.projects || [];
  portfolioData.profile = portfolioData.profile || {};
}

async function saveSection(section, data) {
  const res = await fetch(`/api/portfolio/${section}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Save failed');
  portfolioData[section] = data;
}

// ===== NOTIFICATIONS =====
function notify(msg, type = 'success') {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.className = `notification ${type} show`;
  setTimeout(() => { el.classList.remove('show'); }, 3000);
}

// ===== NAV =====
function setupNav() {
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`panel-${item.dataset.panel}`).classList.add('active');
    });
  });
}

// ===== LOGOUT =====
function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

// ===== PROFILE =====
function setupProfilePanel() {
  const p = portfolioData.profile;
  document.getElementById('profile-name').value = p.name || '';
  document.getElementById('profile-title').value = p.title || '';
  document.getElementById('profile-bio').value = p.bio || '';
  document.getElementById('profile-email').value = p.email || '';
  document.getElementById('profile-location').value = p.location || '';
  document.getElementById('profile-linkedin').value = p.linkedin || '';
  document.getElementById('profile-github').value = p.github || '';
  document.getElementById('profile-avatar').value = p.avatar || '';

  if (p.avatar) showAvatarPreview(p.avatar);

  setupUploadZone('avatar-zone', 'avatar-file', async (file) => {
    const url = await uploadFile(file);
    document.getElementById('profile-avatar').value = url;
    showAvatarPreview(url);
  });

  document.getElementById('save-profile').addEventListener('click', async () => {
    try {
      const profile = {
        name: document.getElementById('profile-name').value.trim(),
        title: document.getElementById('profile-title').value.trim(),
        bio: document.getElementById('profile-bio').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        location: document.getElementById('profile-location').value.trim(),
        linkedin: document.getElementById('profile-linkedin').value.trim(),
        github: document.getElementById('profile-github').value.trim(),
        avatar: document.getElementById('profile-avatar').value.trim(),
      };
      await saveSection('profile', profile);
      notify('Profile saved!');
    } catch { notify('Failed to save profile.', 'error'); }
  });
}

function showAvatarPreview(url) {
  const wrap = document.getElementById('avatar-preview-wrap');
  wrap.innerHTML = `<img src="${url}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);" /><p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-dim)">Click to change</p>`;
}

// ===== SKILLS =====
function setupSkillsPanel() {
  renderSkillsList();
  document.getElementById('add-skill-btn').addEventListener('click', () => openSkillModal());

  const modal = document.getElementById('skill-modal');
  document.getElementById('skill-modal-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

  setupTagInput('skill-tags-wrap', 'skill-tag-input', () => {});

  document.getElementById('skill-modal-save').addEventListener('click', async () => {
    const cat = document.getElementById('skill-cat').value.trim();
    if (!cat) return notify('Category name is required.', 'error');
    const items = getTagsFromWrapper('skill-tags-wrap');
    const id = parseInt(document.getElementById('skill-edit-id').value) || Date.now();

    const idx = portfolioData.skills.findIndex(s => s.id === id);
    if (idx >= 0) {
      portfolioData.skills[idx] = { id, category: cat, items };
    } else {
      portfolioData.skills.push({ id, category: cat, items });
    }

    try {
      await saveSection('skills', portfolioData.skills);
      renderSkillsList();
      closeModal(modal);
      notify('Skills saved!');
    } catch { notify('Failed to save.', 'error'); }
  });
}

function renderSkillsList() {
  const list = document.getElementById('skills-list');
  if (!portfolioData.skills.length) {
    list.innerHTML = emptyState('⚡', 'No skill categories yet. Add one to get started.');
    return;
  }
  list.innerHTML = portfolioData.skills.map(s => `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <p class="admin-card-title">${esc(s.category)}</p>
          <p class="admin-card-sub">${(s.items || []).join(', ')}</p>
        </div>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openSkillModal(${s.id})" title="Edit">✏️</button>
          <button class="btn-icon danger" onclick="deleteSkill(${s.id})" title="Delete">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openSkillModal(id) {
  const modal = document.getElementById('skill-modal');
  document.getElementById('skill-edit-id').value = id || '';
  document.getElementById('skill-modal-title').textContent = id ? 'Edit Skill Category' : 'Add Skill Category';
  clearTagWrapper('skill-tags-wrap', 'skill-tag-input');

  if (id) {
    const skill = portfolioData.skills.find(s => s.id === id);
    if (skill) {
      document.getElementById('skill-cat').value = skill.category;
      (skill.items || []).forEach(item => addTag('skill-tags-wrap', 'skill-tag-input', item));
    }
  } else {
    document.getElementById('skill-cat').value = '';
  }
  openModal(modal);
}

async function deleteSkill(id) {
  if (!confirm('Delete this skill category?')) return;
  portfolioData.skills = portfolioData.skills.filter(s => s.id !== id);
  try {
    await saveSection('skills', portfolioData.skills);
    renderSkillsList();
    notify('Deleted.');
  } catch { notify('Failed to delete.', 'error'); }
}

// ===== CERTIFICATIONS =====
function setupCertsPanel() {
  renderCertsList();
  document.getElementById('add-cert-btn').addEventListener('click', () => openCertModal());

  const modal = document.getElementById('cert-modal');
  document.getElementById('cert-modal-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

  document.getElementById('cert-modal-save').addEventListener('click', async () => {
    const name = document.getElementById('cert-name').value.trim();
    const issuer = document.getElementById('cert-issuer').value.trim();
    if (!name || !issuer) return notify('Name and issuer are required.', 'error');

    const id = parseInt(document.getElementById('cert-edit-id').value) || Date.now();
    const cert = {
      id,
      name,
      issuer,
      date: document.getElementById('cert-date').value.trim(),
      credentialId: document.getElementById('cert-credential').value.trim(),
      url: document.getElementById('cert-url').value.trim(),
    };

    const idx = portfolioData.certifications.findIndex(c => c.id === id);
    if (idx >= 0) portfolioData.certifications[idx] = cert;
    else portfolioData.certifications.push(cert);

    try {
      await saveSection('certifications', portfolioData.certifications);
      renderCertsList();
      closeModal(modal);
      notify('Certification saved!');
    } catch { notify('Failed to save.', 'error'); }
  });
}

function renderCertsList() {
  const list = document.getElementById('certs-list');
  if (!portfolioData.certifications.length) {
    list.innerHTML = emptyState('🏅', 'No certifications yet. Add one to get started.');
    return;
  }
  list.innerHTML = portfolioData.certifications.map(c => `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <p class="admin-card-title">${esc(c.name)}</p>
          <p class="admin-card-sub">${esc(c.issuer)} · ${esc(c.date)}</p>
        </div>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openCertModal(${c.id})" title="Edit">✏️</button>
          <button class="btn-icon danger" onclick="deleteCert(${c.id})" title="Delete">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openCertModal(id) {
  const modal = document.getElementById('cert-modal');
  document.getElementById('cert-edit-id').value = id || '';
  document.getElementById('cert-modal-title').textContent = id ? 'Edit Certification' : 'Add Certification';

  if (id) {
    const c = portfolioData.certifications.find(c => c.id === id);
    if (c) {
      document.getElementById('cert-name').value = c.name;
      document.getElementById('cert-issuer').value = c.issuer;
      document.getElementById('cert-date').value = c.date;
      document.getElementById('cert-credential').value = c.credentialId || '';
      document.getElementById('cert-url').value = c.url || '';
    }
  } else {
    ['cert-name','cert-issuer','cert-date','cert-credential','cert-url'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
  openModal(modal);
}

async function deleteCert(id) {
  if (!confirm('Delete this certification?')) return;
  portfolioData.certifications = portfolioData.certifications.filter(c => c.id !== id);
  try {
    await saveSection('certifications', portfolioData.certifications);
    renderCertsList();
    notify('Deleted.');
  } catch { notify('Failed to delete.', 'error'); }
}

// ===== EXPERIENCE =====
function setupExpPanel() {
  renderExpList();
  document.getElementById('add-exp-btn').addEventListener('click', () => openExpModal());

  const modal = document.getElementById('exp-modal');
  document.getElementById('exp-modal-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

  document.getElementById('exp-current').addEventListener('change', (e) => {
    document.getElementById('exp-end').disabled = e.target.checked;
    if (e.target.checked) document.getElementById('exp-end').value = '';
  });

  document.getElementById('exp-modal-save').addEventListener('click', async () => {
    const role = document.getElementById('exp-role').value.trim();
    const company = document.getElementById('exp-company').value.trim();
    if (!role || !company) return notify('Role and company are required.', 'error');

    const id = parseInt(document.getElementById('exp-edit-id').value) || Date.now();
    const current = document.getElementById('exp-current').checked;
    const highlights = document.getElementById('exp-highlights').value
      .split('\n').map(h => h.trim()).filter(Boolean);

    const job = {
      id, role, company,
      location: document.getElementById('exp-location').value.trim(),
      startDate: document.getElementById('exp-start').value.trim(),
      endDate: current ? '' : document.getElementById('exp-end').value.trim(),
      current,
      description: document.getElementById('exp-desc').value.trim(),
      highlights,
    };

    const idx = portfolioData.experience.findIndex(e => e.id === id);
    if (idx >= 0) portfolioData.experience[idx] = job;
    else portfolioData.experience.push(job);

    try {
      await saveSection('experience', portfolioData.experience);
      renderExpList();
      closeModal(modal);
      notify('Experience saved!');
    } catch { notify('Failed to save.', 'error'); }
  });
}

function renderExpList() {
  const list = document.getElementById('exp-list');
  if (!portfolioData.experience.length) {
    list.innerHTML = emptyState('💼', 'No experience yet. Add your first position.');
    return;
  }
  list.innerHTML = portfolioData.experience.map(j => `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <p class="admin-card-title">${esc(j.role)} <span style="color:var(--accent)">@ ${esc(j.company)}</span></p>
          <p class="admin-card-sub">${esc(j.location || '')} · ${j.startDate || ''} — ${j.current ? 'Present' : (j.endDate || '')}</p>
        </div>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openExpModal(${j.id})" title="Edit">✏️</button>
          <button class="btn-icon danger" onclick="deleteExp(${j.id})" title="Delete">🗑</button>
        </div>
      </div>
      ${j.description ? `<p style="font-size:0.85rem;color:var(--text-muted)">${esc(j.description)}</p>` : ''}
    </div>
  `).join('');
}

function openExpModal(id) {
  const modal = document.getElementById('exp-modal');
  document.getElementById('exp-edit-id').value = id || '';
  document.getElementById('exp-modal-title').textContent = id ? 'Edit Position' : 'Add Position';

  if (id) {
    const j = portfolioData.experience.find(e => e.id === id);
    if (j) {
      document.getElementById('exp-role').value = j.role;
      document.getElementById('exp-company').value = j.company;
      document.getElementById('exp-location').value = j.location || '';
      document.getElementById('exp-start').value = j.startDate || '';
      document.getElementById('exp-end').value = j.endDate || '';
      document.getElementById('exp-current').checked = !!j.current;
      document.getElementById('exp-end').disabled = !!j.current;
      document.getElementById('exp-desc').value = j.description || '';
      document.getElementById('exp-highlights').value = (j.highlights || []).join('\n');
    }
  } else {
    ['exp-role','exp-company','exp-location','exp-start','exp-end','exp-desc','exp-highlights'].forEach(i => {
      document.getElementById(i).value = '';
    });
    document.getElementById('exp-current').checked = false;
    document.getElementById('exp-end').disabled = false;
  }
  openModal(modal);
}

async function deleteExp(id) {
  if (!confirm('Delete this position?')) return;
  portfolioData.experience = portfolioData.experience.filter(e => e.id !== id);
  try {
    await saveSection('experience', portfolioData.experience);
    renderExpList();
    notify('Deleted.');
  } catch { notify('Failed to delete.', 'error'); }
}

// ===== PROJECTS =====
function setupProjectsPanel() {
  renderProjectsList();
  document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal());

  const modal = document.getElementById('project-modal');
  document.getElementById('project-modal-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

  setupTagInput('project-tools-wrap', 'project-tool-input', () => {});

  setupUploadZone('project-img-zone', 'project-img-file', async (files) => {
    for (const file of (files.length ? files : [files])) {
      const url = await uploadFile(file);
      editingProjectImages.push(url);
    }
    renderProjectImagePreviews();
  }, true);

  document.getElementById('project-modal-save').addEventListener('click', async () => {
    const title = document.getElementById('project-title').value.trim();
    if (!title) return notify('Project title is required.', 'error');

    const id = parseInt(document.getElementById('project-edit-id').value) || Date.now();
    const tools = getTagsFromWrapper('project-tools-wrap');

    const project = {
      id,
      title,
      category: document.getElementById('project-category').value.trim(),
      description: document.getElementById('project-desc').value.trim(),
      tools,
      images: [...editingProjectImages],
      link: document.getElementById('project-link').value.trim(),
      featured: document.getElementById('project-featured').checked,
    };

    const idx = portfolioData.projects.findIndex(p => p.id === id);
    if (idx >= 0) portfolioData.projects[idx] = project;
    else portfolioData.projects.push(project);

    try {
      await saveSection('projects', portfolioData.projects);
      renderProjectsList();
      closeModal(modal);
      notify('Project saved!');
    } catch { notify('Failed to save.', 'error'); }
  });
}

function renderProjectsList() {
  const list = document.getElementById('projects-list');
  if (!portfolioData.projects.length) {
    list.innerHTML = emptyState('🔧', 'No projects yet. Add your first project.');
    return;
  }
  list.innerHTML = portfolioData.projects.map(p => `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <p class="admin-card-title">
            ${esc(p.title)}
            ${p.featured ? '<span class="badge badge-accent" style="margin-left:0.5rem;">Featured</span>' : ''}
          </p>
          <p class="admin-card-sub">${esc(p.category || '')}${p.tools && p.tools.length ? ' · ' + p.tools.join(', ') : ''}</p>
        </div>
        <div class="admin-actions">
          <button class="btn-icon" onclick="openProjectModal(${p.id})" title="Edit">✏️</button>
          <button class="btn-icon danger" onclick="deleteProject(${p.id})" title="Delete">🗑</button>
        </div>
      </div>
      ${p.description ? `<p style="font-size:0.85rem;color:var(--text-muted)">${esc(p.description)}</p>` : ''}
    </div>
  `).join('');
}

function openProjectModal(id) {
  const modal = document.getElementById('project-modal');
  document.getElementById('project-edit-id').value = id || '';
  document.getElementById('project-modal-title').textContent = id ? 'Edit Project' : 'Add Project';
  clearTagWrapper('project-tools-wrap', 'project-tool-input');
  editingProjectImages = [];

  if (id) {
    const p = portfolioData.projects.find(p => p.id === id);
    if (p) {
      document.getElementById('project-title').value = p.title;
      document.getElementById('project-category').value = p.category || '';
      document.getElementById('project-desc').value = p.description || '';
      document.getElementById('project-link').value = p.link || '';
      document.getElementById('project-featured').checked = !!p.featured;
      (p.tools || []).forEach(t => addTag('project-tools-wrap', 'project-tool-input', t));
      editingProjectImages = [...(p.images || [])];
    }
  } else {
    ['project-title','project-category','project-desc','project-link'].forEach(i => {
      document.getElementById(i).value = '';
    });
    document.getElementById('project-featured').checked = false;
  }

  renderProjectImagePreviews();
  openModal(modal);
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  portfolioData.projects = portfolioData.projects.filter(p => p.id !== id);
  try {
    await saveSection('projects', portfolioData.projects);
    renderProjectsList();
    notify('Deleted.');
  } catch { notify('Failed to delete.', 'error'); }
}

function renderProjectImagePreviews() {
  const wrap = document.getElementById('project-img-previews');
  wrap.innerHTML = editingProjectImages.map((url, i) => `
    <div class="image-preview-item">
      <img src="${url}" />
      <div class="image-preview-remove" onclick="removeProjectImage(${i})">✕</div>
    </div>
  `).join('');
}

function removeProjectImage(i) {
  editingProjectImages.splice(i, 1);
  renderProjectImagePreviews();
}

// ===== SETTINGS =====
function setupSettingsPanel() {
  document.getElementById('change-pw-btn').addEventListener('click', async () => {
    const current = document.getElementById('current-pw').value;
    const newPw = document.getElementById('new-pw').value;
    const confirm = document.getElementById('confirm-pw').value;
    const msgEl = document.getElementById('pw-msg');

    if (newPw !== confirm) {
      msgEl.innerHTML = '<p class="error-msg">New passwords do not match.</p>';
      return;
    }

    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
    });
    const data = await res.json();
    if (res.ok) {
      msgEl.innerHTML = '<p class="success-msg">Password updated successfully.</p>';
      ['current-pw','new-pw','confirm-pw'].forEach(id => { document.getElementById(id).value = ''; });
    } else {
      msgEl.innerHTML = `<p class="error-msg">${data.error || 'Failed to update password.'}</p>`;
    }
  });
}

// ===== FILE UPLOAD =====
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  const { url } = await res.json();
  return url;
}

function setupUploadZone(zoneId, inputId, onUpload, multiple = false) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (multiple) onUpload(files);
    else if (files[0]) onUpload(files[0]);
  });

  input.addEventListener('change', () => {
    const files = Array.from(input.files);
    if (multiple) onUpload(files);
    else if (files[0]) onUpload(files[0]);
    input.value = '';
  });
}

// ===== TAG INPUT =====
function setupTagInput(wrapperId, inputId) {
  const input = document.getElementById(inputId);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.replace(/,/g, '').trim();
      if (val) addTag(wrapperId, inputId, val);
      input.value = '';
    } else if (e.key === 'Backspace' && !input.value) {
      const chips = document.querySelectorAll(`#${wrapperId} .tag-chip`);
      if (chips.length) chips[chips.length - 1].remove();
    }
  });
  document.getElementById(wrapperId).addEventListener('click', () => input.focus());
}

function addTag(wrapperId, inputId, text) {
  const wrapper = document.getElementById(wrapperId);
  const input = document.getElementById(inputId);
  const chip = document.createElement('span');
  chip.className = 'tag-chip';
  chip.innerHTML = `${esc(text)}<span class="tag-chip-remove" onclick="this.parentElement.remove()">✕</span>`;
  chip.dataset.value = text;
  wrapper.insertBefore(chip, input);
}

function getTagsFromWrapper(wrapperId) {
  return Array.from(document.querySelectorAll(`#${wrapperId} .tag-chip`)).map(c => c.dataset.value);
}

function clearTagWrapper(wrapperId, inputId) {
  document.querySelectorAll(`#${wrapperId} .tag-chip`).forEach(c => c.remove());
  document.getElementById(inputId).value = '';
}

// ===== MODALS =====
function openModal(modal) { modal.classList.add('open'); }
function closeModal(modal) { modal.classList.remove('open'); }

// ===== UTILS =====
function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><p>${msg}</p></div>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

init();
