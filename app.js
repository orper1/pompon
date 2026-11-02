import { DOMAINS, ENCOURAGE, RETRY } from './data.js';
import { GAMES } from './games.js';
import * as Sync from './sync.js';

/* ============================== État ============================== */
const KEY = 'pompon.v1';
const defaults = () => ({
  child: 'Mon trésor',
  domains: {},
  time: {},
  drawings: [],
  settings: { voice: true, timer: 10, sync: { url: '', code: '' } },
  lock: null,
  updatedAt: 0,
});
export let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } }; } catch {}
  return defaults();
}
export function save(touch = true) {
  if (touch) state.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
const dom = (id) => state.domains[id] || (state.domains[id] = { level: 1, stars: 0, lessons: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const totalStars = () => Object.values(state.domains).reduce((a, d) => a + d.stars, 0);
function streak() {
  let n = 0; const d = new Date();
  while (true) { const k = d.toISOString().slice(0, 10); if ((state.time[k] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); } else break; if (n > 365) break; }
  return n;
}

/* ============================== Voix & sons ============================== */
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
  voice = vs.find(v => /am[ée]lie|aurelie|thomas|google.*fran/i.test(v.name)) || vs[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, opts = {}) {
  if (!state.settings.voice || !('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; if (voice) u.voice = voice;
    u.rate = opts.rate || 0.85; u.pitch = opts.pitch || 1.15;
    speechSynthesis.speak(u);
  } catch {}
}
let ac = null;
function tone(seq) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t0 = ac.currentTime;
    seq.forEach(([f, start, dur], i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + start);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      o.connect(g).connect(ac.destination); o.start(t0 + start); o.stop(t0 + start + dur + 0.05);
    });
  } catch {}
}
export const sfx = {
  tap: () => tone([[520, 0, .08]]),
  ok: () => tone([[523, 0, .12], [659, .1, .12], [784, .2, .2]]),
  ko: () => tone([[330, 0, .18], [294, .15, .25]]),
  win: () => tone([[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .35]]),
  chime: () => tone([[880, 0, .3], [660, .3, .3], [880, .6, .5]]),
};

/* ============================== Helpers ============================== */
const $ = (s, r = document) => r.querySelector(s);
export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const app = $('#app');
const mascotSVG = (cls = '') => `<svg class="mascot ${cls}" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="58" rx="38" ry="34" fill="#FFD7E2"/><path d="M20 40 L14 10 L40 30 Z M80 40 L86 10 L60 30 Z" fill="#FFD7E2"/><path d="M22 36 L18 16 L36 30 Z M78 36 L82 16 L64 30 Z" fill="#FF8FAB"/><circle cx="37" cy="58" r="4.5" fill="#4A3F55"/><circle cx="63" cy="58" r="4.5" fill="#4A3F55"/><circle cx="38.5" cy="56.5" r="1.5" fill="#fff"/><circle cx="64.5" cy="56.5" r="1.5" fill="#fff"/><path d="M47 66 L53 66 L50 70 Z" fill="#E8718F"/><path d="M44 72 Q50 77 56 72" stroke="#4A3F55" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="26" cy="68" r="5" fill="#FFB3C6" opacity=".8"/><circle cx="74" cy="68" r="5" fill="#FFB3C6" opacity=".8"/></svg>`;

function confetti() {
  const c = h('div', { class: 'confetti' });
  const colors = ['#FF8FAB', '#7BD389', '#7FB3FF', '#FFD166', '#B892FF', '#FFAB76'];
  for (let i = 0; i < 70; i++) c.append(h('i', { style: `left:${Math.random() * 100}%;background:${pick(colors)};animation-duration:${1.6 + Math.random() * 1.4}s;animation-delay:${Math.random() * .6}s;transform:rotate(${Math.random() * 360}deg)` }));
  document.body.append(c); setTimeout(() => c.remove(), 3500);
}
const overlay = $('#overlay');
export function sheet(content, { dismiss = true } = {}) {
  overlay.innerHTML = ''; overlay.hidden = false;
  overlay.append(h('div', { class: 'sheet' }, content));
  overlay.onclick = (e) => { if (dismiss && e.target === overlay) closeSheet(); };
}
export function closeSheet() { overlay.hidden = true; overlay.innerHTML = ''; }

/* ============================== Écran d'accueil ============================== */
function home() {
  window.speechSynthesis?.cancel?.();
  app.innerHTML = '';
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Coucou' : 'Bonsoir';
  const msg = `${hello} ${state.child} ! On joue à quoi aujourd'hui ?`;
  app.append(
    h('div', { class: 'topbar' },
      h('div', { html: mascotSVG('bounce') }),
      h('div', { class: 'who' }, h('div', { class: 'name' }, state.child), h('div', { class: 'sub' }, `${streak()} jour${streak() > 1 ? 's' : ''} de suite ☀️`)),
      h('span', { class: 'pill' }, '⭐ ', String(totalStars())),
      h('button', { class: 'lock', 'aria-label': 'Espace parents', onclick: () => gate(parent) }, '🔒'),
    ),
    h('div', { class: 'hello' },
      h('div', { class: 'bubble' }, msg),
      h('button', { class: 'speak', 'aria-label': 'Écouter', onclick: () => speak(msg) }, '🔊'),
    ),
    h('div', { class: 'path' }, DOMAINS.map(d => {
      const s = dom(d.id);
      return h('div', { class: 'node' },
        h('button', { class: 'disc', style: `--c:${d.color};--cd:${d.dark}`, onclick: () => { sfx.tap(); lesson(d.id); } }, d.emoji, h('span', { class: 'lvl' }, `niv. ${s.level}`)),
        h('div', { class: 'label' }, d.name),
        h('div', { class: 'stars' }, `⭐ ${s.stars}`),
      );
    })),
    h('button', { class: 'btn ghost gallery-link', onclick: gallery }, '🖼️ Mes dessins'),
  );
}

/* ============================== Moteur de leçon ============================== */
function lesson(id) {
  const d = DOMAINS.find(x => x.id === id);
  const s = dom(id);
  const exercises = GAMES[id].build(s.level);
  let i = 0, points = 0, missed = false, answered = false;
  app.innerHTML = '';
  document.documentElement.style.setProperty('--primary', d.color);
  document.documentElement.style.setProperty('--primary-d', d.dark);
  const bar = h('i');
  const promptEl = h('div', { class: 'prompt' });
  const stage = h('div', { class: 'stage' });
  const foot = h('div', { class: 'lesson-foot', hidden: true });
  app.append(
    h('div', { class: 'lesson-head' }, h('button', { class: 'close', 'aria-label': 'Quitter', onclick: () => { sfx.tap(); home(); } }, '✕'), h('div', { class: 'progress' }, bar)),
    promptEl, stage, foot,
  );
  speak(d.intro);

  function showFoot(kind, title, sub, btnLabel, action) {
    foot.hidden = false; foot.className = `lesson-foot ${kind}`; foot.innerHTML = '';
    foot.append(h('div', { class: 'inner', style: 'flex-direction:column' },
      h('div', { class: 'feedback' }, kind === 'ok' ? '🎉' : '🌱', h('div', {}, title, sub && h('small', {}, sub))),
      h('button', { class: `btn ${kind === 'ok' ? '' : 'orange'}`, onclick: action }, btnLabel)));
  }
  const ctx = {
    level: s.level, speak, sfx, state,
    ok(gain = 1) {
      if (answered) return; answered = true;
      if (!missed) points += gain;
      sfx.ok(); const t = pick(ENCOURAGE); speak(t);
      showFoot('ok', t, missed ? '' : `+${gain} ⭐`, 'Continuer', next);
    },
    ko({ final = false, msg } = {}) {
      if (answered) return;
      sfx.ko(); const t = msg || pick(RETRY); speak(t);
      if (final) { answered = true; showFoot('ko', t, 'Ce n’est pas grave.', 'Continuer', next); }
      else { missed = true; showFoot('ko', t, '', 'Réessayer', () => { foot.hidden = true; }); }
    },
  };
  function next() {
    i++; foot.hidden = true; answered = false; missed = false;
    if (i >= exercises.length) return finish();
    mount();
  }
  function mount() {
    bar.style.width = `${(i / exercises.length) * 100}%`;
    const ex = exercises[i];
    promptEl.innerHTML = ''; stage.innerHTML = '';
    for (let n = stage.nextSibling; n && n !== foot;) { const x = n; n = n.nextSibling; x.remove(); }
    promptEl.append(ex.prompt, h('button', { class: 'say', 'aria-label': 'Écouter', onclick: () => speak(ex.say || ex.prompt) }, '🔊'));
    ex.mount(stage, ctx);
    setTimeout(() => speak(ex.say || ex.prompt), 500);
  }
  function finish() {
    bar.style.width = '100%';
    const max = exercises.reduce((a, e) => a + (e.gain || 1), 0);
    const ratio = points / max;
    s.stars += points; s.lessons++;
    if (ratio >= 0.8) s.level = Math.min(s.level + 1, 9);
    save(); syncPush();
    sfx.win(); confetti();
    const txt = ratio >= 0.8 ? `Bravo ${state.child} ! Tu as gagné ${points} étoiles !` : `Bien joué ${state.child} ! ${points} étoiles. On continue de s'entraîner.`;
    speak(txt);
    sheet([
      h('div', { html: mascotSVG('bounce') }),
      h('div', { class: 'big' }, '⭐'.repeat(Math.max(1, Math.round(ratio * 3)))),
      h('h2', {}, ratio >= 0.8 ? 'Bravo !' : 'Bien joué !'),
      h('p', {}, `${points} étoile${points > 1 ? 's' : ''} sur ${max}${ratio >= 0.8 ? ' · niveau suivant !' : ''}`),
      h('button', { class: 'btn', onclick: () => { closeSheet(); home(); } }, 'Retour à la maison 🏠'),
      h('button', { class: 'btn ghost', onclick: () => { closeSheet(); lesson(id); } }, 'Encore une fois !'),
    ], { dismiss: false });
  }
  mount();
}

/* ============================== Galerie ============================== */
function gallery() {
  app.innerHTML = '';
  app.append(
    h('button', { class: 'back', onclick: home }, '‹ Retour'),
    h('h1', {}, '🖼️ Mes dessins'),
    state.drawings.length ? h('div', { class: 'thumbs' }, state.drawings.map(d => h('img', { src: d.png, alt: d.name, onclick: () => sheet([h('img', { src: d.png, style: 'width:100%;border-radius:20px' }), h('p', {}, d.name), h('button', { class: 'btn ghost', onclick: closeSheet }, 'Fermer')]) })))
      : h('div', { class: 'card center' }, h('div', { class: 'big' }, '🎨'), h('p', {}, 'Pas encore de dessin. Va dans « Dessiner » !')),
  );
}

/* ============================== Espace parents ============================== */
function gate(then) {
  const a = rnd(12, 48), b = rnd(12, 48);
  let typed = '';
  const out = h('div', { class: 'big', style: 'font-size:40px;min-height:52px' }, '…');
  const render = () => out.textContent = typed || '…';
  const press = (k) => {
    if (k === '⌫') typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += k;
    render();
    if (typed.length && Number(typed) === a + b) { closeSheet(); then(); }
  };
  sheet([
    h('h2', {}, 'Espace parents'),
    h('p', {}, `Combien font ${a} + ${b} ?`),
    out,
    h('div', { class: 'choices', style: 'margin-top:6px' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map(k => h('button', { class: 'choice text', style: 'min-height:56px;font-size:24px', onclick: () => press(k) }, k))),
    h('button', { class: 'btn ghost', style: 'margin-top:14px', onclick: closeSheet }, 'Annuler'),
  ]);
}

function parent() {
  app.innerHTML = '';
  const weekSec = Object.entries(state.time).filter(([k]) => (Date.now() - new Date(k)) < 7 * 864e5).reduce((a, [, v]) => a + v, 0);
  const fmt = (s) => s < 60 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`;
  const syncCard = h('div', { class: 'card' });
  const renderSync = () => {
    const cfg = state.settings.sync;
    syncCard.innerHTML = '';
    syncCard.append(
      h('h3', {}, '📱 Lien papa & maman'),
      h('p', { class: 'muted' }, 'Ouvrez cette app sur vos téléphones et entrez le même code famille : vous verrez les progrès et les dessins.'),
      h('div', { class: 'field' }, h('label', {}, 'URL Firebase Realtime Database'), h('input', { type: 'url', placeholder: 'https://xxx-default-rtdb.europe-west1.firebasedatabase.app', value: cfg.url, oninput: (e) => { cfg.url = e.target.value.trim(); save(); } })),
      h('div', { class: 'field' }, h('label', {}, 'Code famille (4 caractères ou plus)'), h('input', { type: 'text', placeholder: 'ex. pompon-2026', value: cfg.code, oninput: (e) => { cfg.code = e.target.value.trim(); save(); } })),
      h('div', { class: 'grid2' },
        h('button', { class: 'btn blue sm', style: 'width:100%', onclick: async (e) => { e.target.textContent = '…'; try { await syncPush(true); e.target.textContent = 'Envoyé ✓'; } catch (err) { e.target.textContent = 'Erreur'; } setTimeout(renderSync, 1500); } }, '⬆️ Envoyer'),
        h('button', { class: 'btn teal sm', style: 'width:100%', onclick: async (e) => { e.target.textContent = '…'; try { await syncPull(); parent(); } catch (err) { e.target.textContent = 'Erreur'; setTimeout(renderSync, 1500); } } }, '⬇️ Recevoir'),
      ),
      h('p', { class: 'muted', style: 'margin:10px 0 0' }, Sync.isConfigured(cfg) ? `Lien actif · dernière mise à jour ${new Date(state.updatedAt).toLocaleString('fr-FR')}` : 'Lien inactif (mode local). Voir le README pour créer la base en 5 minutes.'),
    );
  };
  renderSync();
  app.append(
    h('button', { class: 'back', onclick: home }, '‹ Retour'),
    h('h1', {}, '👨‍👩‍👧 Espace parents'),
    h('div', { class: 'card' },
      h('h3', {}, 'Progrès'),
      DOMAINS.map(d => { const s = dom(d.id); return h('div', { class: 'row' }, h('span', {}, `${d.emoji} ${d.name}`), h('div', { class: 'bar', style: `--c:${d.color}` }, h('i', { style: `width:${Math.min(100, (s.level - 1) / 8 * 100)}%` })), h('span', { class: 'muted' }, `niv. ${s.level} · ⭐ ${s.stars}`)); }),
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Temps d’écran'),
      h('div', { class: 'row' }, h('span', {}, 'Aujourd’hui'), h('b', {}, fmt(state.time[today()] || 0))),
      h('div', { class: 'row' }, h('span', {}, '7 derniers jours'), h('b', {}, fmt(weekSec))),
      h('div', { class: 'row' }, h('span', {}, 'Jours de suite'), h('b', {}, String(streak()))),
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Réglages'),
      h('div', { class: 'field' }, h('label', {}, 'Prénom de l’enfant'), h('input', { type: 'text', value: state.child, oninput: (e) => { state.child = e.target.value || 'Mon trésor'; save(); } })),
      h('div', { class: 'field' }, h('label', {}, 'Minuteur par défaut'), h('select', { onchange: (e) => { state.settings.timer = Number(e.target.value); save(); } }, [5, 10, 15, 20, 30].map(m => h('option', { value: m, selected: state.settings.timer === m }, `${m} minutes`)))),
      h('div', { class: 'row' }, h('span', {}, 'Voix (lecture à haute voix)'), h('button', { class: `btn sm ${state.settings.voice ? '' : 'ghost'}`, onclick: (e) => { state.settings.voice = !state.settings.voice; save(); e.target.textContent = state.settings.voice ? 'Activée' : 'Coupée'; e.target.className = `btn sm ${state.settings.voice ? '' : 'ghost'}`; } }, state.settings.voice ? 'Activée' : 'Coupée')),
    ),
    syncCard,
    h('div', { class: 'card' },
      h('h3', {}, 'Dessins'),
      state.drawings.length ? h('div', { class: 'thumbs' }, state.drawings.slice(0, 9).map(d => h('img', { src: d.png, alt: d.name }))) : h('p', { class: 'muted' }, 'Aucun dessin pour l’instant.'),
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Données'),
      h('div', { class: 'grid2' },
        h('button', { class: 'btn ghost sm', style: 'width:100%', onclick: () => { const a = h('a', { href: 'data:application/json,' + encodeURIComponent(JSON.stringify(state)), download: 'pompon-sauvegarde.json' }); a.click(); } }, 'Exporter'),
        h('button', { class: 'btn ghost sm', style: 'width:100%', onclick: () => { if (confirm('Tout remettre à zéro ?')) { state = defaults(); save(); parent(); } } }, 'Réinitialiser'),
      ),
    ),
  );
}

/* ============================== Sync ============================== */
let pushTimer = null;
async function syncPush(now = false) {
  const cfg = state.settings.sync; if (!Sync.isConfigured(cfg)) return;
  if (!now) { clearTimeout(pushTimer); pushTimer = setTimeout(() => syncPush(true), 1500); return; }
  await Sync.push(cfg, state);
}
async function syncPull() {
  const cfg = state.settings.sync; if (!Sync.isConfigured(cfg)) return;
  const remote = await Sync.pull(cfg);
  state = Sync.merge(state, remote); save(false);
}
window.addEventListener('online', () => syncPush());

/* ============================== Minuteur ============================== */
const widget = $('#timer-widget');
let timerEnd = Number(localStorage.getItem('pompon.timerEnd')) || 0;
function setTimer(min) {
  timerEnd = min ? Date.now() + min * 60000 : 0;
  localStorage.setItem('pompon.timerEnd', String(timerEnd));
  renderTimer();
}
function renderTimer() {
  widget.hidden = false; widget.innerHTML = '';
  const left = timerEnd ? Math.max(0, timerEnd - Date.now()) : 0;
  if (timerEnd && left === 0) { setTimer(0); return lockScreen(); }
  if (!timerEnd) {
    widget.append(h('button', { class: 'tbtn', 'aria-label': 'Minuteur', onclick: timerMenu }, '⏱️'));
    return;
  }
  const total = Number(localStorage.getItem('pompon.timerTotal')) || left;
  const p = left / total, r = 29, c = 2 * Math.PI * r;
  const mins = Math.ceil(left / 60000);
  widget.append(h('button', { class: 'tbtn running', 'aria-label': 'Minuteur', onclick: timerMenu, html:
    `<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#F1E6DC" stroke-width="5"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${p < .15 ? '#FFAB76' : '#7BD389'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 32 32)"/></svg><span class="left">${mins}<small style="font-size:10px">min</small></span>` }));
}
function timerMenu() {
  sfx.tap();
  if (timerEnd) {
    const mins = Math.ceil((timerEnd - Date.now()) / 60000);
    sheet([h('div', { class: 'big' }, '⏱️'), h('h2', {}, `Encore ${mins} min`), h('p', {}, 'Quand le temps est fini, on fait une pause.'),
      h('button', { class: 'btn ghost', onclick: closeSheet }, 'D’accord'),
      h('button', { class: 'btn ghost', onclick: () => { closeSheet(); gate(() => setTimer(0)); } }, '🔒 Arrêter (parents)')]);
    return;
  }
  sheet([h('div', { class: 'big' }, '⏱️'), h('h2', {}, 'On joue combien de temps ?'),
    h('div', { class: 'timer-menu' }, [5, 10, 15, 20, 30].map(m => h('button', { class: `btn sm ${m === state.settings.timer ? '' : 'ghost'}`, style: 'width:100%', onclick: () => { closeSheet(); localStorage.setItem('pompon.timerTotal', String(m * 60000)); setTimer(m); speak(`C'est parti pour ${m} minutes !`); } }, `${m} min`))),
    h('button', { class: 'btn ghost', style: 'margin-top:14px', onclick: closeSheet }, 'Sans minuteur')]);
}
function lockScreen() {
  state.lock = true; save(false);
  sfx.chime(); speak(`C'est l'heure de la pause, ${state.child}. Tu as bien joué ! À bientôt.`);
  sheet([h('div', { html: mascotSVG() }), h('h2', {}, 'C’est l’heure de la pause 🌙'), h('p', {}, `Tu as bien joué, ${state.child} ! On se retrouve plus tard.`),
    h('button', { class: 'btn ghost', onclick: () => gate(() => { state.lock = false; save(false); closeSheet(); home(); }) }, '🔒 Je suis un parent')], { dismiss: false });
}
setInterval(() => { if (timerEnd) renderTimer(); }, 5000);

/* ============================== Temps d'écran ============================== */
setInterval(() => {
  if (document.visibilityState === 'visible' && !state.lock) { state.time[today()] = (state.time[today()] || 0) + 10; save(false); }
}, 10000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') syncPush(); });

/* ============================== Démarrage ============================== */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
renderTimer();
function onboarding() {
  const input = h('input', { type: 'text', placeholder: 'Son prénom', style: 'padding:12px 14px;border-radius:14px;border:2px solid var(--line);font-size:18px;width:100%;text-align:center;margin-bottom:14px' });
  sheet([h('div', { html: mascotSVG('bounce') }), h('h2', {}, 'Coucou, je suis Pompon !'), h('p', {}, 'Comment s’appelle l’enfant qui va jouer ?'), input,
    h('button', { class: 'btn', onclick: () => { state.child = input.value.trim() || 'Mon trésor'; state.named = true; save(); closeSheet(); home(); } }, 'C’est parti !')], { dismiss: false });
  setTimeout(() => input.focus(), 300);
}
if (state.lock) lockScreen(); else { home(); if (!state.named) onboarding(); }
syncPull().then(() => { if (!state.lock && !$('.lesson-head')) home(); }).catch(() => {});
