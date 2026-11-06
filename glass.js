// Reference-style full-width navigation with pointer and keyboard support.
(()=>{
 const header=document.querySelector('.header'),nav=header.querySelector('.main-navigation'),toggle=header.querySelector('.menu-button'),items=[...nav.querySelectorAll('.has-mega')];let closeTimer,openTimer,suppressFocus=false;
 const desktop=()=>matchMedia('(min-width:701px)').matches;
 function closeMenus(){clearTimeout(closeTimer);clearTimeout(openTimer);items.forEach(item=>{item.classList.remove('is-open');item.querySelector('.nav-link').setAttribute('aria-expanded','false');item.querySelector('.mega-panel').inert=true})}
 function openMenu(item){closeMenus();item.classList.add('is-open');item.querySelector('.nav-link').setAttribute('aria-expanded','true');item.querySelector('.mega-panel').inert=false}
 nav.querySelectorAll('.nav-item').forEach(item=>{
  const link=item.querySelector('.nav-link'),hasPanel=item.classList.contains('has-mega');
  item.addEventListener('pointerenter',event=>{if(event.pointerType==='touch'||!desktop())return;clearTimeout(closeTimer);clearTimeout(openTimer);if(hasPanel)openTimer=setTimeout(()=>openMenu(item),90);else closeMenus()});
  item.addEventListener('pointerleave',()=>{if(!desktop())return;clearTimeout(openTimer);closeTimer=setTimeout(closeMenus,210)});
  item.addEventListener('focusin',()=>{if(desktop()&&!suppressFocus){if(hasPanel)openMenu(item);else closeMenus()}});
  item.addEventListener('focusout',event=>{if(desktop()&&!item.contains(event.relatedTarget))closeMenus()});
  link.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&hasPanel){event.preventDefault();openMenu(item);item.querySelector('.mega-links a').focus()}});
  link.addEventListener('click',event=>{if(!desktop()&&hasPanel){event.preventDefault();const opened=item.classList.contains('is-open');closeMenus();if(!opened)openMenu(item)}else{closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})
 });
 nav.querySelectorAll('.mega-links a').forEach(link=>link.addEventListener('click',()=>{closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
 toggle.addEventListener('click',()=>{const opened=toggle.getAttribute('aria-expanded')!=='true';closeMenus();nav.classList.toggle('open',opened);toggle.setAttribute('aria-expanded',String(opened))});
 header.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const link=header.querySelector('.nav-item.is-open>.nav-link');closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');suppressFocus=true;link?.focus();suppressFocus=false});
 document.addEventListener('pointerdown',event=>{if(!header.contains(event.target)){closeMenus();nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
})();
// Motion decorates the controls; content and keyboard actions work without it.
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('.product-card').forEach(card=>card.addEventListener('pointermove',event=>{if(!finePointer.matches||motionQuery.matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--light-x',event.clientX-r.left+'px');card.style.setProperty('--light-y',event.clientY-r.top+'px');}));
let scrollScheduled=false;
function updateScroll(){scrollScheduled=false;const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.reading-progress').style.transform='scaleX('+(max>0?Math.min(scrollY/max,1):0)+')';document.querySelector('.header').classList.toggle('is-scrolled',scrollY>35);if(scrollY<innerHeight*.55)document.querySelectorAll('.main-navigation .nav-link').forEach(a=>a.classList.toggle('active',a.hash==='#top'));}
addEventListener('scroll',()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});addEventListener('resize',updateScroll);updateScroll();
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('will-reveal');entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -25px 0px'});
document.querySelectorAll('.section-heading,.product-card,.precision-top,.spotlight,.selection-layout,.closing').forEach(element=>{element.classList.add('reveal-item');if(!motionQuery.matches&&element.getBoundingClientRect().top>innerHeight){element.classList.add('will-reveal');revealObserver.observe(element);}});
function animateContent(element){if(motionQuery.matches)return;element.getAnimations().forEach(a=>a.cancel());element.animate([{opacity:.4,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}
document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>{animateContent(document.getElementById('spotlight-photo'));animateContent(document.getElementById('spotlight-details'));}));
document.querySelectorAll('[data-process]').forEach(button=>button.addEventListener('click',()=>animateContent(document.querySelector('.recommendation'))));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>document.querySelectorAll('.product-card:not([hidden])').forEach(card=>{card.classList.remove('will-reveal');card.classList.add('is-visible');revealObserver.unobserve(card);animateContent(card);})));
motionQuery.addEventListener('change',()=>{if(motionQuery.matches){document.querySelectorAll('.will-reveal').forEach(e=>e.classList.remove('will-reveal'));document.getAnimations().forEach(a=>a.cancel());}});
