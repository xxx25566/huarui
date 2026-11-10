(() => {
  'use strict';
  // Starting values adapted from the supplied selector. Actual cutting conditions
  // remain editable; calculations always use the user's visible input values.
  const materials = [
    { id: 'hard-steel', title: '模具钢 / 淬硬钢', sub: 'HRC 45–65 · P20 / SKD11', vc: 115, range: '90–140', coating: 'AlTiSiN', cooling: '油雾 / 高压风冷', factor: .9 },
    { id: 'stainless', title: '不锈钢 / 钛合金', sub: 'SUS304 / 316L / 钛合金', vc: 75, range: '60–95', coating: 'AlCrN', cooling: '高压乳化液', factor: .85 },
    { id: 'aluminum', title: '铝 / 铜合金', sub: '6061 / 7075 / 紫铜', vc: 280, range: '220–350', coating: 'DLC / 无涂层', cooling: 'MQL / 充分排屑', factor: 1.35 },
    { id: 'composite', title: '复合材料', sub: 'CFRP / PCB / 玻纤', vc: 180, range: '140–240', coating: '金刚石类涂层', cooling: '干式风冷 + 集尘', factor: 1.1 },
    { id: 'carbon-steel', title: '碳钢 / 合金钢', sub: '45#钢 / 40Cr / 球墨铸铁', vc: 150, range: '120–185', coating: 'TiSiN', cooling: '风冷 / 乳化液', factor: 1.05 },
    { id: 'plastic', title: '工程塑料 / 板材', sub: 'PEEK / 电木 / 精密木模', vc: 240, range: '180–320', coating: '镜面抛光 / DLC', cooling: '洁净冷风排屑', factor: 1.25 }
  ];
  const features = [
    { id: 'taper-wall', title: '斜面与深腔侧壁', sub: '拔模斜度 · 锥度轮廓', series: '锥度铣刀', name: '3刃锥度铣刀', code: 'HR-TPM', image: '55.png', product: 1, D: 6, Z: 3, fz: .039, desc: '锥度刀身对应带斜度的侧壁与成型轮廓，选型时进一步确认单边角度、刃长与悬伸。' },
    { id: '3d-ball', title: '曲面与立体精修', sub: '浮雕细节 · 曲面过渡', series: '锥度球刀', name: '2刃锥度球刀', code: 'HR-TBM', image: '11.png', product: 2, D: 3, Z: 2, fz: .028, desc: '球头与锥度刀身适合关注曲面过渡的加工需求，球刀计算请使用实际接触处的有效切削直径。' },
    { id: 'flat-slot', title: '平面与型腔开槽', sub: '台阶平面 · 侧壁轮廓', series: '钨钢铣刀', name: '4刃钨钢铣刀', code: 'HR-CEM', image: '44.png', product: 0, D: 10, Z: 4, fz: .055, desc: '平底端刃与螺旋刃线对应平面、侧壁和轮廓铣削，按工件材料与排屑条件确认具体规格。' },
    { id: 'corn-rough', title: '板材切边与开粗', sub: '交错齿形 · 多齿切削', series: '玉米铣刀', name: '玉米铣刀', code: 'HR-CORN', image: '33.png', product: 4, D: 8, Z: 10, fz: .040, desc: '密集交错齿形提供多齿切削方向。刃数 Z 应按实际有效切削刃数填写，并结合板材与排屑方式确认。' }
  ];
  const presets = [
    { id: 'taper', name: '锥度铣刀', sub: '侧壁精铣', feature: 0, D: 6, Vc: 120, Z: 3, fz: .035 },
    { id: 'carbide', name: '钨钢铣刀', sub: '平面铣削', feature: 2, D: 10, Vc: 140, Z: 4, fz: .055 },
    { id: 'ball', name: '锥度球刀', sub: '曲面精修', feature: 1, D: 3, Vc: 160, Z: 2, fz: .025 },
    { id: 'corn', name: '玉米铣刀', sub: '板材开粗', feature: 3, D: 8, Vc: 180, Z: 10, fz: .040 }
  ];
  const fields = [
    { key: 'D', label: '有效切削直径', symbol: 'D', unit: 'mm', min: .5, max: 25, step: .1, ticks: [.5, 6, 12, 25], format: n => n % 1 ? String(n) : n.toFixed(1) },
    { key: 'Vc', label: '切削线速度', symbol: 'Vc', unit: 'm/min', min: 30, max: 350, step: 1, ticks: [30, 120, 240, 350], format: String },
    { key: 'Z', label: '有效切削刃数', symbol: 'Z', unit: '刃', min: 1, max: 12, step: 1, ticks: [2, 3, 4, 12], format: String },
    { key: 'fz', label: '每齿进给量', symbol: 'fz', unit: 'mm/z', min: .005, max: .15, step: .001, ticks: [.005, .035, .075, .15], format: n => n.toFixed(3) }
  ];
  function calculate(params) {
    const { D, Vc, Z, fz } = params;
    if (![D, Vc, Z, fz].every(n => Number.isFinite(n) && n > 0) || !Number.isInteger(Z)) return null;
    const exactRpm = 1000 * Vc / (Math.PI * D);
    return { rpm: Math.round(exactRpm), feed: Math.round(exactRpm * Z * fz) };
  }
  function getMatch(materialIndex, featureIndex) {
    const material = materials[materialIndex], feature = features[featureIndex];
    if (!material || !feature) return null;
    const originalDefault = materialIndex === 0 && featureIndex === 0;
    return { material, feature, params: { D: feature.D, Vc: originalDefault ? 120 : material.vc, Z: feature.Z, fz: originalDefault ? .035 : Math.min(.15, Math.max(.005, Math.round(feature.fz * material.factor * 200) / 200)) } };
  }
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined') module.exports = { calculate, getMatch, materials, features, presets, fields };
    return;
  }
  const section = document.getElementById('selection');
  if (!section) return;
  const locale = window.huaruiLocale;
  const translate = locale?.text ?? ((source, values = {}) =>
    source.replace(/\{(\w+)\}/g, (token, key) => values[key] ?? token));
  const icon = name => {
    const paths = { arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', bag: '<rect x="4" y="7" width="16" height="14" rx="4"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>', check: '<path d="m6 12 4 4 8-8"/>', copy: '<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M15 4H7a3 3 0 0 0-3 3v8"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3"/>', trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>', plus: '<path d="M12 5v14M5 12h14"/>' };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const storageKey = 'huarui-inquiry-list';
  const state = { material: 0, feature: 0, preset: 'taper', calc: { D: 6, Vc: 120, Z: 3, fz: .035 }, calcFeature: 0, calcMatchKey: '', source: '锥度铣刀 · 示例预设', inquiries: [], form: { name: '', contact: '', notes: '' } };
  try { const stored = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(stored)) state.inquiries = stored.filter(item => item && typeof item.title === 'string').slice(0, 10); } catch {}
  const numberFormat = new Intl.NumberFormat(locale?.language || 'zh-CN');
  const tickLabel = (field, value) => field.key === 'D' ? `Ø${value}` : field.key === 'fz' ? String(value) : String(value);
  section.className = 'tool-workbench';
  section.innerHTML = `
    <div class="wb-shell">
      <div class="wb-section-heading">
        <h2>选型与切削参数</h2>
        <button type="button" class="wb-inquiry-trigger" data-wb-action="inquiry">${icon('bag')}我的询价单<span id="wb-inquiry-count">0</span></button>
      </div>
      <div class="wb-grid">
        <article class="wb-panel wb-selector" aria-labelledby="wb-selector-title">
          <div class="wb-panel-heading"><h3 id="wb-selector-title">刀具选型</h3></div>
          <div class="wb-group-heading"><h4>工件材料</h4></div>
          <div class="wb-material-grid" role="group" aria-label="选择工件材料">${materials.map((m, i) => `<button type="button" class="wb-choice" data-wb-material="${i}" aria-pressed="${i === 0}"><span class="wb-choice-check">${icon('check')}</span><strong>${m.title}</strong><small>${m.sub}</small></button>`).join('')}</div>
          <div class="wb-group-heading wb-feature-heading"><h4>加工形态</h4></div>
          <div class="wb-feature-grid" role="group" aria-label="选择加工形态">${features.map((f, i) => `<button type="button" class="wb-choice" data-wb-feature="${i}" aria-pressed="${i === 0}"><span class="wb-choice-check">${icon('check')}</span><strong>${f.title}</strong><small>${f.sub}</small></button>`).join('')}</div>
          <div class="wb-recommendation">
            <div class="wb-recommend-main"><div class="wb-tool-photo"><img id="wb-match-image" src="assets/55.png" alt="3刃锥度铣刀"></div><div class="wb-recommend-copy"><p class="wb-recommend-label">建议关注</p><h4 id="wb-match-title"></h4><p id="wb-match-desc"></p><button type="button" class="wb-link" data-wb-action="match-product">近看刀具细节 ${icon('arrow')}</button></div></div>
            <dl class="wb-match-specs"><div><dt>涂层方向</dt><dd id="wb-match-coating"></dd></div><div><dt>冷却 / 排屑</dt><dd id="wb-match-cooling"></dd></div><div><dt>参考线速度</dt><dd><span id="wb-match-vc"></span><small> m/min</small></dd></div></dl>
            <div class="wb-match-actions"><button type="button" class="wb-primary" data-wb-action="apply">带入计算器 ${icon('arrow')}</button><button type="button" class="wb-secondary" data-wb-action="add">${icon('plus')} 加入询价单</button></div>
          </div>
        </article>
        <article class="wb-panel wb-calculator" aria-labelledby="wb-calculator-title">
          <div class="wb-panel-heading"><h3 id="wb-calculator-title">参数计算</h3></div>
          <div class="wb-group-heading"><h4>快速预设</h4><button type="button" class="wb-reset" data-wb-action="reset">重置参数</button></div>
          <div class="wb-preset-grid" role="group" aria-label="选择参数预设">${presets.map(p => `<button type="button" data-wb-preset="${p.id}" aria-pressed="${p.id === state.preset}"><strong>${p.name}</strong><small>${p.sub}</small></button>`).join('')}</div>
          <div class="wb-fields">${fields.map(f => `<div class="wb-field"><div class="wb-field-heading"><label for="wb-number-${f.key}">${f.label}</label><span>${f.symbol}</span></div><div class="wb-number-line"><input type="number" id="wb-number-${f.key}" data-wb-number="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.format(state.calc[f.key])}" inputmode="decimal" aria-describedby="wb-parameter-message"><span>${f.unit}</span></div><input type="range" data-wb-range="${f.key}" aria-label="拖动调整${f.label}" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.calc[f.key]}"><div class="wb-ticks">${f.ticks.map(n => `<button type="button" data-wb-tick="${f.key}" data-value="${n}" aria-label="${escape(translate('{item}设为{value}{unit}', { item: translate(f.label), value: n, unit: translate(f.unit) }))}">${tickLabel(f, n)}</button>`).join('')}</div></div>`).join('')}</div>
          <p class="wb-parameter-message" id="wb-parameter-message" aria-live="polite"></p>
          <div class="wb-result" id="wb-result"><div class="wb-result-heading"><span>计算结果</span><button type="button" class="wb-icon-link" data-wb-action="copy">${icon('copy')}复制</button></div><div class="wb-results-grid" aria-live="polite" aria-atomic="true"><div><p>主轴转速 <span>S</span></p><div class="wb-result-value"><strong id="wb-out-rpm">6,366</strong><span>rpm</span></div></div><div><p>进给速度 <span>F</span></p><div class="wb-result-value wb-feed"><strong id="wb-out-feed">668</strong><span>mm/min</span></div></div></div><div class="wb-result-footer"><span id="wb-calc-source"></span><button type="button" class="wb-link" data-wb-action="calc-product">查看对应刀具 ${icon('arrow')}</button></div></div>
          <details class="wb-method"><summary>计算方式与参数说明 <span>+</span></summary><div><p><b>S = 1000 × Vc ÷ (π × D)</b><br><b>F = S × Z × fz</b></p><p>D 为实际接触处的有效切削直径；Z 为有效切削刃数。球刀与交错齿刀具请按实际工况填写。进给量使用未取整的转速计算，结果取整显示。</p></div></details>
        </article>
      </div>
      <div class="wb-footnote"><p>预设与推荐参数为选型起点，请结合工件硬度、刀具规格、悬伸与设备上限调整后试切。</p><button type="button" class="wb-link" data-wb-action="custom">整理非标定制需求 ${icon('arrow')}</button></div>
    </div>`;
  locale?.localizeTree(section);
  const inquiryDialog = document.createElement('dialog');
  inquiryDialog.className = 'wb-inquiry-dialog';
  inquiryDialog.setAttribute('aria-labelledby', 'wb-inquiry-title');
  document.body.appendChild(inquiryDialog);
  const toast = document.createElement('div');
  toast.className = 'wb-feedback'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  let toastTimer, inquiryOpener;
  function notify(text) { clearTimeout(toastTimer); toast.textContent = translate(text); toast.classList.add('is-visible'); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800); }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state.inquiries)); } catch { notify('已保留在本次页面中，可下载询价单。'); } updateInquiryCount(); }
  function updateInquiryCount() { section.querySelector('#wb-inquiry-count').textContent = state.inquiries.length; }
  function animate(element) { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) element.animate([{ opacity: .5, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' }); }
  function renderMatch(motion = false) {
    const match = getMatch(state.material, state.feature);
    section.querySelectorAll('[data-wb-material]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.wbMaterial === state.material)));
    section.querySelectorAll('[data-wb-feature]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.wbFeature === state.feature)));
    const image = section.querySelector('#wb-match-image'); image.src = 'assets/' + match.feature.image; image.alt = translate(match.feature.name);
    section.querySelector('#wb-match-title').textContent = translate(match.feature.name);
    section.querySelector('#wb-match-desc').textContent = translate(match.feature.desc);
    section.querySelector('#wb-match-coating').textContent = translate(match.material.coating);
    section.querySelector('#wb-match-cooling').textContent = translate(match.material.cooling);
    section.querySelector('#wb-match-vc').textContent = match.material.range;
    if (motion) animate(section.querySelector('.wb-recommend-main'));
  }
  function validField(field) { const value = state.calc[field.key]; return Number.isFinite(value) && value >= field.min && value <= field.max && (field.key !== 'Z' || Number.isInteger(value)); }
  function currentResult() { return fields.every(validField) ? calculate(state.calc) : null; }
  function renderCalculator(activeNumber) {
    fields.forEach(field => {
      const valid = validField(field), number = section.querySelector(`[data-wb-number="${field.key}"]`), range = section.querySelector(`[data-wb-range="${field.key}"]`);
      number.setAttribute('aria-invalid', String(!valid));
      number.closest('.wb-field').classList.toggle('has-error', !valid);
      if (activeNumber !== field.key) number.value = Number.isFinite(state.calc[field.key]) ? field.format(state.calc[field.key]) : '';
      if (valid) { range.value = state.calc[field.key]; range.style.setProperty('--wb-progress', `${100 * (state.calc[field.key] - field.min) / (field.max - field.min)}%`); }
    });
    const result = currentResult(), invalid = fields.find(field => !validField(field));
    section.querySelector('#wb-out-rpm').textContent = result ? numberFormat.format(result.rpm) : '—';
    section.querySelector('#wb-out-feed').textContent = result ? numberFormat.format(result.feed) : '—';
    section.querySelector('#wb-parameter-message').textContent = invalid
      ? translate(invalid.key === 'Z' ? '{item}请输入 {min}–{max} {unit}的整数。' : '{item}请输入 {min}–{max} {unit}。', {
        item: translate(invalid.label), min: invalid.min, max: invalid.max, unit: translate(invalid.unit),
      })
      : translate('支持直接输入，也可以拖动调节。');
    section.querySelector('#wb-parameter-message').classList.toggle('has-error', !!invalid);
    section.querySelector('#wb-calc-source').textContent = state.source.split(' · ').map(part => translate(part)).join(' · ');
    section.querySelector('[data-wb-action="copy"]').disabled = !result;
    section.querySelectorAll('[data-wb-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.wbPreset === state.preset)));
  }
  function setPreset(id) {
    const preset = presets.find(p => p.id === id); if (!preset) return;
    state.calc = { D: preset.D, Vc: preset.Vc, Z: preset.Z, fz: preset.fz }; state.preset = preset.id; state.calcFeature = preset.feature; state.calcMatchKey = ''; state.source = `${preset.name} · 示例预设`;
    renderCalculator(); animate(section.querySelector('.wb-result'));
  }
  function applyMatch() {
    const match = getMatch(state.material, state.feature);
    state.calc = { ...match.params }; state.preset = ''; state.calcFeature = state.feature; state.calcMatchKey = `${state.material}:${state.feature}`; state.source = `${match.feature.series} · ${match.material.title}`;
    renderCalculator(); animate(section.querySelector('.wb-result')); notify('已带入所选工况的参考参数。');
  }
  function addInquiry() {
    const match = getMatch(state.material, state.feature), useCurrent = state.calcMatchKey === `${state.material}:${state.feature}` && currentResult();
    const params = { ...(useCurrent ? state.calc : match.params) }, result = calculate(params);
    const item = { id: `wb-${Date.now()}`, code: match.feature.code, title: match.feature.name, mat: match.material.title, feat: match.feature.title, coating: match.material.coating, cooling: match.material.cooling, featureId: match.feature.id, image: match.feature.image, product: match.feature.product, ...params, ...result, parameterSource: useCurrent ? '当前工况计算参数' : '选型参考参数', time: new Date().toISOString() };
    const key = entry => [entry.title, entry.mat, entry.feat, entry.D, entry.Vc, entry.Z, entry.fz].join('|');
    const previous = state.inquiries.findIndex(entry => key(entry) === key(item));
    if (previous !== -1) state.inquiries.splice(previous, 1);
    state.inquiries.unshift(item); state.inquiries = state.inquiries.slice(0, 10); persist();
    notify(previous === -1 ? '已加入询价单，可在“我的询价单”中查看。' : '这组工况已在询价单中更新。');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const field = document.createElement('textarea'); field.value = text; field.style.cssText = 'position:fixed;left:-9999px;top:0'; (inquiryDialog.open ? inquiryDialog : document.body).appendChild(field); field.select();
    let copied = false; try { copied = document.execCommand('copy'); } catch {} field.remove(); return copied;
  }
  function calculatorText() {
    const result = currentResult(); if (!result) return '';
    return [
      translate('桦锐 · 转速与进给计算'),
      state.source.split(' · ').map(part => translate(part)).join(' · '),
      `D = ${state.calc.D} mm | Vc = ${state.calc.Vc} m/min | Z = ${state.calc.Z} | fz = ${state.calc.fz} mm/z`,
      `${translate('主轴转速')} S = ${result.rpm} rpm`,
      `${translate('进给速度')} F = ${result.feed} mm/min`,
      translate('参数为选型参考，实际加工前请结合刀具、工件与设备条件确认。'),
    ].join('\n');
  }
  function openProduct(index) { if (typeof window.showProduct === 'function') window.showProduct(index); }
  function renderInquiry() {
    inquiryDialog.innerHTML = `<div class="wb-inquiry-head"><div><p class="wb-kicker">HUARUI / INQUIRY</p><h2 id="wb-inquiry-title">把需求，整理清楚。</h2><p>${state.inquiries.length ? translate('已保存 {count} 组工况 · 仅保存在本机浏览器', { count: state.inquiries.length }) : '选择刀具加入询价单，或直接填写非标需求。'}</p></div><button type="button" class="wb-close" aria-label="关闭询价单">${icon('close')}</button></div><div class="wb-inquiry-body"><div class="wb-inquiry-items">${state.inquiries.length ? state.inquiries.map((item, index) => `<article class="wb-inquiry-item"><div class="wb-inquiry-photo"><img src="assets/${['11.png', '22.png', '33.png', '44.png', '55.png'].includes(item.image) ? item.image : features.find(feature => item.title.includes(feature.series))?.image || '44.png'}" alt="${escape(item.title)}"></div><div class="wb-inquiry-item-copy"><h3>${escape(item.title)}</h3><p>${escape(item.mat)} · ${escape(item.feat)}</p><small>D ${escape(item.D)} mm · Vc ${escape(item.Vc)} m/min · Z ${escape(item.Z)} · fz ${escape(item.fz)} mm/z</small><span>S ${escape(numberFormat.format(item.rpm || 0))} rpm · F ${escape(numberFormat.format(item.feed || 0))} mm/min</span></div><button type="button" class="wb-remove" data-wb-remove="${index}" aria-label="移除${escape(item.title)}">${icon('trash')}</button></article>`).join('') : `<div class="wb-inquiry-empty">${icon('bag')}<strong>给下一次加工，留一份清单。</strong><p>工况、刀型与参数会一起保存，方便进一步沟通。</p></div>`}</div><div class="wb-inquiry-form"><div><label for="wb-customer-name">您的称呼 <span>选填</span></label><input id="wb-customer-name" data-wb-form="name" autocomplete="name" placeholder="姓名或公司名称" value="${escape(state.form.name)}"></div><div><label for="wb-customer-contact">联系方式 <span>选填</span></label><input id="wb-customer-contact" data-wb-form="contact" autocomplete="off" placeholder="电话、微信或邮箱" value="${escape(state.form.contact)}"></div><div class="wb-form-notes"><label for="wb-customer-notes">加工与定制需求 <span>选填</span></label><textarea id="wb-customer-notes" data-wb-form="notes" rows="3" placeholder="例如：工件材质与硬度、刀径、刃长、锥度、数量……">${escape(state.form.notes)}</textarea></div></div><p class="wb-inquiry-note">导出或复制后，可将询价内容发送给桦锐进一步确认规格。</p></div><div class="wb-inquiry-footer"><button type="button" class="wb-secondary" data-wb-export="copy">${icon('copy')}复制询价内容</button><button type="button" class="wb-primary" data-wb-export="download">${icon('download')}下载询价单</button></div>`;
    locale?.localizeTree(inquiryDialog);
    inquiryDialog.querySelector('.wb-close').addEventListener('click', () => inquiryDialog.close());
    inquiryDialog.querySelectorAll('[data-wb-remove]').forEach(button => button.addEventListener('click', () => { const index = +button.dataset.wbRemove; state.inquiries.splice(index, 1); persist(); renderInquiry(); const next = inquiryDialog.querySelectorAll('[data-wb-remove]'); (next[Math.min(index, next.length - 1)] || inquiryDialog.querySelector('.wb-close')).focus({ preventScroll: true }); }));
    inquiryDialog.querySelectorAll('[data-wb-form]').forEach(input => input.addEventListener('input', () => { state.form[input.dataset.wbForm] = input.value; }));
    inquiryDialog.querySelector('[data-wb-export="copy"]').addEventListener('click', async () => { if (!hasInquiryContent()) return; notify(await copyText(inquiryText()) ? '询价内容已复制。' : '暂时无法复制，请下载询价单。'); });
    inquiryDialog.querySelector('[data-wb-export="download"]').addEventListener('click', () => { if (!hasInquiryContent()) return; const url = URL.createObjectURL(new Blob(['\ufeff' + inquiryText()], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${translate('桦锐刀具询价单')}-${new Date().toISOString().slice(0, 10)}.txt`; inquiryDialog.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('询价单已生成。'); });
  }
  function hasInquiryContent() { if (state.inquiries.length || state.form.notes.trim()) return true; notify('请先加入一组工况，或填写加工与定制需求。'); inquiryDialog.querySelector('#wb-customer-notes').focus(); return false; }
  function inquiryText() {
    const empty = translate('待补充');
    const setups = state.inquiries.map((item, index) => [
      `${index + 1}. ${translate(item.title)}`,
      `${translate('工件')}: ${translate(item.mat || '')}`,
      `${translate('工序')}: ${translate(item.feat || '')}`,
      `${translate('涂层方向')}: ${translate(item.coating || '')}`,
      `D = ${item.D} mm | Vc = ${item.Vc} m/min | Z = ${item.Z} | fz = ${item.fz} mm/z`,
      `S = ${item.rpm} rpm | F = ${item.feed} mm/min`,
      translate(item.parameterSource || '参考参数'),
      '',
    ].join('\n'));
    return [
      translate('桦锐 · 刀具选型询价单'),
      `${translate('客户称呼')}: ${state.form.name || empty}`,
      `${translate('联系方式')}: ${state.form.contact || empty}`,
      '',
      ...setups,
      translate('加工与定制需求：'),
      state.form.notes || empty,
      '',
      translate('参数为选型参考，具体规格、材料适用性与加工条件请进一步确认。'),
    ].join('\n');
  }
  function openInquiry(custom = false) { inquiryOpener = document.activeElement; renderInquiry(); inquiryDialog.showModal(); document.body.classList.add('modal-open'); if (custom) inquiryDialog.querySelector('#wb-customer-notes').focus(); }
  inquiryDialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) { document.body.classList.remove('modal-open'); inquiryOpener?.focus({ preventScroll: true }); } });
  inquiryDialog.addEventListener('click', event => { if (event.target !== inquiryDialog) return; const rect = inquiryDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) inquiryDialog.close(); });
  section.addEventListener('click', async event => {
    const materialButton = event.target.closest('[data-wb-material]'); if (materialButton) { state.material = +materialButton.dataset.wbMaterial; renderMatch(true); return; }
    const featureButton = event.target.closest('[data-wb-feature]'); if (featureButton) { state.feature = +featureButton.dataset.wbFeature; renderMatch(true); return; }
    const presetButton = event.target.closest('[data-wb-preset]'); if (presetButton) { setPreset(presetButton.dataset.wbPreset); return; }
    const tick = event.target.closest('[data-wb-tick]'); if (tick) { state.calc[tick.dataset.wbTick] = +tick.dataset.value; state.preset = ''; renderCalculator(); return; }
    const button = event.target.closest('[data-wb-action]'); if (!button) return;
    switch (button.dataset.wbAction) {
      case 'apply': applyMatch(); break;
      case 'add': addInquiry(); break;
      case 'inquiry': openInquiry(); break;
      case 'custom': openInquiry(true); break;
      case 'reset': setPreset('taper'); notify('已恢复锥度铣刀示例参数。'); break;
      case 'copy': if (currentResult()) notify(await copyText(calculatorText()) ? '转速与进给参数已复制。' : '当前浏览器无法复制，请选取结果后复制。'); break;
      case 'match-product': openProduct(features[state.feature].product); break;
      case 'calc-product': openProduct(features[state.calcFeature].product); break;
    }
  });
  section.querySelectorAll('[data-wb-number]').forEach(input => input.addEventListener('input', () => { state.calc[input.dataset.wbNumber] = input.value === '' ? NaN : Number(input.value); state.preset = ''; renderCalculator(input.dataset.wbNumber); }));
  section.querySelectorAll('[data-wb-range]').forEach(input => input.addEventListener('input', () => { state.calc[input.dataset.wbRange] = Number(input.value); state.preset = ''; renderCalculator(); }));
  renderMatch(); renderCalculator(); updateInquiryCount();
})();
