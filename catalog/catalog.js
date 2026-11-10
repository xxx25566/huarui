(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const translate = window.huaruiLocale?.text ?? ((source, values = {}) =>
    source.replace(/\{(\w+)\}/g, (token, key) => values[key] ?? token));
  const normalize = value => String(value || '').trim().toLocaleLowerCase();
  const search = el('catalog-search');
  if (search) {
    const cards = Array.from(document.querySelectorAll('[data-product]'));
    const category = el('catalog-category');
    function filterProducts() {
      const term = normalize(search.value);
      for (const card of cards) {
        card.hidden = !normalize(card.querySelector('h2').textContent).includes(term) ||
          Boolean(category?.value && card.dataset.category !== category.value);
      }
      el('no-products').hidden = cards.some(card => !card.hidden);
    }
    search.addEventListener('input', filterProducts);
    category?.addEventListener('change', filterProducts);
  }
  if (!el('spec-data')) return;

  const rows = JSON.parse(el('spec-data').textContent);
  const columns = [
    ['code', '规格编号'], ['details', '规格名称'], ['diameter', '刀径'],
    ['edge', '刃长'], ['length', '总长'], ['shank', '柄径'],
    ['coating', '涂层'], ['price', '售价']
  ].filter(([key]) => rows.some(row => row[key]));
  const pageSize = 24;
  let page = 0;
  let selected;
  const photo = document.querySelector('.detail-photo');
  const cover = photo.querySelector('img')?.getAttribute('src') || '';
  const specSearch = el('spec-search');
  const diameter = el('diameter');
  const diameters = Array.from(new Set(rows.map(row => row.diameter).filter(Boolean)));
  diameters.sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
  el('diameter-filter').hidden = diameters.length === 0;
  for (const value of diameters) diameter.add(new Option(value, value));

  const headings = document.createElement('tr');
  for (const [, label] of columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = translate(label);
    headings.append(th);
  }
  el('spec-head').append(headings);

  function choose(row, updateLink) {
    selected = row;
    el('selected').hidden = false;
    el('selected-code').textContent = row.code;
    el('selected-details').textContent = columns.slice(1)
      .filter(([key]) => row[key])
      .map(([key, label]) => translate(label) + ' ' + translate(row[key])).join(' · ');
    el('copy-status').textContent = '';
    photo.replaceChildren();
    if (row.image || cover) {
      const image = document.createElement('img');
      image.src = row.image || cover;
      image.alt = el('product-name').textContent + ' ' + row.code;
      photo.append(image);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'no-photo';
      placeholder.textContent = 'HUARUI';
      photo.append(placeholder);
    }
    if (updateLink) history.replaceState(null, '', '#sku=' + encodeURIComponent(row.code));
    for (const button of el('spec-body').querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.textContent === row.code));
    }
  }

  function render() {
    const term = normalize(specSearch.value);
    const filtered = rows.filter(row => (!diameter.value || row.diameter === diameter.value) &&
      columns.some(([key]) => normalize(row[key]).includes(term) || (row[key] && normalize(translate(row[key])).includes(term))));
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages - 1);
    const body = el('spec-body');
    body.replaceChildren();
    for (const row of filtered.slice(page * pageSize, (page + 1) * pageSize)) {
      const tr = document.createElement('tr');
      for (const [key] of columns) {
        const td = document.createElement('td');
        if (key === 'code') {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'spec-button';
          button.textContent = row.code;
          button.setAttribute('aria-pressed', String(selected === row));
          button.addEventListener('click', () => choose(row, true));
          td.append(button);
        } else td.textContent = row[key] ? translate(row[key]) : '—';
        tr.append(td);
      }
      body.append(tr);
    }
    el('result-count').textContent = filtered.length
      ? translate('找到 {count} 种规格', { count: filtered.length })
      : translate('没有匹配的规格。');
    el('pager').hidden = pages < 2;
    el('page-label').textContent = (page + 1) + ' / ' + pages;
    el('prev').disabled = page === 0;
    el('next').disabled = page >= pages - 1;
  }
  specSearch.addEventListener('input', () => { page = 0; render(); });
  diameter.addEventListener('change', () => { page = 0; render(); });
  el('prev').addEventListener('click', () => { page--; render(); });
  el('next').addEventListener('click', () => { page++; render(); });
  el('copy-spec').addEventListener('click', async () => {
    if (!selected) return;
    const value = [el('product-name').textContent, selected.code, el('selected-details').textContent].filter(Boolean).join(' / ');
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      el('copy-status').textContent = translate('已复制');
    } catch {
      window.prompt(translate('请复制以下询价规格'), value);
    }
  });
  const initial = new URLSearchParams(location.hash.slice(1)).get('sku');
  const matchIndex = rows.findIndex(row => row.code === initial);
  if (matchIndex >= 0) page = Math.floor(matchIndex / pageSize);
  choose(rows[Math.max(0, matchIndex)], false);
  render();
})();
