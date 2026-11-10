// Pointer, keyboard and details use the existing three-tool carousel.
(() => {
  const hero = document.querySelector('.hero');
  const name = hero.querySelector('.hero-info-name');
  let dragging = null, suppressClickUntil = 0;
  let captionAnimation, glowFrame = 0, glowPointer;

  function sync() {
    name.textContent = localizeUi(products[heroSelected].name);
    heroTools.forEach(tool => {
      const product = products[+tool.dataset.index];
      const main = tool.dataset.slot === 'center';
      tool.setAttribute('aria-label', localizeUi(main ? '查看' + product.name + '详情' : '切换到' + product.name));
    });
  }
  sync();
  document.addEventListener('hero:change', () => {
    sync();
    captionAnimation?.cancel();
    if (!motionQuery.matches) captionAnimation = name.animate([
      { opacity: .45, translate: '0 3px' }, { opacity: 1, translate: '0 0' }
    ], { duration: 240, easing: 'ease-out' });
  });

  heroTools.forEach(tool => tool.addEventListener('click', () => {
    if (tool.dataset.slot === 'center') showProduct(+tool.dataset.index);
    else changeHero(+tool.dataset.index);
  }));
  hero.querySelector('.hero-current-open').addEventListener('click', () => showProduct(heroSelected));

  // Start a horizontal gesture without disrupting clicks or vertical scrolling.
  heroTrack.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
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
      suppressClickUntil = performance.now() + 300;
      const dx = event.clientX - drag.x;
      if (!cancelled && Math.abs(dx) > 45) changeHero(wrapHero(drag.index + (dx < 0 ? 1 : -1)));
    }
  }
  heroTrack.addEventListener('pointerup', event => finishDrag(event));
  heroTrack.addEventListener('pointercancel', event => finishDrag(event, true));
  heroTrack.addEventListener('lostpointercapture', event => finishDrag(event, true));
  window.addEventListener('pointerup', event => finishDrag(event));
  heroTrack.addEventListener('click', event => {
    if (event.detail && performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  function clearGlow() {
    cancelAnimationFrame(glowFrame);
    glowFrame = 0;
    heroVisual.style.removeProperty('--glow-x');
    heroVisual.style.removeProperty('--glow-y');
  }
  heroVisual.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !finePointer.matches || motionQuery.matches) return;
    glowPointer = [event.clientX, event.clientY];
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(() => {
      glowFrame = 0;
      const box = heroVisual.getBoundingClientRect();
      const x = 50 + (glowPointer[0] - box.left - box.width / 2) / box.width * 24;
      const y = 38 + (glowPointer[1] - box.top - box.height / 2) / box.height * 20;
      heroVisual.style.setProperty('--glow-x', `${x.toFixed(1)}%`);
      heroVisual.style.setProperty('--glow-y', `${y.toFixed(1)}%`);
    });
  });
  heroVisual.addEventListener('pointerleave', clearGlow);
  motionQuery.addEventListener('change', () => {
    if (motionQuery.matches) { clearGlow(); captionAnimation?.cancel(); }
  });
  if (!motionQuery.matches) {
    hero.querySelector('.hero-copy').classList.add('hero-entry');
    heroVisual.classList.add('hero-entry');
    heroVisual.style.animationDelay = '70ms';
  }
})();
