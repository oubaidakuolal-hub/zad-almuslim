'use strict';

/* ============ Toast ============ */
function showToast(msg){
  let el = document.getElementById('toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> el.classList.remove('show'), 2400);
}

/* ============ الوضع الليلي ============ */
(function(){
  const btn = document.getElementById('themeToggle');
  function applyTheme(dark){
    document.body.classList.toggle('dark', dark);
    if(btn) btn.textContent = dark ? '☀️' : '🌙';
    try { localStorage.setItem('zad_theme', dark ? 'dark' : 'light'); } catch {}
  }
  let saved = null;
  try { saved = localStorage.getItem('zad_theme'); } catch {}
  if(!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    saved = 'dark';
  }
  applyTheme(saved === 'dark');
  if(btn){
    btn.addEventListener('click', ()=>{
      applyTheme(!document.body.classList.contains('dark'));
    });
  }
})();

/* ============ قائمة الموبايل ============ */
(function(){
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if(!btn || !links) return;
  btn.addEventListener('click', ()=> links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> links.classList.remove('open'));
  });
})();

/* ============ نسخ ============ */
async function copyText(text){
  if(navigator.clipboard && window.isSecureContext){
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if(!ok) throw new Error('copy failed');
}

/* ============ استماع ============ */
function speak(text){
  if(!('speechSynthesis' in window)){
    showToast('⚠️ المتصفح لا يدعم النطق');
    return;
  }
  if(!text || !text.trim()) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const arabic = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  u.rate = 0.85;
  if(arabic) u.voice = arabic;
  u.onerror = () => showToast('⚠️ تعذّر التشغيل');
  u.onstart = () => showToast('🔊 جارٍ الاستماع…');
  window.speechSynthesis.speak(u);
}

/* ============ مشاركة ============ */
async function shareContent(data){
  if(navigator.share){
    try { await navigator.share(data); } catch {}
  } else {
    try {
      await copyText(data.url || data.text || '');
      showToast('تم نسخ الرابط ✓');
    } catch { showToast('تعذّرت المشاركة'); }
  }
}

/* ============ العدّادات ============ */
const STORAGE_KEY = 'zad_counts_v2';
function loadCounts(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveCounts(c){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}

/* ============ زر العودة للأعلى ============ */
(function(){
  let btn = document.getElementById('backToTop');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.textContent = '↑';
    btn.setAttribute('aria-label','العودة إلى الأعلى');
    document.body.appendChild(btn);
  }
  window.addEventListener('scroll', ()=>{
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.addEventListener('click', ()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============ الشعار (بديل عند الفشل) ============ */
document.querySelectorAll('.brand img').forEach(img=>{
  img.addEventListener('error', function(){
    if(this.dataset.fb === 'true') return;
    this.dataset.fb = 'true';
    this.style.display = 'none';
    const span = document.createElement('span');
    span.className = 'brand-fallback';
    span.textContent = 'ز';
    this.insertAdjacentElement('afterend', span);
  }, { once: true });
});

console.log('✅ app.js loaded successfully');
