(() => {
  const languages = [
    ['zh-CN', '简体中文', 'cn'],
    ['en', 'English', 'gb'],
    ['de', 'Deutsch', 'de'],
    ['fr', 'Français', 'fr'],
    ['es', 'Español', 'es'],
    ['ja', '日本語', 'jp'],
    ['vi', 'Tiếng Việt', 'vn'],
  ];
  const base = new URL('.', document.currentScript.src);
  const storageKey = 'huarui-language';
  const locationUrl = new URL(location.href);
  const requested = locationUrl.searchParams.get('lang');
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch {}
  const active = languages.find(([id]) => id === requested)
    || languages.find(([id]) => id === saved) || languages[0];
  const [language] = active;
  try { localStorage.setItem(storageKey, language); } catch {}
  document.documentElement.lang = language;

  const translations = window.huaruiTranslations?.[language];
  const text = (source, values = {}) => (translations && Object.hasOwn(translations, source) ? translations[source] : source)
    .replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key]) : token);

  function localize(value) {
    const trimmed = value.trim();
    if (!translations || !/\p{Script=Han}/u.test(trimmed)) return value;
    if (Object.hasOwn(translations, trimmed)) return value.replace(trimmed, translations[trimmed]);
    const specificationCount = trimmed.match(/^(\d+) 种规格$/);
    if (specificationCount) return value.replace(trimmed, text('{count} 种规格', { count: specificationCount[1] }));
    for (const [pattern, key] of [
      [/^查看(.+?)详情$/, '查看{item}详情'],
      [/^查看(.+)$/, '查看{item}'],
      [/^切换到(.+)$/, '切换到{item}'],
      [/^(.+?)实拍(?:细节)?$/, '{item}实拍'],
      [/^(.+?)视频$/, '{item}视频'],
      [/^当前展示：(.+)$/, '当前展示：{item}'],
      [/^拖动调整(.+)$/, '拖动调整{item}'],
      [/^移除(.+)$/, '移除{item}'],
    ]) {
      const match = trimmed.match(pattern);
      if (match && Object.hasOwn(translations, match[1])) return value.replace(trimmed, text(key, { item: text(match[1]) }));
    }
    const pieces = trimmed.split(' · ');
    if (pieces.length > 1) return value.replace(trimmed, pieces.map(piece => text(piece)).join(' · '));
    return value;
  }

  function localizedUrl(href, id = language) {
    const url = new URL(href, location.href);
    url.searchParams.set('lang', id);
    return url.href;
  }

  function linkLanguage(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.hasAttribute('download')) return;
    const url = new URL(href, location.href);
    if (url.origin === base.origin && url.protocol === base.protocol &&
        url.pathname.startsWith(base.pathname) && /(?:\/|\.html)$/i.test(url.pathname) &&
        !url.searchParams.has('lang') && (language !== 'zh-CN' || requested === language)) {
      link.href = localizedUrl(url);
    }
  }

  const attributes = ['alt', 'aria-label', 'placeholder', 'title'];
  const excluded = 'script,style,textarea,[data-language-picker]';
  function localizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.closest(excluded)) {
        const next = localize(node.data);
        if (next !== node.data) node.data = next;
      }
      return;
    }
    if (!(node instanceof Element) || node.closest(excluded)) return;
    if (node.matches('a[href]')) linkLanguage(node);
    for (const attribute of attributes) {
      const current = node.getAttribute(attribute);
      if (current === null) continue;
      const next = localize(current);
      if (next !== current) node.setAttribute(attribute, next);
    }
  }

  function localizeTree(root) {
    if (!root) return;
    localizeNode(root);
    const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (tree.nextNode()) localizeNode(tree.currentNode);
  }

  function flag(country) {
    const icon = document.createElement('img');
    icon.className = 'language-flag';
    icon.alt = '';
    icon.width = 20;
    icon.height = 14;
    icon.src = new URL('assets/flags/' + country + '.svg', base);
    return icon;
  }

  const label = document.querySelector('.nav-language');
  if (label) {
    const picker = document.createElement('details');
    picker.className = 'nav-language language-picker';
    picker.dataset.languagePicker = '';
    const trigger = document.createElement('summary');
    trigger.setAttribute('aria-label', text('切换网站语言') + ' · ' + active[1]);
    trigger.append(flag(active[2]), document.createTextNode(active[1]));
    const options = document.createElement('ul');
    options.className = 'language-options';
    for (const [id, name, country] of languages) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = localizedUrl(locationUrl, id);
      link.lang = id;
      link.hreflang = id;
      if (id === language) link.setAttribute('aria-current', 'true');
      link.append(flag(country), document.createTextNode(name));
      item.append(link);
      options.append(item);
    }
    picker.append(trigger, options);
    label.replaceWith(picker);
    picker.addEventListener('toggle', () => {
      if (!picker.open) return;
      for (const link of options.querySelectorAll('a')) {
        link.href = localizedUrl(location.href, link.hreflang);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!picker.contains(event.target)) picker.open = false;
    });
    picker.addEventListener('keydown', event => {
      if (event.key === 'Escape' && picker.open) {
        event.stopPropagation();
        picker.open = false;
        trigger.focus();
      }
    });
  }

  if (translations) {
    document.title = localize(document.title);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = text(description.content);
    const numberFormat = new Intl.NumberFormat(language);
    for (const element of document.querySelectorAll('.company-stat-number[data-count]')) {
      if (element.dataset.count === '18,000') element.dataset.count = numberFormat.format(18000);
      if (element.dataset.count === '10' && language !== 'ja') element.dataset.count = numberFormat.format(100000);
      element.textContent = element.dataset.count;
    }
    if (language === 'ja') document.querySelector('.company-stat:last-child .company-stat-unit')?.remove();
  }
  window.huaruiLocale = { language, text, localize, localizeTree };
  localizeTree(document.body);
})();
