// Reference-style full-width navigation with pointer and keyboard support.
(()=>{
 const header=document.querySelector('.header'),nav=header.querySelector('.main-navigation'),toggle=header.querySelector('.menu-button'),items=[...nav.querySelectorAll('.has-mega')];let closeTimer,openTimer,suppressFocus=false;
 const desktop=()=>matchMedia('(min-width:701px)').matches;
 function setExpanded(item,expanded){item.querySelectorAll(':scope > [aria-controls]').forEach(control=>control.setAttribute('aria-expanded',String(expanded)))}
 function closeMenus(){clearTimeout(closeTimer);clearTimeout(openTimer);items.forEach(item=>{item.classList.remove('is-open');setExpanded(item,false);item.querySelector('.mega-panel').inert=true})}
 function openMenu(item){closeMenus();item.classList.add('is-open');setExpanded(item,true);item.querySelector('.mega-panel').inert=false}
 nav.querySelectorAll('.nav-item').forEach(item=>{
  const link=item.querySelector('.nav-link'),hasPanel=item.classList.contains('has-mega');
  item.addEventListener('pointerenter',event=>{if(event.pointerType==='touch'||!desktop())return;clearTimeout(closeTimer);clearTimeout(openTimer);if(hasPanel)openTimer=setTimeout(()=>openMenu(item),90);else closeMenus()});
  item.addEventListener('pointerleave',()=>{if(!desktop())return;clearTimeout(openTimer);closeTimer=setTimeout(closeMenus,210)});
  item.addEventListener('focusin',()=>{if(desktop()&&!suppressFocus){if(hasPanel)openMenu(item);else closeMenus()}});
  item.addEventListener('focusout',event=>{if(desktop()&&!item.contains(event.relatedTarget))closeMenus()});
  link.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&hasPanel){event.preventDefault();openMenu(item);item.querySelector('.mega-links a').focus()}});
  item.querySelector('.product-category-toggle')?.addEventListener('click',()=>{if(item.classList.contains('is-open'))closeMenus();else openMenu(item)});
  link.addEventListener('click',event=>{if(!desktop()&&hasPanel&&!item.querySelector('.product-category-toggle')){event.preventDefault();const opened=item.classList.contains('is-open');closeMenus();if(!opened)openMenu(item)}else{closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})
 });
 nav.querySelectorAll('.mega-links a').forEach(link=>link.addEventListener('click',()=>{closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
 toggle.addEventListener('click',()=>{const opened=toggle.getAttribute('aria-expanded')!=='true';closeMenus();nav.classList.toggle('open',opened);toggle.setAttribute('aria-expanded',String(opened))});
 header.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const link=header.querySelector('.nav-item.is-open>.nav-link');closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');suppressFocus=true;link?.focus();suppressFocus=false});
 document.addEventListener('pointerdown',event=>{if(!header.contains(event.target)){closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
})();
// Motion decorates the controls; content and keyboard actions work without it.
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
let heroSelected=0;
const heroVisual=document.querySelector('.hero-visual');
const heroTrack=document.getElementById('hero-carousel-track');
const heroTools=[...heroTrack.querySelectorAll('.carousel-tool')];
const heroStatus=heroVisual.querySelector('.hero-carousel-status');
const wrapHero=index=>(index+products.length)%products.length;
// Warm the remaining carousel images after the first screen has loaded.
window.addEventListener('load', () => {
  const prefetch = () => {
    const shown = new Set(heroTools.map(tool => Number(tool.dataset.index)));
    products.forEach((product, index) => {
      if (shown.has(index)) return;
      const image = new Image();
      image.fetchPriority = 'low';
      image.src = 'assets/' + product.image;
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(prefetch);
  else setTimeout(prefetch, 1000);
}, { once: true });

function changeHero(index){
  if(index===heroSelected)return;
  const delta=wrapHero(index-heroSelected);
  const direction=delta<=products.length/2?1:-1;
  const adjacent=delta===1||delta===products.length-1;
  const slots=['left','center','right'];
  const targets=[wrapHero(index-1),index,wrapHero(index+1)];
  const previous=new Map(heroTools.map(tool=>{
    const box=tool.getBoundingClientRect();
    return [+tool.dataset.index,{tool,x:box.left+box.width/2,scale:box.width/tool.offsetWidth,opacity:+getComputedStyle(tool).opacity}];
  }));
  const available=heroTools.filter(tool=>!targets.includes(+tool.dataset.index));
  heroTools.forEach(tool=>tool.getAnimations().forEach(animation=>animation.cancel()));
  const offset=Math.min(heroTrack.clientWidth*.075,60)*direction;
  const layout=targets.map((target,i)=>{
    const old=previous.get(target),tool=old?.tool||available.shift(),slot=slots[i];
    if(!old){
      const image=tool.querySelector('img');
      image.src='assets/'+products[target].image;
      image.alt=localizeUi(products[target].name+'实拍');
      tool.dataset.index=target;
    }
    tool.dataset.slot=slot;
    return {tool,old,slot};
  });
  if(!motionQuery.matches)layout.forEach(({tool,old,slot})=>{
    const box=tool.getBoundingClientRect();
    const main=slot==='center';
    const scale=main?1:.73,opacity=main?1:.58;
    const x=adjacent&&old?old.x-(box.left+box.width/2):offset;
    const fromScale=adjacent&&old?old.scale:scale*.96;
    const fromOpacity=adjacent&&old?old.opacity:opacity*.76;
    tool.animate([
      {transform:`translate(${x}px,0) translate(-50%,-50%) scale(${fromScale})`,opacity:fromOpacity},
      {transform:`translate(-50%,-50%) scale(${scale})`,opacity}
    ],{duration:adjacent?510:370,easing:'cubic-bezier(.22,1,.36,1)'});
  });
  heroSelected=index;
  heroStatus.textContent=localizeUi('当前展示：'+products[index].name);
  document.dispatchEvent(new CustomEvent('hero:change',{detail:{index}}));
}

heroVisual.querySelector('.hero-arrow-prev').addEventListener('click',()=>changeHero(wrapHero(heroSelected-1)));
heroVisual.querySelector('.hero-arrow-next').addEventListener('click',()=>changeHero(wrapHero(heroSelected+1)));
function heroKey(event){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const index=event.key==='Home'?0:event.key==='End'?products.length-1:wrapHero(heroSelected+(event.key==='ArrowRight'?1:-1));
  changeHero(index);
}
heroVisual.addEventListener('keydown',heroKey);

document.querySelectorAll('.product-card').forEach(card=>card.addEventListener('pointermove',event=>{if(!finePointer.matches||motionQuery.matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--light-x',event.clientX-r.left+'px');card.style.setProperty('--light-y',event.clientY-r.top+'px');}));
let scrollScheduled=false;
function updateScroll(){scrollScheduled=false;const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.reading-progress').style.transform='scaleX('+(max>0?Math.min(scrollY/max,1):0)+')';}
addEventListener('scroll',()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});addEventListener('resize',updateScroll);updateScroll();
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('will-reveal');entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -25px 0px'});
document.querySelectorAll('.section-heading,.product-card,.precision-top,.spotlight').forEach(element=>{element.classList.add('reveal-item');if(!motionQuery.matches&&element.getBoundingClientRect().top>innerHeight){element.classList.add('will-reveal');revealObserver.observe(element);}});
function animateContent(element){if(motionQuery.matches)return;element.getAnimations().forEach(a=>a.cancel());element.animate([{opacity:.4,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}
document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>{animateContent(spotlightPanel.querySelector(':scope > :is(img, .spotlight-player):not([hidden])'));animateContent(document.getElementById('spotlight-details'));}));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>document.querySelectorAll('.product-card:not([hidden])').forEach(card=>{card.classList.remove('will-reveal');card.classList.add('is-visible');revealObserver.unobserve(card);animateContent(card);})));
motionQuery.addEventListener('change',()=>{if(motionQuery.matches){document.querySelectorAll('.will-reveal').forEach(e=>e.classList.remove('will-reveal'));document.getAnimations().forEach(a=>a.cancel());}});
