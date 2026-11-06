// Homepage interactions build on the original three-photo carousel.
(() => {
  const hero = document.querySelector('.hero');
  const dock = document.querySelector('.hero-dock');
  const name = hero.querySelector('.hero-info-name');
  const purpose = hero.querySelector('.hero-info-purpose');
  const auto = hero.querySelector('.hero-auto');
  const labels = ['四刃铣刀', '锥度铣刀', '锥度球刀', '倒角刀', '玉米铣刀'];
  let elapsed = 0, lastTime = 0, autoplay = false, visible = true;
  let hovered = false, dragging = null, suppressClickUntil = 0;
  let frame = 0;
  const duration = 5500;

  heroButtons.forEach((button, index) => {
    const p = products[index];
    button.innerHTML = `<span class="dock-photo"><img src="assets/${p.image}" alt="" draggable="false"></span><span class="dock-copy">${labels[index]}<small>${p.tag}</small></span><span class="dock-autoprogress" aria-hidden="true"></span>`;
    button.setAttribute('aria-label', '展示' + p.name);
  });

  function sync() {
    const p = products[heroSelected];
    name.textContent = p.name;
    purpose.textContent = p.purpose;
    heroTools.forEach(tool => {
      const current = +tool.dataset.index;
      tool.setAttribute('aria-label', (tool.dataset.slot === 'center' ? '查看' : '切换到') + products[current].name + (tool.dataset.slot === 'center' ? '详情' : ''));
    });
    elapsed = 0;
    heroButtons.forEach(button => button.querySelector('.dock-autoprogress').style.transform = 'scaleX(0)');
  }
  sync();
  document.addEventListener('hero:change', () => {
    sync();
    if (!motionQuery.matches) hero.querySelector('.hero-info > div').animate([
      { opacity: .25, translate: '0 5px' }, { opacity: 1, translate: '0 0' }
    ], { duration: 340, easing: 'ease-out' });
  });

  heroTools.forEach(tool => tool.addEventListener('click', () => {
    if (tool.dataset.slot === 'center') showProduct(+tool.dataset.index);
    else changeHero(+tool.dataset.index);
  }));
  hero.querySelector('.hero-current-open').addEventListener('click', () => showProduct(heroSelected));
  hero.querySelector('.hero-inspect').addEventListener('click', () => {
    showProduct(heroSelected);
    dialog.querySelector('.dialog-zoom').click();
  });

  // Capture only a committed horizontal drag, keeping ordinary tool clicks intact.
  heroTrack.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, index: heroSelected, committed: false };
  });
  heroTrack.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    const x = event.clientX - dragging.x, y = event.clientY - dragging.y;
    if (!dragging.committed && Math.abs(x) > 10 && Math.abs(x) > Math.abs(y) * 1.2) {
      dragging.committed = true;
      heroTrack.setPointerCapture(event.pointerId);
      heroTrack.classList.add('is-dragging');
    }
    if (dragging.committed) event.preventDefault();
  });
  function finishDrag(event, cancelled = false) {
    if (!dragging || event.pointerId !== dragging.id) return;
    const drag = dragging;
    dragging = null;
    heroTrack.classList.remove('is-dragging');
    if (heroTrack.hasPointerCapture(event.pointerId)) heroTrack.releasePointerCapture(event.pointerId);
    if (drag.committed) {
      suppressClickUntil = performance.now() + 350;
      const dx = event.clientX - drag.x;
      if (!cancelled && Math.abs(dx) > 45) changeHero(wrapHero(drag.index + (dx < 0 ? 1 : -1)));
    }
  }
  heroTrack.addEventListener('pointerup', event => finishDrag(event));
  heroTrack.addEventListener('pointercancel', event => finishDrag(event, true));
  heroTrack.addEventListener('lostpointercapture', event => finishDrag(event, true));
  window.addEventListener('pointerup', event => finishDrag(event));
  heroTrack.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  heroVisual.addEventListener('pointermove', event => {
    if (!finePointer.matches || motionQuery.matches) return;
    const box = heroVisual.getBoundingClientRect();
    heroVisual.style.setProperty('--glow-x', ((event.clientX - box.left) / box.width * 100).toFixed(1) + '%');
    heroVisual.style.setProperty('--glow-y', ((event.clientY - box.top) / box.height * 100).toFixed(1) + '%');
  });
  heroVisual.addEventListener('pointerleave', () => {
    heroVisual.style.removeProperty('--glow-x'); heroVisual.style.removeProperty('--glow-y');
  });

  function tick(time) {
    const dt = lastTime ? Math.min(time - lastTime, 100) : 0;
    lastTime = time;
    const keyboardFocus = document.activeElement?.matches(':focus-visible') && (heroVisual.contains(document.activeElement) || dock.contains(document.activeElement));
    if (visible && !document.hidden && !hovered && !dragging && !document.querySelector('dialog[open]') && !keyboardFocus) {
      elapsed += dt;
      if (elapsed >= duration) changeHero(wrapHero(heroSelected + 1));
    }
    heroButtons[heroSelected].querySelector('.dock-autoprogress').style.transform = `scaleX(${elapsed / duration})`;
    frame = requestAnimationFrame(tick);
  }
  function setAutoplay(enabled) {
    autoplay = enabled && !motionQuery.matches;
    cancelAnimationFrame(frame);
    elapsed = 0; lastTime = 0;
    auto.setAttribute('aria-pressed', String(autoplay));
    auto.setAttribute('aria-label', autoplay ? '暂停自动浏览刀具' : '开启自动浏览刀具');
    auto.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${autoplay ? '<path d="M4 3h3v10H4zm5 0h3v10H9z"/>' : '<path d="m5 3 7 5-7 5z"/>'}</svg><span>${autoplay ? '暂停浏览' : '自动浏览'}</span>`;
    dock.classList.toggle('is-autoplay', autoplay);
    heroButtons.forEach(button => button.querySelector('.dock-autoprogress').style.transform = 'scaleX(0)');
    if (autoplay) frame = requestAnimationFrame(tick);
  }
  auto.addEventListener('click', () => setAutoplay(!autoplay));
  [heroVisual, dock].forEach(element => {
    element.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') hovered = true; });
    element.addEventListener('pointerleave', () => { hovered = false; });
  });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: .25 }).observe(hero);
  motionQuery.addEventListener('change', () => { if (motionQuery.matches) setAutoplay(false); });
  if (!motionQuery.matches) {
    hero.querySelector('.hero-copy').classList.add('hero-entry');
    heroVisual.classList.add('hero-entry');
    heroVisual.style.animationDelay = '100ms';
  }
})();
