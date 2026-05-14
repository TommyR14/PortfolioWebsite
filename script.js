const container = document.getElementById('scroll-container');
const sections  = document.querySelectorAll('.snap-section');
const dots      = document.querySelectorAll('.dot');

let currentIdx = 0;

// ── Sync dot state when a section is ≥50% visible ──────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    currentIdx = [...sections].indexOf(entry.target);
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIdx));
  });
}, { root: container, threshold: 0.5 });

sections.forEach(s => observer.observe(s));

// ── Dot clicks ──────────────────────────────────────────────────────────────
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Keyboard navigation (↑/↓ arrows) ───────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && currentIdx < sections.length - 1) {
    e.preventDefault();
    sections[currentIdx + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (e.key === 'ArrowUp' && currentIdx > 0) {
    e.preventDefault();
    sections[currentIdx - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
