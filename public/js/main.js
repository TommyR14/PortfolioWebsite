const CERT_ICONS = ['🏅', '📜', '🎖️', '✅', '🏆', '⭐'];

async function loadPortfolio() {
  const res = await fetch('/api/portfolio');
  const data = await res.json();
  const page = window.location.pathname;

  // Always render what exists on the page
  if (document.getElementById('hero-name')) renderHero(data.profile || {});
  if (document.getElementById('about-bio')) {
    document.getElementById('about-bio').textContent = data.profile.bio || '';
  }
  if (document.getElementById('skills-grid')) renderSkills(data.skills || []);
  if (document.getElementById('certs-grid')) renderCerts(data.certifications || []);
  if (document.getElementById('education-list')) renderEducation(data.education || []);
  if (document.getElementById('experience-timeline')) renderExperience(data.experience || []);
  if (document.getElementById('projects-grid')) renderProjects(data.projects || []);
  if (document.getElementById('contact-grid')) renderContact(data.profile || {});
  if (document.getElementById('snap-projects-list')) renderSnapProjects(data.projects || []);
  if (document.getElementById('hero-links-contact')) renderSnapContact(data.profile || {});
  if (document.querySelector('.snap-container')) initSnapNav();
  if (document.getElementById('snap-preview')) initHoverPreviews(data);
  if (document.getElementById('footer-text')) {
    document.getElementById('footer-text').textContent =
      `© ${new Date().getFullYear()} ${data.profile.name || 'Portfolio'}. All rights reserved.`;
  }
  checkAuth();
  addRevealAttributes();
}

// ===== PARALLAX SHOWCASE =====
function renderShowcase(projects) {
  const wrap = document.getElementById('parallax-showcase');
  // Use projects that have images, prefer featured first
  const withImages = [
    ...projects.filter(p => p.featured && p.images && p.images.length),
    ...projects.filter(p => !p.featured && p.images && p.images.length),
  ];

  if (!withImages.length) { wrap.style.display = 'none'; return; }

  wrap.innerHTML = withImages.map((p, i) => {
    const toolsHtml = (p.tools || []).map(t =>
      `<span class="parallax-tool">${esc(t)}</span>`
    ).join('');

    return `
      <div class="parallax-panel" data-index="${i}">
        <div class="parallax-bg" style="background-image: url('${p.images[0]}')"></div>
        <div class="parallax-content">
          <p class="parallax-counter">${String(i + 1).padStart(2, '0')} / ${String(withImages.length).padStart(2, '0')} &nbsp;·&nbsp; ${esc(p.category || '')}</p>
          <h2 class="parallax-title">${esc(p.title)}</h2>
          ${p.description ? `<p class="parallax-desc">${esc(p.description)}</p>` : ''}
          ${toolsHtml ? `<div class="parallax-tools">${toolsHtml}</div>` : ''}
          ${p.link ? `<a href="${p.link}" target="_blank" class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.3);">View Project →</a>` : ''}
        </div>
        ${i === 0 ? `<div class="scroll-hint"><div class="scroll-hint-line"></div><span>Scroll</span></div>` : ''}
      </div>
    `;
  }).join('');
}

function renderHero(p) {
  document.title = p.name ? `${p.name} — Portfolio` : 'Portfolio';
  const nl = document.getElementById('nav-logo');
  if (p.name) {
    const parts = p.name.split(' ');
    nl.innerHTML = `${parts[0]}<span>${parts.slice(1).join(' ') || ''}</span>`;
  }

  const avatarWrap = document.getElementById('hero-avatar-wrap');
  if (p.avatar) {
    avatarWrap.innerHTML = `<img class="hero-avatar" src="${p.avatar}" alt="${p.name}" />`;
  } else {
    avatarWrap.innerHTML = `<div class="hero-avatar-placeholder">👤</div>`;
  }

  document.getElementById('hero-name').textContent = p.name || 'Your Name';
  document.getElementById('hero-title').textContent = p.title || '';
  document.getElementById('hero-bio').textContent = p.bio || '';

  const links = document.getElementById('hero-links');
  links.innerHTML = '';
  if (p.email) {
    links.innerHTML += `<a href="mailto:${p.email}" class="btn btn-primary">✉ Contact Me</a>`;
  }
  if (p.linkedin) {
    links.innerHTML += `<a href="${p.linkedin}" target="_blank" class="btn btn-outline">in LinkedIn</a>`;
  }
  if (p.github) {
    links.innerHTML += `<a href="${p.github}" target="_blank" class="btn btn-outline">⌥ GitHub</a>`;
  }
  document.getElementById('footer-text').textContent =
    `© ${new Date().getFullYear()} ${p.name || 'Portfolio'}. All rights reserved.`;
}

function renderSkills(skills) {
  const grid = document.getElementById('skills-grid');
  if (!skills.length) {
    grid.innerHTML = '<p style="color:var(--text-dim)">No skills added yet.</p>';
    return;
  }
  grid.innerHTML = skills.map(s => `
    <div class="skill-card">
      <p class="skill-category">${esc(s.category)}</p>
      <div class="skill-tags">
        ${(s.items || []).map(i => `<span class="skill-tag">${esc(i)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderCerts(certs) {
  const grid = document.getElementById('certs-grid');
  if (!certs.length) {
    grid.innerHTML = '<p style="color:var(--text-dim)">No certifications added yet.</p>';
    return;
  }
  grid.innerHTML = certs.map((c, i) => `
    <div class="cert-card">
      <div class="cert-icon">${CERT_ICONS[i % CERT_ICONS.length]}</div>
      <div class="cert-info">
        <p class="cert-name">${esc(c.name)}</p>
        <p class="cert-issuer">${esc(c.issuer)}</p>
        <p class="cert-date">📅 ${esc(c.date)}${c.credentialId ? ` · ID: ${esc(c.credentialId)}` : ''}</p>
        ${c.url ? `<a href="${c.url}" target="_blank" style="font-size:0.75rem;margin-top:0.4rem;display:inline-block;">View Credential →</a>` : ''}
      </div>
    </div>
  `).join('');
}

function renderEducation(schools) {
  const list = document.getElementById('education-list');
  if (!schools.length) {
    list.innerHTML = '<p style="color:var(--text-dim)">No education added yet.</p>';
    return;
  }
  list.innerHTML = schools.map(s => `
    <div class="cert-card" style="margin-bottom:1rem;">
      <div class="cert-icon">🎓</div>
      <div class="cert-info">
        <p class="cert-name">${esc(s.degree)}${s.major ? ` in ${esc(s.major)}` : ''}</p>
        <p class="cert-issuer">${esc(s.school)}</p>
        <p class="cert-date">📅 ${esc(s.graduationYear || '')}${s.location ? ` · ${esc(s.location)}` : ''}</p>
        ${s.notes ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem;">${esc(s.notes)}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function renderExperience(jobs) {
  const tl = document.getElementById('experience-timeline');
  if (!jobs.length) {
    tl.innerHTML = '<p style="color:var(--text-dim)">No experience added yet.</p>';
    return;
  }
  tl.innerHTML = jobs.map(j => {
    const start = formatDate(j.startDate);
    const end = j.current ? 'Present' : formatDate(j.endDate);
    return `
      <div class="timeline-item">
        <div class="exp-header">
          <div>
            <p class="exp-role">${esc(j.role)}</p>
            <p class="exp-company">${esc(j.company)}</p>
            <p class="exp-location">${esc(j.location || '')}</p>
          </div>
          <span class="exp-dates">${start} — ${end}</span>
        </div>
        ${j.description ? `<p class="exp-desc">${esc(j.description)}</p>` : ''}
        ${(j.highlights && j.highlights.length) ? `
          <ul class="exp-highlights">
            ${j.highlights.filter(h => h).map(h => `<li>${esc(h)}</li>`).join('')}
          </ul>` : ''}
      </div>
    `;
  }).join('');
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('project-filters');

  const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const existing = Array.from(filterBar.querySelectorAll('.filter-btn[data-filter]'));
  existing.forEach(b => { if (b.dataset.filter !== 'all') b.remove(); });

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = cat;
    btn.textContent = cat;
    filterBar.appendChild(btn);
  });

  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(projects, btn.dataset.filter);
    });
  });

  applyFilter(projects, 'all');
}

function applyFilter(projects, filter) {
  const grid = document.getElementById('projects-grid');
  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  if (!filtered.length) {
    grid.innerHTML = '<p style="color:var(--text-dim)">No projects added yet.</p>';
    return;
  }

  const featured = filtered.filter(p => p.featured);
  const regular  = filtered.filter(p => !p.featured);

  const featuredHtml = featured.map(p => {
    const hasImg = p.images && p.images.length;
    const extraThumbs = hasImg && p.images.length > 1
      ? `<div class="project-cinematic-thumbs">
          ${p.images.slice(1).map((src, i) => `
            <img src="${src}" class="project-cinematic-thumb" alt="${esc(p.title)} view ${i + 2}"
              onclick="this.closest('.project-featured-media').querySelector('.project-cinematic-img').src='${src}'" />
          `).join('')}
        </div>` : '';
    const imgHtml = hasImg
      ? `<img class="project-cinematic-img" src="${p.images[0]}" alt="${esc(p.title)}" loading="lazy" />${extraThumbs}`
      : `<div class="project-cinematic-placeholder"><span class="placeholder-icon">📐</span><span class="placeholder-label">${esc(p.category || 'Project')}</span></div>`;
    return `
      <div class="project-featured-card">
        <div class="project-featured-media">${imgHtml}</div>
        <div class="project-featured-body">
          <p class="project-category">${esc(p.category || '')}</p>
          <h3 class="project-featured-title">${esc(p.title)}</h3>
          <p class="project-featured-desc">${esc(p.description || '')}</p>
          ${(p.tools && p.tools.length) ? `
            <div class="project-tools">
              ${p.tools.map(t => `<span class="project-tool">${esc(t)}</span>`).join('')}
            </div>` : ''}
          ${p.link ? `<a href="${p.link}" target="_blank" class="project-link">View Project →</a>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const regularHtml = regular.length ? `
    <div class="projects-regular-grid">
      ${regular.map(p => {
        const hasImg = p.images && p.images.length;
        const imgHtml = hasImg
          ? `<img class="project-img" src="${p.images[0]}" alt="${esc(p.title)}" loading="lazy" />`
          : `<div class="project-img-placeholder"><span class="placeholder-icon-sm">🔧</span><span class="placeholder-label-sm">${esc(p.category || 'Project')}</span></div>`;
        return `
          <div class="project-card">
            ${imgHtml}
            <div class="project-body">
              <p class="project-category">${esc(p.category || '')}</p>
              <h3 class="project-title">${esc(p.title)}</h3>
              <p class="project-desc">${esc(p.description || '')}</p>
              ${(p.tools && p.tools.length) ? `
                <div class="project-tools">
                  ${p.tools.map(t => `<span class="project-tool">${esc(t)}</span>`).join('')}
                </div>` : ''}
              ${p.link ? `<a href="${p.link}" target="_blank" class="project-link">View Project →</a>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  grid.innerHTML = featuredHtml + regularHtml;
}

function renderContact(p) {
  const grid = document.getElementById('contact-grid');
  const items = [];
  if (p.email) items.push({ icon: '✉️', label: 'Email', value: p.email, href: `mailto:${p.email}` });
  if (p.location) items.push({ icon: '📍', label: 'Location', value: p.location });
  if (p.linkedin) items.push({ icon: '💼', label: 'LinkedIn', value: 'Connect', href: p.linkedin });
  if (p.github) items.push({ icon: '⌥', label: 'GitHub', value: 'Follow', href: p.github });

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-dim)">No contact info added yet.</p>';
    return;
  }
  grid.innerHTML = items.map(item => `
    <${item.href ? `a href="${item.href}" target="_blank"` : 'div'} class="contact-item" style="color:inherit;opacity:1;">
      <span class="contact-icon">${item.icon}</span>
      <div>
        <p class="contact-label">${item.label}</p>
        <p class="contact-value">${esc(item.value)}</p>
      </div>
    </${item.href ? 'a' : 'div'}>
  `).join('');
}

async function checkAuth() {
  const res = await fetch('/api/auth-status');
  const { authenticated } = await res.json();
  const link = document.getElementById('admin-link');
  if (authenticated) {
    link.textContent = 'Admin Panel';
    link.href = '/admin';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
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

// ===== ADD REVEAL ATTRIBUTES AFTER RENDER =====
function addRevealAttributes() {
  // Section labels and titles
  document.querySelectorAll('.section-label, .section-title').forEach(el => {
    el.setAttribute('data-reveal', '');
  });

  // Skill cards — staggered
  document.querySelectorAll('.skill-card').forEach((el, i) => {
    el.setAttribute('data-reveal', 'scale');
    el.setAttribute('data-delay', Math.min(i + 1, 6));
  });

  // Cert cards — staggered
  document.querySelectorAll('.cert-card').forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.setAttribute('data-delay', Math.min(i + 1, 6));
  });

  // Timeline items — slide from left
  document.querySelectorAll('.timeline-item').forEach((el, i) => {
    el.setAttribute('data-reveal', 'left');
    el.setAttribute('data-delay', Math.min(i + 1, 6));
  });

  // Featured project cards
  document.querySelectorAll('.project-featured-card').forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.setAttribute('data-delay', Math.min(i + 1, 3));
  });

  // Regular project cards — staggered scale
  document.querySelectorAll('.project-card').forEach((el, i) => {
    el.setAttribute('data-reveal', 'scale');
    el.setAttribute('data-delay', Math.min(i + 1, 6));
  });

  // Contact items
  document.querySelectorAll('.contact-item').forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.setAttribute('data-delay', Math.min(i + 1, 6));
  });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

// ===== NAV SCROLL EFFECT =====
function initNav() {
  const nav = document.querySelector('nav');
  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    nav.classList.toggle('scrolled', scrolled);
    const total = document.body.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total * 100).toFixed(1) : 0;
    nav.style.setProperty('--scroll-progress', `${pct}%`);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ===== PARALLAX SCROLL =====
function initParallax() {
  const panels = document.querySelectorAll('.parallax-panel');
  if (!panels.length) return;

  let ticking = false;
  const update = () => {
    panels.forEach(panel => {
      const rect = panel.getBoundingClientRect();
      const vh = window.innerHeight;
      // How far through the panel are we? (-1 = above, 0 = center, 1 = below)
      const progress = (vh / 2 - rect.top - rect.height / 2) / vh;
      // Shift the background layer by up to ±12% for a smooth parallax
      const shift = progress * 24;
      const bg = panel.querySelector('.parallax-bg');
      if (bg) bg.style.transform = `translateY(${shift}%)`;
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

// ===== MAGNETIC BUTTONS =====
function initMagneticButtons() {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

loadPortfolio().then(() => {
  initScrollReveal();
  initNav();
  initParallax();
  initMagneticButtons();
});

// ===== SNAP LANDING =====
function renderSnapProjects(projects) {
  const list = document.getElementById('snap-projects-list');
  if (!list) return;
  const featured = projects.filter(p => p.featured).slice(0, 4);
  if (!featured.length) { list.closest('.snap-section').style.display = 'none'; return; }
  list.innerHTML = featured.map((p, i) => `
    <div class="snap-project-item">
      <span class="snap-project-num">${String(i+1).padStart(2,'0')}</span>
      <div>
        <div class="snap-project-title">${esc(p.title)}</div>
        <div class="snap-project-meta">${esc((p.tools||[]).slice(0,3).join(' · '))}</div>
      </div>
    </div>
  `).join('');
}

function renderSnapContact(profile) {
  const wrap = document.getElementById('hero-links-contact');
  if (!wrap) return;
  let html = '';
  if (profile.email) html += `<a href="mailto:${profile.email}" class="btn btn-primary">✉ Contact Me</a>`;
  if (profile.linkedin) html += `<a href="${profile.linkedin}" target="_blank" class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4);">in LinkedIn</a>`;
  if (profile.github) html += `<a href="${profile.github}" target="_blank" class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4);">⌥ GitHub</a>`;
  wrap.innerHTML = html;
}

function initSnapNav() {
  const container = document.querySelector('.snap-container');
  const dots = document.querySelectorAll('.snap-dot');
  const sections = document.querySelectorAll('.snap-section');
  if (!container || !dots.length) return;

  document.body.classList.add('has-snap');

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const i = parseInt(dot.dataset.index);
      sections[i].scrollIntoView({ behavior: 'smooth' });
    });
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const i = [...sections].indexOf(entry.target);
        dots.forEach(d => d.classList.remove('active'));
        if (dots[i]) dots[i].classList.add('active');
      }
    });
  }, { root: container, threshold: 0.5 });

  sections.forEach(s => obs.observe(s));
}

// ===== HOVER PREVIEWS =====
function initHoverPreviews(data) {
  const preview = document.getElementById('snap-preview');
  const inner = document.getElementById('snap-preview-inner');
  if (!preview || !inner) return;

  const previews = {
    projects: () => {
      const items = (data.projects || []).slice(0, 4);
      return `<div class="snap-preview-title">Projects</div>` +
        items.map(p => `<div class="snap-preview-item"><strong>${esc(p.title)}</strong>${esc(p.category)}</div>`).join('');
    },
    experience: () => {
      const items = (data.experience || []);
      return `<div class="snap-preview-title">Experience</div>` +
        items.map(e => `<div class="snap-preview-item"><strong>${esc(e.role)}</strong>${esc(e.company)}</div>`).join('') +
        `<div class="snap-preview-title" style="margin-top:0.75rem">Education</div>` +
        (data.education || []).map(e => `<div class="snap-preview-item"><strong>${esc(e.degree)} in ${esc(e.major)}</strong>${esc(e.school)}</div>`).join('');
    },
    skills: () => {
      const certs = (data.certifications || []);
      const skills = (data.skills || []).slice(0, 3);
      return `<div class="snap-preview-title">Certifications</div>` +
        certs.map(c => `<div class="snap-preview-item"><strong>${esc(c.name)}</strong>${esc(c.issuer)}</div>`).join('') +
        `<div class="snap-preview-title" style="margin-top:0.75rem">Skills</div>` +
        skills.map(s => `<div class="snap-preview-item"><strong>${esc(s.category)}</strong>${(s.items||[]).slice(0,3).join(', ')}</div>`).join('');
    }
  };

  document.querySelectorAll('.snap-nav-card[data-preview]').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const key = card.dataset.preview;
      if (!previews[key]) return;
      inner.innerHTML = previews[key]();
      const rect = card.getBoundingClientRect();
      preview.style.left = rect.left + 'px';
      preview.style.top = (rect.top - preview.offsetHeight - 12) + 'px';
      preview.classList.add('visible');
      // reposition after render
      requestAnimationFrame(() => {
        preview.style.top = (rect.top - preview.offsetHeight - 12) + 'px';
      });
    });
    card.addEventListener('mouseleave', () => {
      preview.classList.remove('visible');
    });
  });
}
