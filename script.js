document.addEventListener('DOMContentLoaded', () => {
  const readPreference = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const savePreference = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ }
  };
  const animationToggle = document.getElementById('animation-toggle');
  const sections = [...document.querySelectorAll('main .glass')];
  const revealed = new WeakSet();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationsRequested = readPreference('animations') !== 'off';
  let observer;
  const reveal = (section) => {
    section.classList.remove('reveal-pending');
    revealed.add(section);
  };

  function updateAnimations() {
    observer?.disconnect();
    const enabled = animationsRequested && !reducedMotion.matches;
    document.body.classList.toggle('no-animations', !enabled);
    animationToggle.setAttribute('aria-pressed', String(enabled));
    animationToggle.disabled = reducedMotion.matches;
    animationToggle.textContent = enabled ? '💫' : '🛑';
    animationToggle.title = reducedMotion.matches
      ? 'Animations disabled by your reduced-motion preference'
      : enabled ? 'Turn animations off' : 'Turn animations on';

    if (!enabled || !('IntersectionObserver' in window)) {
      sections.forEach(reveal);
      return;
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    sections.forEach((section) => {
      const bounds = section.getBoundingClientRect();
      if (revealed.has(section) || bounds.top < window.innerHeight) {
        reveal(section);
      } else {
        section.classList.add('reveal-pending');
        observer.observe(section);
      }
    });
  }
  animationToggle.addEventListener('click', () => {
    animationsRequested = !animationsRequested;
    savePreference('animations', animationsRequested ? 'on' : 'off');
    updateAnimations();
  });
  reducedMotion.addEventListener('change', updateAnimations);
  updateAnimations();

  const themeToggle = document.getElementById('theme-toggle');
  const updateThemeButton = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.textContent = dark ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  updateThemeButton();
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    savePreference('theme', theme);
    updateThemeButton();
  });
});
