(() => {
  const company = document.getElementById('company');
  const cover = company.querySelector('.company-video-cover');
  const dialog = document.getElementById('factory-dialog');
  const video = dialog.querySelector('video');
  const close = dialog.querySelector('.factory-dialog-close');

  cover.addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('modal-open');
    if (!video.hasAttribute('src')) {
      video.poster = video.dataset.poster;
      video.src = video.dataset.src;
    }
    video.play().catch(() => {});
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
    document.body.classList.remove('modal-open');
    cover.focus({ preventScroll: true });
  });

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const sections = [...company.querySelectorAll('[data-company-reveal]')];
  const stats = company.querySelector('.company-stats');
  const numbers = [...stats.querySelectorAll('[data-count]')];
  const reels = [];

  function resetNumbers() {
    for (const reel of reels.splice(0)) reel.cancel();
    for (const number of numbers) number.textContent = number.dataset.count;
  }

  function rollNumbers() {
    resetNumbers();
    numbers.forEach((number, index) => {
      number.replaceChildren();
      for (const [position, character] of [...number.dataset.count].entries()) {
        if (!/[0-9]/.test(character)) {
          number.append(character);
          continue;
        }
        const digit = document.createElement('span');
        digit.className = 'company-stat-digit';
        const reel = document.createElement('span');
        reel.className = 'company-stat-reel';
        for (let value = 0; value <= 10 + Number(character); value++) {
          const step = document.createElement('span');
          step.textContent = String(value % 10);
          reel.append(step);
        }
        digit.append(reel);
        number.append(digit);
        reels.push(reel.animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(calc(-100% + 1em))' },
        ], { duration: 950, delay: 105 + index * 90 + position * 32, easing: 'cubic-bezier(.18,.62,.25,1)', fill: 'both' }));
      }
    });
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting, intersectionRatio } of entries) {
      if (!isIntersecting) {
        target.classList.remove('is-entered');
        if (target === stats) resetNumbers();
      } else if (intersectionRatio >= .12 && !target.classList.contains('is-entered')) {
        target.classList.add('is-entered');
        if (target === stats) rollNumbers();
      }
    }
  }, { threshold: [0, .12] });

  function updateMotion() {
    observer.disconnect();
    resetNumbers();
    company.classList.toggle('company-motion-ready', !motion.matches);
    for (const section of sections) {
      section.classList.remove('is-entered');
      if (!motion.matches) observer.observe(section);
    }
  }

  updateMotion();
  motion.addEventListener('change', updateMotion);
})();
