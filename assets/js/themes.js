const THEMES=[{id:"theme-1",name:"MVGM",href:"assets/css/themes/theme-1.css"}];
function populateThemeSelect(el){el.innerHTML=THEMES.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}
function setTheme(id){const t=THEMES.find(x=>x.id===id)||THEMES[0];document.getElementById('themeStylesheet').setAttribute('href',t.href)}
window.addEventListener('DOMContentLoaded',()=>{const sel=document.getElementById('theme');populateThemeSelect(sel);sel.addEventListener('change',e=>setTheme(e.target.value));setTheme(THEMES[0].id);});