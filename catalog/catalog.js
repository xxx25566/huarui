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
  if (!rows.length) return;

  const dimensionFields = ['diameter', 'edge', 'shank', 'length'];
  const labelOrder = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

  function dimensionNumber(value) {
    const match = normalize(value).normalize('NFKC').match(/^(?:[døφ⌀]\s*)?(\d+(?:\.\d+)?|\.\d+)(?:\s*(?:[dl]|mm))?$/u);
    return match ? Number(match[1]) : Infinity;
  }

  function compareNumbers(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  function compareCodes(a, b) {
    const parts = code => normalize(code).match(/\d+(?:\.\d+)?|[^\d]+/g) || [];
    const left = parts(a), right = parts(b);
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const result = /^\d/.test(left[i]) && /^\d/.test(right[i])
        ? compareNumbers(Number(left[i]), Number(right[i])) : labelOrder.compare(left[i], right[i]);
      if (result) return result;
    }
    return left.length - right.length || labelOrder.compare(a, b);
  }

  const sizes = new Map(rows.map(row => {
    const parts = normalize(row.code).split(/[*×x]/);
    const key = dimensionFields.map((field, index) => {
      const value = dimensionNumber(row[field]);
      return value === Infinity && parts.length === 4 ? dimensionNumber(parts[index]) : value;
    });
    return [row, key];
  }));
  rows.sort((a, b) => {
    const left = sizes.get(a), right = sizes.get(b);
    for (let i = 0; i < dimensionFields.length; i++) {
      const result = compareNumbers(left[i], right[i]);
      if (result) return result;
    }
    return compareCodes(a.code, b.code);
  });
  const columns = [
    ['code', '规格编号'], ['details', '规格名称'], ['diameter', '刀径'],
    ['edge', '刃长'], ['length', '总长'], ['shank', '柄径'],
    ['coating', '涂层'], ['price', '售价']
  ].filter(([key]) => rows.some(row => row[key]));
  const collapsedCount = 12;
  let expanded = false;
  let selected;
  const photo = document.querySelector('.detail-photo');
  const cover = photo.querySelector('img')?.getAttribute('src') || '';
  const specSearch = el('spec-search');
  const diameter = el('diameter');
  const body = el('spec-body');
  const expansion = document.createElement('div');
  expansion.className = 'spec-expansion';
  expansion.hidden = true;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', body.id);
  expansion.append(toggle);
  el('pager')?.remove();
  body.closest('.table-scroll').after(expansion);
  const diameters = Array.from(new Set(rows.map(row => row.diameter).filter(Boolean)));
  diameters.sort((a, b) => compareNumbers(dimensionNumber(a), dimensionNumber(b)) || compareCodes(a, b));
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
    const source = row.image || cover;
    if (source) {
      let image = photo.querySelector('img');
      if (!image) {
        image = document.createElement('img');
        image.decoding = 'async';
        photo.replaceChildren(image);
      }
      if (image.getAttribute('src') !== source) image.src = source;
      image.alt = el('product-name').textContent + ' ' + row.code;
    }
    if (updateLink) history.replaceState(null, '', '#sku=' + encodeURIComponent(row.code));
    for (const button of el('spec-body').querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.textContent === row.code));
    }
  }

  function render() {
    const term = normalize(specSearch.value);
    const filtered = rows.filter(row => (!diameter.value || row.diameter === diameter.value) &&
      (normalize(row.legacyCode).includes(term) ||
        columns.some(([key]) => normalize(row[key]).includes(term) || (row[key] && normalize(translate(row[key])).includes(term)))));
    body.replaceChildren();
    for (const row of expanded ? filtered : filtered.slice(0, collapsedCount)) {
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
    expansion.hidden = filtered.length <= collapsedCount;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = translate(expanded ? '收起规格' : '展开全部规格');
  }
  specSearch.addEventListener('input', render);
  diameter.addEventListener('change', render);
  toggle.addEventListener('click', () => {
    const previousScroll = window.scrollY;
    expanded = !expanded;
    render();
    if (expanded) window.scrollTo({ top: previousScroll, behavior: 'instant' });
    else toggle.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
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
  const matchIndex = rows.findIndex(row => row.code === initial || row.legacyCode === initial);
  expanded = matchIndex >= collapsedCount;
  choose(rows[Math.max(0, matchIndex)], false);
  render();
})();
