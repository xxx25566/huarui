const products=[
{name:'4刃钨钢铣刀',en:'4-FLUTE END MILL',image:'44.webp',video:{src:'assets/video/4flute.mp4',poster:'assets/video/4flute-poster.webp'},kind:'四刃结构',shape:'平底刃型',purpose:'平面、侧壁与轮廓铣削',description:'四刃螺旋，勾勒利落轮廓。平底刃型与连续螺旋刃线，服务于平面和侧壁的加工需求。',points:['四刃螺旋结构','平底端刃形态','直柄装夹设计'],group:'milling'},
{name:'3刃锥度铣刀',en:'3-FLUTE TAPERED END MILL',image:'55.webp',kind:'三刃结构',shape:'锥度刃型',purpose:'斜面与锥度轮廓加工',description:'以渐变的刀身，回应有角度的轮廓。三刃锥度形态，为带斜度的加工区域提供选型方向。',points:['三刃螺旋结构','锥度刀头形态','直柄装夹设计'],group:'shaping'},
{name:'2刃锥度球刀',en:'2-FLUTE TAPERED BALL NOSE',image:'11.webp',kind:'双刃结构',shape:'锥度球头',purpose:'曲面细修与立体轮廓加工',description:'让曲面的过渡，更从容。球头与锥度刀身相接，适用于需要关注曲面细节的选型场景。',points:['双刃螺旋结构','圆弧球头形态','锥度刀身设计'],group:'shaping'},
{name:'2刃倒角刀',en:'2-FLUTE CHAMFER MILL',image:'22.webp',kind:'双刃结构',shape:'尖端倒角',purpose:'孔口、边缘倒角与修边',description:'收好每一道边缘。尖端刃型清晰呈现，为孔口和工件边缘的倒角工序提供选择。',points:['双刃结构','尖端倒角形态','直柄装夹设计'],group:'finishing'},
{name:'玉米铣刀',en:'CORN END MILL',image:'33.webp',kind:'密集多齿',shape:'交错齿形',purpose:'多齿铣削与轮廓加工',description:'细密交错的齿形，形成鲜明的切削表面。针对具体工件材料与加工方式，进一步确认适配规格。',points:['交错密集齿形','柱状切削部位','直柄装夹设计'],group:'milling'}
];
let selected=0;
const siteLocale = window.huaruiLocale;
const localizeUi = siteLocale?.localize ?? (value => value);
const collection=document.getElementById('collection');
collection.innerHTML=`<div class="collection-toolbar"><div class="filters" role="group" aria-label="按加工类型筛选"><button class="filter active" data-filter="all" aria-pressed="true">全部系列</button><button class="filter" data-filter="milling" aria-pressed="false">铣削加工</button><button class="filter" data-filter="shaping" aria-pressed="false">成型加工</button><button class="filter" data-filter="finishing" aria-pressed="false">倒角修边</button></div></div><div class="product-grid">${products.map((p,i)=>`<button id="product-card-${i}" class="product-card" data-product="${i}" data-group="${p.group}" aria-label="查看${p.name}详情"><div class="card-photo"><img src="assets/${p.image}" alt="${p.name}" loading="lazy" decoding="async"></div><div class="card-bottom"><h3>${p.name}</h3><span class="card-open" aria-hidden="true">+</span></div></button>`).join('')}</div>`;
const lowerContent = document.getElementById('lower-content');
lowerContent.innerHTML=`<section class="precision-section" id="precision"><div class="precision-top"><h2>刀具细节</h2></div><div class="spotlight"><div class="spotlight-image"><div class="spec-line spec-left"></div><img id="spotlight-photo" src="assets/44.webp" alt="4刃钨钢铣刀" loading="lazy" decoding="async"><div class="spec-line spec-right"></div>
<div class="video-player spotlight-player" role="group" aria-label="刀具视频" hidden>
  <video class="spotlight-video" playsinline preload="none" disablepictureinpicture></video>
</div></div><div class="spotlight-copy"><div class="spotlight-tabs" role="group" aria-label="选择刀具">${products.map((p,i)=>`<button data-select="${i}" class="${i===0?'active':''}" aria-pressed="${i===0}" aria-label="查看${p.name}">${p.name.replace(/^[0-9]+刃/, '')}</button>`).join('')}</div><div id="spotlight-details" aria-live="polite"></div><button class="button light" id="detail-button">查看刀具详情 <span class="tiny-cross">+</span></button></div></div></section>
<section id="selection"></section>`;
siteLocale?.localizeTree(collection);
siteLocale?.localizeTree(lowerContent);
// Unless a different cover is requested, use the first frame of the source clip.
const spotlightPanel = document.querySelector('.spotlight-image');
const spotlightPhoto = document.getElementById('spotlight-photo');
const spotlightPlayer = spotlightPanel.querySelector('.spotlight-player');
const spotlightVideo = spotlightPlayer.querySelector('video');
function setupVideoPlayer(player) {
  const video = player.querySelector('video');
  player.insertAdjacentHTML('beforeend', `
  <button class="player-surface" type="button" aria-label="播放视频">
    <span class="player-center-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l12-7z"/></svg></span>
  </button>
  <div class="player-controls">
    <div class="player-toolbar">
      <button class="player-toggle" type="button" aria-label="播放视频"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="player-play-icon" d="M8 5v14l12-7z"/><path class="player-pause-icon" d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg></button>
      <button class="player-mute" type="button" aria-label="静音"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9z"/><path class="player-sound-icon" d="M15 8a5 5 0 0 1 0 8m2-10a8 8 0 0 1 0 12"/><path class="player-muted-icon" d="m16 9 5 6m0-6-5 6"/></svg></button>
      <button class="player-fullscreen" type="button" aria-label="全屏"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button>
    </div>
    <input class="player-seek" type="range" min="0" max="1000" value="0" aria-label="播放进度" disabled>
  </div>
  `);
  siteLocale?.localizeTree(player);
  const playerSurface = player.querySelector('.player-surface');
  const playerToggle = player.querySelector('.player-toggle');
  const playerMute = player.querySelector('.player-mute');
  const playerFullscreen = player.querySelector('.player-fullscreen');
  const playerSeek = player.querySelector('.player-seek');
  let playerControlsTimer;

  function updatePlayerControls() {
    const playing = !video.paused && !video.ended;
    const playLabel = localizeUi(playing ? '暂停视频' : '播放视频');
    const muted = video.muted;
    const duration = video.duration;
    const canSeek = Number.isFinite(duration) && duration > 0;
    const progress = canSeek ? video.currentTime / duration : 0;
    player.classList.toggle('is-playing', playing);
    player.classList.toggle('is-muted', muted);
    playerSurface.setAttribute('aria-label', playLabel);
    playerToggle.setAttribute('aria-label', playLabel);
    playerMute.setAttribute('aria-label', localizeUi(muted ? '取消静音' : '静音'));
    playerSeek.disabled = !canSeek;
    playerSeek.value = Math.round(progress * 1000);
    playerSeek.style.setProperty('--progress', `${progress * 100}%`);
  }

  function togglePlayerPlayback() {
    if (video.paused || video.ended) {
      if (!video.hasAttribute('src') && video.dataset.src) video.src = video.dataset.src;
      video.play().catch(() => updatePlayerControls());
    } else {
      video.pause();
    }
  }

  playerSurface.addEventListener('click', togglePlayerPlayback);
  playerToggle.addEventListener('click', togglePlayerPlayback);
  playerMute.addEventListener('click', () => { video.muted = !video.muted; });
  playerSeek.addEventListener('input', () => {
    video.currentTime = video.duration * Number(playerSeek.value) / 1000;
    updatePlayerControls();
  });
  for (const event of ['play', 'pause', 'ended', 'timeupdate', 'durationchange', 'volumechange', 'emptied']) {
    video.addEventListener(event, updatePlayerControls);
  }

  playerFullscreen.hidden = !document.fullscreenEnabled;
  playerFullscreen.addEventListener('click', () => {
    const action = document.fullscreenElement === player
      ? document.exitFullscreen() : player.requestFullscreen();
    action.catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement === player ? '退出全屏' : '全屏';
    playerFullscreen.setAttribute('aria-label', localizeUi(label));
  });

  player.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    player.classList.add('show-controls');
    clearTimeout(playerControlsTimer);
  });
  player.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    playerControlsTimer = setTimeout(() => player.classList.remove('show-controls'), 3000);
  });
  player.addEventListener('pointercancel', () => player.classList.remove('show-controls'));

  video.addEventListener('play', () => {
    for (const other of document.querySelectorAll('.video-player > video')) {
      if (other !== video && !other.paused) other.pause();
    }
  });
}

document.querySelectorAll('.video-player').forEach(setupVideoPlayer);

function showSpotlightVideo(show) {
  spotlightPanel.classList.toggle('has-video', show);
  spotlightPhoto.hidden = show;
  spotlightPlayer.hidden = !show;
  if (!show) spotlightPlayer.classList.remove('show-controls');
}

let spotlightNearby = !('IntersectionObserver' in window);
if (!spotlightNearby) {
  const spotlightObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    spotlightNearby = true;
    if (spotlightVideo.dataset.poster) spotlightVideo.poster = spotlightVideo.dataset.poster;
    spotlightObserver.disconnect();
  }, { rootMargin: '240px 0px' });
  spotlightObserver.observe(spotlightPanel);
}

function updateSpotlightMedia(product) {
  spotlightPhoto.src = 'assets/' + product.image;
  spotlightPhoto.alt = localizeUi(product.name);
  const media = product.video;
  if (media && spotlightVideo.dataset.src !== media.src) {
    spotlightVideo.pause();
    spotlightVideo.dataset.src = media.src;
    spotlightVideo.dataset.poster = media.poster;
    if (spotlightNearby) spotlightVideo.poster = media.poster;
    spotlightPlayer.setAttribute('aria-label', localizeUi(product.name + '视频'));
  }
  if (!media && spotlightVideo.dataset.src) {
    spotlightVideo.pause();
    if (spotlightVideo.hasAttribute('src')) {
      spotlightVideo.removeAttribute('src');
      spotlightVideo.load();
    }
    spotlightVideo.removeAttribute('poster');
    delete spotlightVideo.dataset.src;
    delete spotlightVideo.dataset.poster;
  }
  showSpotlightVideo(Boolean(media) && !spotlightVideo.error);
}
spotlightVideo.addEventListener('error', () => showSpotlightVideo(false));

function updateSpotlight(i){selected=i;const p=products[i];updateSpotlightMedia(p);const details=document.getElementById('spotlight-details');details.innerHTML=`<h3>${p.name}</h3><p>${p.description}</p><dl><div><dt>刀刃结构</dt><dd>${p.kind}</dd></div><div><dt>刀头形态</dt><dd>${p.shape}</dd></div><div><dt>选型方向</dt><dd>${p.purpose}</dd></div></dl>`;siteLocale?.localizeTree(details);document.querySelectorAll('[data-select]').forEach(b=>{const active=Number(b.dataset.select)===i;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)})}
updateSpotlight(0);
document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>updateSpotlight(Number(b.dataset.select))));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(f=>{f.classList.toggle('active',f===b);f.setAttribute('aria-pressed',f===b)});document.querySelectorAll('.product-card').forEach(card=>{const show=b.dataset.filter==='all'||card.dataset.group===b.dataset.filter;card.hidden=!show})}));
const dialog=document.getElementById('product-dialog');let dialogOpener;
function showProduct(i){dialogOpener=document.activeElement;const p=products[i];dialog.innerHTML=`<button class="dialog-close" aria-label="关闭详情"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M6 18 18 6"/></svg></button><div class="dialog-photo"><img src="assets/${p.image}" alt="${p.name}实拍细节"><button class="dialog-zoom" aria-pressed="false">放大刀头</button></div><div class="dialog-copy"><h2 id="dialog-title">${p.name}</h2><small>${p.en}</small><p>${p.description}</p><ul>${p.points.map(v=>`<li>${v}</li>`).join('')}</ul><div class="dialog-note">选型前请确认工件材料、刀具尺寸与设备条件。刀具实际规格以产品资料为准。</div><button class="button primary dialog-explore">查看选型指南</button></div>`;siteLocale?.localizeTree(dialog);dialog.showModal();document.body.classList.add('modal-open');dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.querySelector('.dialog-zoom').addEventListener('click',function(){const zoom=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',zoom);this.textContent=localizeUi(zoom?'查看完整刀具':'放大刀头');dialog.querySelector('.dialog-photo').classList.toggle('zoomed',zoom)});dialog.querySelector('.dialog-explore').addEventListener('click',()=>{dialog.close();document.getElementById('selection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})})}
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');dialogOpener?.focus({preventScroll:true})});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
document.querySelectorAll('[data-product]').forEach(b=>b.addEventListener('click',()=>showProduct(Number(b.dataset.product))));document.getElementById('detail-button').addEventListener('click',()=>showProduct(selected));
document.getElementById('year').textContent=new Date().getFullYear();
