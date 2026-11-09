(() => {
  const gallery = document.querySelector('.about-gallery');
  const slides = [...gallery.querySelectorAll('.about-gallery-frame img')];
  const caption = gallery.querySelector('.about-gallery-caption');
  const count = gallery.querySelector('.about-gallery-count');
  const controls = gallery.querySelector('.about-gallery-controls');
  const toggle = gallery.querySelector('.about-gallery-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let playing = !motion.matches;
  let visible = !('IntersectionObserver' in window);
  let hovered = false;
  let keyboardFocus = false;
  let timer;
  let slideAnimation;

  function schedule() {
    clearTimeout(timer);
    if (playing && visible && !hovered && !keyboardFocus && !document.hidden) {
      timer = setTimeout(() => show(1), 4800);
    }
  }

  function show(step) {
    const previous = slides[current];
    current = (current + step + slides.length) % slides.length;
    const next = slides[current];

    slideAnimation?.cancel();
    previous.classList.remove('is-current');
    previous.setAttribute('aria-hidden', 'true');
    next.classList.add('is-current');
    next.removeAttribute('aria-hidden');
    if (!motion.matches && next.animate) {
      slideAnimation = next.animate(
        [{ translate: step > 0 ? '6% 0' : '-6% 0' }, { translate: '0 0' }],
        { duration: 480, easing: 'cubic-bezier(.2,.7,.3,1)' },
      );
    }

    caption.textContent = next.dataset.caption;
    count.textContent = `${current + 1} / ${slides.length}`;
    schedule();
  }

  function updatePlayback() {
    toggle.toggleAttribute('data-paused', !playing);
    toggle.setAttribute('aria-label', playing ? '暂停自动轮播' : '开始自动轮播');
    schedule();
  }

  controls.querySelectorAll('[data-gallery-step]').forEach(button => {
    button.addEventListener('click', () => show(Number(button.dataset.galleryStep)));
  });
  toggle.addEventListener('click', () => {
    playing = !playing;
    if (playing) keyboardFocus = false;
    updatePlayback();
  });
  gallery.addEventListener('pointerenter', event => {
    hovered = event.pointerType === 'mouse';
    schedule();
  });
  gallery.addEventListener('pointerleave', () => {
    hovered = false;
    schedule();
  });
  gallery.addEventListener('focusin', event => {
    keyboardFocus = event.target.matches(':focus-visible');
    schedule();
  });
  gallery.addEventListener('focusout', event => {
    if (!gallery.contains(event.relatedTarget)) {
      keyboardFocus = false;
      schedule();
    }
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    if (motion.matches) {
      slideAnimation?.cancel();
      playing = false;
      updatePlayback();
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .35;
      schedule();
    }, { threshold: .35 }).observe(gallery);
  }

  controls.hidden = false;
  updatePlayback();
})();
