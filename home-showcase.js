(() => {
  const gallery = document.querySelector('.showcase-gallery');
  if (!gallery) return;
  const published = Array.isArray(window.HUARUI_FEATURED) ? window.HUARUI_FEATURED : [];
  const items = published.length ? published : products.map((product, index) => ({
    name: product.name, image: `assets/${product.image}`, href: `#product-card-${index}`
  }));
  if (!items.length) return;

  const main = gallery.querySelector('[data-photo="main"]');
  const left = gallery.querySelector('[data-photo="prev"]');
  const right = gallery.querySelector('[data-photo="next"]');
  const caption = gallery.querySelector('.showcase-caption a');
  const arrows = [...gallery.querySelectorAll('[data-step]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let animation;
  const wrap = index => (index + items.length) % items.length;
  gallery.dataset.count = items.length;

  function setImage(image, item) {
    if (image.getAttribute('src') !== item.image) image.src = item.image;
  }

  function render(index, step = 0) {
    const item = items[index];
    const canSwitch = items.length > 1;
    setImage(main, item);
    main.alt = item.name;
    main.parentElement.href = item.href;
    caption.href = item.href;
    caption.textContent = item.name;
    if (canSwitch) setImage(left, items[wrap(index - 1)]);
    if (items.length > 2) setImage(right, items[wrap(index + 1)]);
    left.hidden = !canSwitch;
    right.hidden = items.length < 3;
    arrows.forEach(button => { button.hidden = !canSwitch; });
    if (animation) animation.cancel();
    if (step && !motion.matches && main.animate) {
      animation = main.animate([
        {opacity: .55, transform: `translateX(${step * 14}px)`},
        {opacity: 1, transform: 'translateX(0)'}
      ], {duration: 240, easing: 'ease-out'});
    }
    current = index;
  }

  arrows.forEach(button => button.addEventListener('click', () => {
    const step = Number(button.dataset.step);
    render(wrap(current + step), step);
  }));
  gallery.addEventListener('keydown', event => {
    if (items.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    render(wrap(current + step), step);
  });
  render(0);
})();
