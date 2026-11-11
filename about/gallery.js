(() => {
  const translate = window.huaruiLocale?.text ?? (value => value);
  const gallery = document.querySelector('.about-gallery');
  const slides = [...gallery.querySelectorAll('.about-gallery-frame img')];
  const caption = gallery.querySelector('.about-gallery-caption');
  const count = gallery.querySelector('.about-gallery-count');
  const controls = gallery.querySelector('.about-gallery-controls');
  const toggle = gallery.querySelector('.about-gallery-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let requested = 0;
  let change = 0;
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

  async function show(step) {
    clearTimeout(timer);
    const request = ++change;
    requested = (requested + step + slides.length) % slides.length;
    const nextIndex = requested;
    const next = slides[nextIndex];
    if (next.dataset.src && !next.hasAttribute('src')) next.src = next.dataset.src;
    try {
      await next.decode();
    } catch {
      if (request === change) {
        requested = current;
        schedule();
      }
      return;
    }
    if (request !== change) return;
    const previous = slides[current];
    current = nextIndex;

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

    caption.textContent = translate(next.dataset.caption);
    count.textContent = `${current + 1} / ${slides.length}`;
    const nextSlide = slides[(current + 1) % slides.length];
    if (nextSlide.dataset.src && !nextSlide.hasAttribute('src')) nextSlide.src = nextSlide.dataset.src;
    schedule();
  }

  function updatePlayback() {
    toggle.toggleAttribute('data-paused', !playing);
    toggle.setAttribute('aria-label', translate(playing ? '暂停自动轮播' : '开始自动轮播'));
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
      if (visible && !slides[1].hasAttribute('src')) slides[1].src = slides[1].dataset.src;
      schedule();
    }, { threshold: .35 }).observe(gallery);
  }

  controls.hidden = false;
  updatePlayback();
})();
