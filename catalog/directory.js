(() => {
  const search = document.getElementById('catalog-search');
  const title = document.getElementById('catalog-result-title');
  const count = document.getElementById('catalog-result-count');
  const empty = document.getElementById('no-products');
  const emptyMessage = document.getElementById('catalog-empty-message');
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const byId = new Map(filters.map(button => [button.dataset.categoryFilter, button]));
  const groups = filters.filter(button => button.hasAttribute('aria-controls'));
  const cards = [...document.querySelectorAll('.directory-card')];
  const url = new URL(location.href);
  const locale = window.huaruiLocale;
  const text = locale?.text ?? ((source, values = {}) => source.replace('{count}', values.count ?? ''));
  const number = new Intl.NumberFormat(locale?.language ?? 'zh-CN');
  let category = byId.has(url.searchParams.get('category')) ? url.searchParams.get('category') : 'all';

  const normalize = value => value.normalize('NFKC').trim().toLocaleLowerCase();

  function groupFor(button) {
    return button.hasAttribute('aria-controls') ? button : byId.get(button.dataset.parentCategory);
  }

  function showGroup(group) {
    for (const item of groups) {
      const open = item === group;
      item.setAttribute('aria-expanded', String(open));
      document.getElementById(item.getAttribute('aria-controls')).hidden = !open;
    }
  }

  function render() {
    const term = normalize(search.value);
    const current = byId.get(category);
    title.textContent = current.querySelector('span').textContent;
    let matches = 0;
    for (const card of cards) {
      const subcategory = card.dataset.category;
      const parent = byId.get(subcategory)?.dataset.parentCategory;
      const name = card.querySelector('h3').textContent;
      const inCategory = category === 'all' || category === parent || category === subcategory;
      const inSearch = normalize(name).includes(term) || normalize(card.dataset.name ?? '').includes(term);
      card.hidden = !inCategory || !inSearch;
      if (!card.hidden) matches++;
    }
    count.textContent = text('{count} 件商品', { count: number.format(matches) });
    empty.hidden = matches > 0;
    emptyMessage.textContent = text(term ? '没有匹配的商品。' : '此分类暂无商品');
    for (const button of filters) {
      button.setAttribute('aria-pressed', String(button === current));
      button.classList.toggle('has-active-child', button.dataset.categoryFilter === current.dataset.parentCategory);
    }
  }

  function select(button) {
    const id = button.dataset.categoryFilter;
    const group = groupFor(button);
    if (group) {
      const close = category === id && group === button && group.getAttribute('aria-expanded') === 'true';
      showGroup(close ? null : group);
    }
    category = id;
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    history.replaceState(null, '', url);
    render();
  }

  for (const button of filters) button.addEventListener('click', () => select(button));
  search.addEventListener('input', render);
  document.getElementById('catalog-reset').addEventListener('click', () => {
    search.value = '';
    const all = byId.get('all');
    select(all);
    all.focus();
  });
  if (category !== 'all') showGroup(groupFor(byId.get(category)));
  render();
})();
