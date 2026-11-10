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
