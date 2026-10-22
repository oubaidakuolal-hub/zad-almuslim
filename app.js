/* ============================================================
   زاد عبيدة — الوظائف المشتركة
   ============================================================ */

'use strict';

/* ============ الشعار: بديل عند الفشل ============ */
(function initLogoFallback(){
  document.querySelectorAll('.brand img').forEach(img=>{
    img.addEventListener('error', function(){
      if(this.dataset.fallbackShown === 'true') return;
      this.dataset.fallbackShown = 'true';
      this.style.display = 'none';
      const span = document.createElement('span');
      span.className = 'brand-fallback';
      span.textContent = 'ز';
      this.insertAdjacentElement('afterend', span);
    }, { once: true });
  });
})();

/* ============ Toast ============ */
let toastTimer;
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
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove('show'), 2400);
}

/* ============ الوضع الليلي ============ */
(function initTheme(){
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
(function initMobileMenu(){
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if(!btn || !links) return;
  btn.addEventListener('click', ()=>{
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> links.classList.remove('open'));
  });
})();

/* ============ شريط التنقل النشط ============ */
(function initActiveNav(){
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    if(href === current || (current === 'index.html' && href === 'index.html')){
      a.classList.add('active');
    }
  });
})();

/* ============ زر العودة للأعلى ============ */
(function initBackToTop(){
  let btn = document.getElementById('backToTop');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label','العودة إلى الأعلى');
    btn.textContent = '↑';
    document.body.appendChild(btn);
  }
  window.addEventListener('scroll', ()=>{
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.addEventListener('click', ()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============ نسخ النص ============ */
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

/* ============ الاستماع (Text-to-Speech) ============ */
let arabicVoice = null;
let voicesReady = false;
function loadVoices(){
  if(!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  arabicVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar')) || null;
  voicesReady = voices.length > 0;
}
if('speechSynthesis' in window){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text){
  if(!('speechSynthesis' in window)){
    showToast('⚠️ المتصفح لا يدعم النطق');
    return;
  }
  if(!text || !text.trim()) return;
  window.speechSynthesis.cancel();
  if(!voicesReady || !arabicVoice) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  u.rate = 0.85;
  if(arabicVoice) u.voice = arabicVoice;
  u.onerror = (e)=>{
    if(e.error === 'not-allowed') showToast('⚠️ المتصفح منع التشغيل — انقر مرة أخرى');
    else showToast('⚠️ تعذّر التشغيل');
  };
  u.onstart = ()=> showToast('🔊 جارٍ الاستماع…');
  try { window.speechSynthesis.speak(u); }
  catch { showToast('⚠️ تعذّر التشغيل'); }
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

/* ============ العدّادات (localStorage) ============ */
const STORAGE_KEY = 'zad_counts_v2';
function loadCounts(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveCounts(c){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}
let globalCounts = loadCounts();

/* ============ مواقيت الصلاة ============ */
const PRAYER_LABELS = { Fajr:'الفجر', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
let countdownInterval = null;

function formatPrayerTime(t){
  const clean = String(t).split(' ')[0];
  const [h,m] = clean.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + String(m).padStart(2,'0') + ' ' + period;
}

function renderPrayerTimes(timings){
  const container = document.getElementById('prayerTimes');
  if(!container) return;
  container.className = '';
  container.replaceChildren();
  const ul = document.createElement('ul');
  ul.className = 'prayer-list';
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(k=>{
    const li = document.createElement('li');
    li.className = 'prayer-item';
    li.dataset.key = k;
    const name = document.createElement('span');
    name.textContent = PRAYER_LABELS[k];
    const time = document.createElement('strong');
    time.textContent = formatPrayerTime(timings[k]);
    li.append(name, time);
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

function startPrayerCountdown(timings){
  if(countdownInterval) clearInterval(countdownInterval);
  const el = document.getElementById('prayerCountdown');
  if(!el) return;
  const now = new Date();
  const arr = ['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(k=>{
    const [h,m] = String(timings[k]).split(' ')[0].split(':').map(Number);
    const d = new Date(now);
    d.setHours(h,m,0,0);
    return { k, date: d };
  });
  const next = arr.find(p => p.date > now);
  document.querySelectorAll('.prayer-item').forEach(li => li.classList.remove('active'));
  if(!next){
    el.textContent = 'انتهت صلوات اليوم — تقبّل الله 🌙';
    return;
  }
  const active = document.querySelector('.prayer-item[data-key="'+next.k+'"]');
  if(active) active.classList.add('active');
  const tick = ()=>{
    const diff = next.date - new Date();
    if(diff <= 0){
      el.textContent = 'حان وقت ' + PRAYER_LABELS[next.k] + ' 🕌';
      clearInterval(countdownInterval);
      return;
    }
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    el.textContent = 'متبقٍ لصلاة ' + PRAYER_LABELS[next.k] + ': ' +
      String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
  };
  tick();
  countdownInterval = setInterval(tick, 1000);
}

async function fetchPrayerTimes(lat, lng, city){
  const container = document.getElementById('prayerTimes');
  if(!container) return;
  container.className = 'loading';
  container.textContent = 'جارٍ تحميل المواقيت…';
  try {
    const url = (lat != null && lng != null)
      ? 'https://api.aladhan.com/v1/timings?latitude=' + lat + '&longitude=' + lng + '&method=3'
      : 'https://api.aladhan.com/v1/timingsByCity?city=' + encodeURIComponent(city || 'Algiers') + '&country=Algeria&method=3';
    const res = await fetch(url);
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    renderPrayerTimes(j.data.timings);
    startPrayerCountdown(j.data.timings);
  } catch(err) {
    container.className = '';
    container.textContent = 'تعذّر جلب المواقيت. تحقق من الاتصال.';
    console.warn(err);
  }
}

function locateUserForPrayer(){
  const container = document.getElementById('prayerTimes');
  if(!navigator.geolocation){
    if(container){ container.className=''; container.textContent='المتصفح لا يدعم الموقع — أدخل مدينتك.'; }
    return;
  }
  if(container){ container.className='loading'; container.textContent='جارٍ تحديد موقعك…'; }
  navigator.geolocation.getCurrentPosition(
    p => fetchPrayerTimes(p.coords.latitude, p.coords.longitude),
    () => {
      if(container){ container.className=''; container.textContent='تعذّر تحديد الموقع — أدخل مدينتك.'; }
    },
    { timeout: 8000 }
  );
}

/* تشغيل تلقائي إذا كانت العناصر موجودة */
if(document.getElementById('prayerTimes')){
  const cityBtn = document.getElementById('cityBtn');
  const geoBtn = document.getElementById('geoBtn');
  if(cityBtn){
    cityBtn.addEventListener('click', ()=>{
      const v = document.getElementById('cityInput')?.value.trim();
      if(v) fetchPrayerTimes(null, null, v);
    });
  }
  if(geoBtn) geoBtn.addEventListener('click', locateUserForPrayer);
  locateUserForPrayer();
}

/* ============ آية اليوم وحديث اليوم ============ */
function initDailyContent(){
  const ayahEl = document.getElementById('dailyAyah');
  const hadithEl = document.getElementById('dailyHadith');
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);

  if(ayahEl && typeof DAILY_AYAT !== 'undefined'){
    const a = DAILY_AYAT[day % DAILY_AYAT.length];
    ayahEl.innerHTML = '';
    const p = document.createElement('div');
    p.className = 'big';
    p.textContent = a.text;
    const s = document.createElement('div');
    s.className = 'src';
    s.textContent = a.src;
    ayahEl.append(p, s);
  }

  if(hadithEl && typeof NAWAWI_HADITHS !== 'undefined'){
    const h = NAWAWI_HADITHS[day % NAWAWI_HADITHS.length];
    hadithEl.innerHTML = '';
    const p = document.createElement('div');
    p.className = 'big';
    p.textContent = h.text.length > 220 ? h.text.slice(0, 220) + '…' : h.text;
    const s = document.createElement('div');
    s.className = 'src';
    s.textContent = h.title;
    hadithEl.append(p, s);
  }
}
initDailyContent();

/* ============ سورة الكهف يوم الجمعة ============ */
(function initKahf(){
  if(new Date().getDay() === 5){
    const k = document.getElementById('kahfCard');
    if(k) k.style.display = '';
  }
})();

/* ============ بحث شامل ============ */
function initGlobalSearch(){
  const input = document.getElementById('globalSearchInput');
  const results = document.getElementById('globalSearchResults');
  if(!input || !results) return;

  function buildIndex(){
    const idx = [];
    if(typeof ADHKAR !== 'undefined'){
      ADHKAR.forEach(z => {
        idx.push({
          type:'ذكر', title: z.title, text: z.text,
          url: 'adhkar.html#' + z.id
        });
      });
    }
    if(typeof NAWAWI_HADITHS !== 'undefined'){
      NAWAWI_HADITHS.forEach((h,i) => {
        idx.push({
          type:'حديث', title: h.title, text: h.text,
          url: 'nawawi.html#' + (i+1)
        });
      });
    }
    if(typeof ARTICLES !== 'undefined'){
      Object.keys(ARTICLES).forEach(k => {
        idx.push({
          type:'مقالة',
          title: ARTICLES[k].title,
          text: ARTICLES[k].body.replace(/<[^>]+>/g,' ').slice(0,200),
          url: 'articles.html#' + k
        });
      });
    }
    return idx;
  }

  function norm(v){
    return v.toLocaleLowerCase('ar').normalize('NFD')
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[أإآ]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ة/g,'ه')
      .trim();
  }

  const index = buildIndex();
  let timer;
  input.addEventListener('input', ()=>{
    clearTimeout(timer);
    timer = setTimeout(()=>{
      const q = norm(input.value);
      results.replaceChildren();
      if(q.length < 2) return;
      const matches = index.filter(it =>
        norm(it.title).includes(q) || norm(it.text).includes(q)
      ).slice(0, 10);
      if(!matches.length){
        const em = document.createElement('div');
        em.className = 'search-no-results';
        em.textContent = 'لا توجد نتائج';
        em.style.padding = '20px';
        em.style.textAlign = 'center';
        em.style.color = 'var(--text-muted)';
        results.appendChild(em);
        return;
      }
      matches.forEach(m => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--line);cursor:pointer';
        div.innerHTML = '<div style="font-weight:bold;color:var(--primary)">'
          + '<span style="background:var(--primary);color:#fff;padding:2px 8px;border-radius:6px;font-size:.7rem;margin-left:8px">' + m.type + '</span> '
          + m.title + '</div>'
          + '<div style="color:var(--text-muted);font-size:.9rem;margin-top:4px">'
          + (m.text.length > 100 ? m.text.slice(0,100) + '…' : m.text)
          + '</div>';
        div.addEventListener('click', ()=>{
          window.location.href = m.url;
        });
        results.appendChild(div);
      });
    }, 200);
  });

  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-box') && !e.target.closest('#globalSearchResults')){
      results.replaceChildren();
    }
  });
}
initGlobalSearch();

/* ============ الترجمة ============ */
function googleTranslateElementInit(){
  if(window.google?.translate && document.getElementById('google_translate_element')){
    new window.google.translate.TranslateElement(
      { pageLanguage:'ar', includedLanguages:'ar,en,fr', autoDisplay:false },
      'google_translate_element'
    );
  }
}
window.googleTranslateElementInit = googleTranslateElementInit;

function loadGT(){
  if(window._gtLoaded) return;
  window._gtLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.defer = true;
  document.body.appendChild(s);
}

function setTranslateCookie(lang){
  const v = lang === 'ar' ? '/ar/ar' : '/ar/' + lang;
  document.cookie = 'googtrans=' + v + ';path=/;max-age=31536000;SameSite=Lax';
  document.cookie = 'googtrans=' + v + ';path=/;domain=' + location.hostname + ';max-age=31536000;SameSite=Lax';
}

(function syncLanguage(){
  const sel = document.getElementById('siteLanguage');
  const status = document.getElementById('languageStatus');
  if(!sel) return;
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/ar\/(ar|en|fr)/);
  if(m) sel.value = m[1];
  document.documentElement.lang = sel.value;
  document.documentElement.dir = sel.value === 'ar' ? 'rtl' : 'ltr';
  if(sel.value !== 'ar') loadGT();
  sel.addEventListener('change', ()=>{
    const l = sel.value;
    if(status) status.textContent = l === 'ar' ? 'جارٍ الرجوع إلى العربية...' : 'جارٍ تطبيق الترجمة...';
    if(l === 'ar'){
      document.cookie = 'googtrans=;path=/;max-age=0';
      document.cookie = 'googtrans=;path=/;domain=' + location.hostname + ';max-age=0';
    } else {
      loadGT();
      setTranslateCookie(l);
    }
    setTimeout(()=> location.reload(), 300);
  });
})();

/* ============ خدمة العمل ============ */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    const sw = new URL('./sw.js', location.href).href;
    navigator.serviceWorker.register(sw, { scope: './' })
      .then(r => console.log('✅ SW:', r.scope))
      .catch(e => console.warn('⚠️ SW failed:', e.message));
  });
}

/* ============ تصدير للصفحات ============ */
window.ZadApp = {
  showToast, copyText, speak, shareContent,
  loadCounts, saveCounts,
  fetchPrayerTimes, locateUserForPrayer,
  PRAYER_LABELS, formatPrayerTime, startPrayerCountdown
};
