document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
        } else {
          entry.target.classList.remove('visible');
          entry.target.classList.add('hidden');
        }
      });
    },
    { threshold: 0.1 }
  );

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 10;
    const rotateX = (y / rect.height - 0.5) * -10;
    el.style.setProperty('--rotateX', `${rotateX}deg`);
    el.style.setProperty('--rotateY', `${rotateY}deg`);
  };

  const handleMouseLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--rotateX', '0deg');
    el.style.setProperty('--rotateY', '0deg');
  };

  const animationToggle = document.getElementById('animation-toggle');
  let animationsEnabled = localStorage.getItem('animations') !== 'off';

  function enableAnimations() {
    document.body.classList.remove('no-animations');
    document.querySelectorAll('.glass').forEach((el) => {
      el.classList.add('hidden');
      observer.observe(el);
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
    animationToggle.textContent = '💫';
    animationsEnabled = true;
    localStorage.setItem('animations', 'on');
  }

  function disableAnimations() {
    document.body.classList.add('no-animations');
    observer.disconnect();
    document.querySelectorAll('.glass').forEach((el) => {
      el.classList.remove('hidden');
      el.classList.add('visible');
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.style.setProperty('--rotateX', '0deg');
      el.style.setProperty('--rotateY', '0deg');
    });
    animationToggle.textContent = '🛑';
    animationsEnabled = false;
    localStorage.setItem('animations', 'off');
  }

  if (animationsEnabled) {
    enableAnimations();
  } else {
    disableAnimations();
  }

  animationToggle.addEventListener('click', () => {
    if (animationsEnabled) {
      disableAnimations();
    } else {
      enableAnimations();
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const newTheme =
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'light'
        : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
});

