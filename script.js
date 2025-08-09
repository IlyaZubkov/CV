document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.remove('hidden');
      } else {
        entry.target.classList.remove('visible');
        entry.target.classList.add('hidden');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.glass').forEach((el) => {
    el.classList.add('hidden');
    observer.observe(el);

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = ((y / rect.height) - 0.5) * -10;
      el.style.setProperty('--rotateX', `${rotateX}deg`);
      el.style.setProperty('--rotateY', `${rotateY}deg`);
    });

    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--rotateX', '0deg');
      el.style.setProperty('--rotateY', '0deg');
    });

    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.classList.add('ripple');
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });
  });

  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
});
