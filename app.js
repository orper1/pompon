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
  settings: { voice: true, timer: 10, sync: { url: 'https://pompon-be86b-default-rtdb.europe-west1.firebasedatabase.app', code: '' } },
  level: 1,
  levels: {},
  lock: null,
  updatedAt: 0,
});
// Profils : 'enfant' (le vrai) et 'test' (pour essayer sans toucher aux progrès). Chaque profil a son propre état.
let profile = localStorage.getItem('pompon.profile') || 'enfant';
const slotKey = (p) => p === 'enfant' ? KEY : `pompon.slot.${p}`;
const hasProfile = (p) => !!localStorage.getItem(slotKey(p));
export let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(slotKey(profile))); if (s) return { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } }; } catch {}
  return defaults();
}
export function save(touch = true) {
  if (touch) state.updatedAt = Date.now();
  try { localStorage.setItem(slotKey(profile), JSON.stringify(state)); } catch {}
}
function switchProfile(p) {
  save(false);
  profile = p; localStorage.setItem('pompon.profile', p);
  if (!hasProfile(p)) {
    state = { ...defaults(), child: p === 'test' ? 'Test' : 'Mon trésor', named: true };
    state.settings.sync.code = ''; // le profil test ne synchronise jamais
    save(false);
  } else state = load();
  localStorage.removeItem('pompon.timerEnd'); timerEnd = 0; renderTimer();
  home();
}
const dom = (id) => state.domains[id] || (state.domains[id] = { level: 1, stars: 0, lessons: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const totalStars = () => Object.values(state.domains).reduce((a, d) => a + d.stars, 0) + Object.values(state.levels || {}).reduce((a, b) => a + b, 0);
function streak() {
  let n = 0; const d = new Date();
  while (true) { const k = d.toISOString().slice(0, 10); if ((state.time[k] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); } else break; if (n > 365) break; }
  return n;
}

/* ============================== Voix & sons ============================== */
let voice = null;
const frVoices = () => ('speechSynthesis' in window ? speechSynthesis.getVoices() : []).filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
// Score : voix premium/enhanced/neurales d'abord, puis les voix connues pour être fluides.
const voiceScore = (v) => (/premium/i.test(v.name) ? 40 : 0) + (/enhanced|améliorée|neural|natural|wavenet/i.test(v.name) ? 30 : 0)
  + (/audrey|am[ée]lie|aurelie|thomas|google.*fran|siri/i.test(v.name) ? 10 : 0) + (/compact|eloquence|grandma|grandpa|flo|shelley|sandy|rocko|reed|bells|boing|bubbles|cellos|zarvox|trinoids|jester|organ|whisper|wobble|good news|bad news|superstar|fred|junior|kathy|ralph|albert/i.test(v.name) ? -50 : 0)
  + (v.lang.toLowerCase() === 'fr-fr' ? 5 : 0);
function pickVoice() {
  const vs = frVoices().sort((a, b) => voiceScore(b) - voiceScore(a));
  const wanted = state.settings.voiceName && vs.find(v => v.name === state.settings.voiceName);
  voice = wanted || vs[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, opts = {}) {
  if (!state.settings.voice || !('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; if (voice) u.voice = voice;
    const premium = voice && /premium|enhanced|améliorée|neural|natural/i.test(voice.name);
    u.rate = opts.rate || (premium ? 0.95 : 0.85); u.pitch = opts.pitch || (premium ? 1.05 : 1.15);
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
const mascotSVG = (cls = '') => `<img class="mascot ${cls}" src="icons/mascot.png" alt="">`;

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

/* ============================== Paliers (séries mélangées) ============================== */
const LEVELS = 30, PER_UNIT = 6;
const difficultyOf = (k) => Math.min(9, Math.ceil(k / 3));
const UNIT_COLORS = [['var(--blue)', 'var(--blue-d)'], ['var(--green)', 'var(--green-d)'], ['var(--purple)', 'var(--purple-d)'], ['var(--orange)', 'var(--orange-d)'], ['var(--pink)', 'var(--pink-d)']];
const unitColor = (k) => UNIT_COLORS[Math.floor((k - 1) / PER_UNIT) % UNIT_COLORS.length];
function buildSeries(k) {
  const lvl = difficultyOf(k);
  const special = k % 3 === 0 ? 'dessin' : k % 3 === 1 ? 'equilibre' : pick(['quiz', 'syllabes']);
  const ids = shuffle(['syllabes', 'lire', 'compter', 'quiz', 'lettres', special]);
  return ids.map(id => ({ ...GAMES[id].one(lvl), domain: id }));
}

/* ============================== Écran d'accueil ============================== */
function topbar() {
  return h('div', { class: 'topbar' },
    h('div', { html: mascotSVG('bounce') }),
    h('div', { class: 'who' }, h('div', { class: 'name' }, state.child), h('div', { class: 'sub' }, `☀️ ${streak()} jour${streak() > 1 ? 's' : ''}`)),
    profile === 'test' && h('span', { class: 'pill warn' }, '🧪 test'),
    h('span', { class: 'pill' }, h('b', { class: 'ico' }, '⭐'), String(totalStars())),
    h('button', { class: 'lock', 'aria-label': 'Espace parents', onclick: () => gate(parent) }, '🔒'),
  );
}
function home() {
  window.speechSynthesis?.cancel?.();
  app.innerHTML = '';
  const cur = state.level || 1;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Coucou' : 'Bonsoir';
  const msg = `${hello} ${state.child} ! On continue au palier ${cur} ?`;
  const path = h('div', { class: 'path' });
  const offsets = [0, 1, 2, 1, 0, -1, -2, -1];
  let current = null;
  for (let k = 1; k <= LEVELS; k++) {
    const [c, cd] = unitColor(k);
    if ((k - 1) % PER_UNIT === 0) path.append(h('div', { class: 'unit', style: `--c:${c};--cd:${cd}`, 'data-label': `Unité ${Math.floor((k - 1) / PER_UNIT) + 1}` }));
    const st = k < cur ? 'done' : k === cur ? 'current' : 'locked';
    const stars = state.levels?.[k] || 0;
    const node = h('div', { class: `lnode ${st}`, style: `--c:${c};--cd:${cd};--x:${offsets[(k - 1) % offsets.length] * 56}px` },
      st === 'current' && h('div', { class: 'go' }, 'C’est parti !'),
      h('button', { class: 'lvl-disc', disabled: st === 'locked', 'aria-label': `Palier ${k}`, onclick: () => { sfx.tap(); lesson({ kind: 'level', k }); } }, st === 'locked' ? '🔒' : String(k)),
      st === 'done' && h('div', { class: 'lstars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
    );
    if (st === 'current') current = node;
    path.append(node);
  }
  app.append(
    topbar(),
    h('div', { class: 'hello' }, h('div', { class: 'bubble' }, msg), h('button', { class: 'speak', 'aria-label': 'Écouter', onclick: () => speak(msg) }, '🔊')),
    h('div', { class: 'quick' },
      h('button', { class: 'btn teal', onclick: training }, '🎯 Entraînement'),
      h('button', { class: 'btn ghost', onclick: gallery }, '🖼️ Mes dessins'),
    ),
    path,
  );
  if (current) setTimeout(() => current.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
}

/* ============================== Entraînement (tous les mini-jeux) ============================== */
function training() {
  app.innerHTML = '';
  app.append(
    h('button', { class: 'back', onclick: home }, '‹ Retour'),
    h('h1', {}, '🎯 Entraînement'),
    h('p', { class: 'muted', style: 'margin:-6px 0 14px' }, 'Choisis un jeu et entraîne-toi autant que tu veux.'),
    h('div', { class: 'games' }, DOMAINS.map(d => {
      const s = dom(d.id);
      return h('button', { class: 'gcard', style: `--c:${d.color};--cd:${d.dark}`, onclick: () => { sfx.tap(); lesson({ kind: 'train', id: d.id }); } },
        h('span', { class: 'gico' }, d.emoji), h('span', { class: 'gname' }, d.name), h('span', { class: 'gsub' }, `⭐ ${s.stars}`));
    })),
  );
}

/* ============================== Moteur de leçon ============================== */
function lesson(opts) {
  const isLevel = opts.kind === 'level';
  const d = isLevel ? null : DOMAINS.find(x => x.id === opts.id);
  const s = isLevel ? null : dom(opts.id);
  const lvl = isLevel ? difficultyOf(opts.k) : s.level;
  const exercises = isLevel ? buildSeries(opts.k) : GAMES[opts.id].build(lvl).map(e => ({ ...e, domain: opts.id }));
  const [c, cd] = isLevel ? unitColor(opts.k) : [d.color, d.dark];
  let i = 0, points = 0, missed = false, answered = false;
  app.innerHTML = '';
  document.documentElement.style.setProperty('--primary', c);
  document.documentElement.style.setProperty('--primary-d', cd);
  const bar = h('i');
  const tag = h('div', { class: 'gametag' });
  const promptEl = h('div', { class: 'prompt' });
  const stage = h('div', { class: 'stage' });
  const foot = h('div', { class: 'lesson-foot', hidden: true });
  app.append(
    h('div', { class: 'lesson-head' }, h('button', { class: 'close', 'aria-label': 'Quitter', onclick: () => { sfx.tap(); home(); } }, '✕'), h('div', { class: 'progress' }, bar)),
    tag, promptEl, stage, foot,
  );
  speak(isLevel ? `Palier ${opts.k} ! Six petits jeux, c'est parti.` : d.intro);

  function showFoot(kind, title, sub, btnLabel, action) {
    foot.hidden = false; foot.className = `lesson-foot ${kind}`; foot.innerHTML = '';
    foot.append(h('div', { class: 'inner', style: 'flex-direction:column' },
      h('div', { class: 'feedback' }, kind === 'ok' ? '🎉' : '🌱', h('div', {}, title, sub && h('small', {}, sub))),
      h('button', { class: `btn ${kind === 'ok' ? 'green' : 'orange'}`, onclick: action }, btnLabel)));
  }
  const ctx = {
    level: lvl, speak, sfx, state,
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
    const gd = DOMAINS.find(x => x.id === ex.domain);
    tag.innerHTML = ''; tag.append(h('span', { class: 'gtag', style: `--c:${gd.color};--cd:${gd.dark}` }, gd.emoji, ' ', gd.name));
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
    let passed, starsWon = ratio >= 0.95 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
    if (isLevel) {
      passed = ratio >= 0.5;
      state.levels = state.levels || {};
      if (passed) { state.levels[opts.k] = Math.max(state.levels[opts.k] || 0, starsWon); if (opts.k === (state.level || 1)) state.level = Math.min(LEVELS, opts.k + 1); }
      for (const e of exercises) dom(e.domain).lessons++;
    } else {
      passed = ratio >= 0.8;
      s.stars += points; s.lessons++;
      if (passed) s.level = Math.min(s.level + 1, 9);
    }
    save(); syncPush();
    if (passed) { sfx.win(); confetti(); } else sfx.ok();
    const txt = passed
      ? (isLevel ? `Bravo ${state.child} ! Palier ${opts.k} réussi !` : `Bravo ${state.child} ! Tu as gagné ${points} étoiles !`)
      : `Bien joué ${state.child} ! On réessaie quand tu veux.`;
    speak(txt);
    sheet([
      h('div', { html: mascotSVG('bounce') }),
      h('div', { class: 'big' }, '⭐'.repeat(Math.max(1, starsWon)) + '☆'.repeat(3 - Math.max(1, starsWon))),
      h('h2', {}, passed ? 'Bravo !' : 'Bien joué !'),
      h('p', {}, `${points} étoile${points > 1 ? 's' : ''} sur ${max}${passed && isLevel ? ' · palier suivant débloqué !' : ''}`),
      h('button', { class: 'btn green', onclick: () => { closeSheet(); home(); } }, 'Retour à la maison 🏠'),
      h('button', { class: 'btn ghost', onclick: () => { closeSheet(); lesson(opts); } }, 'Encore une fois !'),
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
  const profileCard = h('div', { class: 'card' },
    h('h3', {}, '👤 Profils'),
    h('p', { class: 'muted' }, profile === 'test' ? 'Profil TEST actif : rien n’est synchronisé, les progrès de l’enfant sont intacts.' : `Profil de ${state.child} actif.`),
    h('div', { class: 'grid2' },
      profile === 'test'
        ? h('button', { class: 'btn sm', style: 'width:100%', onclick: () => switchProfile('enfant') }, '👧 Retour au profil enfant')
        : h('button', { class: 'btn orange sm', style: 'width:100%', onclick: () => switchProfile('test') }, hasProfile('test') ? '🧪 Passer en profil test' : '🧪 Créer un profil test'),
      profile === 'test' && h('button', { class: 'btn ghost sm', style: 'width:100%', onclick: () => { if (confirm('Supprimer le profil test ?')) { localStorage.removeItem(slotKey('test')); switchProfile('enfant'); } } }, 'Supprimer le profil test'),
    ),
  );
  const syncCard = h('div', { class: 'card' });
  const renderSync = () => {
    const cfg = state.settings.sync;
    syncCard.innerHTML = '';
    if (profile === 'test') { syncCard.append(h('h3', {}, '📱 Lien papa & maman'), h('p', { class: 'muted' }, 'Désactivé sur le profil test.')); return; }
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
      h('div', { class: 'row' }, h('span', {}, '🏁 Palier actuel'), h('b', {}, `${state.level || 1} / ${LEVELS}`)),
      h('div', { class: 'row' }, h('span', {}, '⭐ Étoiles de paliers'), h('b', {}, String(Object.values(state.levels || {}).reduce((a, b) => a + b, 0)))),
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
      h('div', { class: 'field', style: 'margin-top:10px' }, h('label', {}, 'Quelle voix ? (les voix « Premium » ou « Améliorée » sont bien plus fluides)'),
        h('div', { style: 'display:flex;gap:8px;align-items:center' },
          h('select', { style: 'flex:1', onchange: (e) => { state.settings.voiceName = e.target.value; save(); pickVoice(); speak(`Bonjour ${state.child} ! On joue ensemble ?`); } },
            h('option', { value: '', selected: !state.settings.voiceName }, 'Automatique (la meilleure dispo)'),
            frVoices().sort((a, b) => voiceScore(b) - voiceScore(a)).map(v => h('option', { value: v.name, selected: state.settings.voiceName === v.name }, `${v.name} (${v.lang})`))),
          h('button', { class: 'btn sm teal', onclick: () => speak(`Bonjour ${state.child} ! On joue ensemble ?`) }, '🔊')),
        h('p', { class: 'muted', style: 'margin:8px 0 0' }, 'Pour une voix bien plus naturelle sur iPad : Réglages → Accessibilité → Contenu énoncé → Voix → Français → télécharger « Audrey (Premium) » ou « Thomas (Premium) », puis revenir ici et la choisir.')),
    ),
    profileCard,
    syncCard,
    h('div', { class: 'card' },
      h('h3', {}, 'Dessins'),
      state.drawings.length ? h('div', { class: 'thumbs' }, state.drawings.slice(0, 9).map(d => h('img', { src: d.png, alt: d.name }))) : h('p', { class: 'muted' }, 'Aucun dessin pour l’instant.'),
    ),
    h('div', { class: 'card' },
      h('h3', {}, `Données · version ${VERSION}`),
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
  const cfg = state.settings.sync; if (profile === 'test' || !Sync.isConfigured(cfg)) return;
  if (!now) { clearTimeout(pushTimer); pushTimer = setTimeout(() => syncPush(true), 1500); return; }
  await Sync.push(cfg, state);
}
async function syncPull() {
  const cfg = state.settings.sync; if (profile === 'test' || !Sync.isConfigured(cfg)) return;
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
export const VERSION = '2.3';
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => { reg.update(); setInterval(() => reg.update(), 60 * 60 * 1000); }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; location.reload(); });
}
renderTimer();
function onboarding() {
  const input = h('input', { type: 'text', placeholder: 'Son prénom', style: 'padding:12px 14px;border-radius:14px;border:2px solid var(--line);font-size:18px;width:100%;text-align:center;margin-bottom:14px' });
  sheet([h('div', { html: mascotSVG('bounce') }), h('h2', {}, 'Coucou, je suis Pompon !'), h('p', {}, 'Comment s’appelle l’enfant qui va jouer ?'), input,
    h('button', { class: 'btn', onclick: () => { state.child = input.value.trim() || 'Mon trésor'; state.named = true; save(); closeSheet(); home(); } }, 'C’est parti !')], { dismiss: false });
  setTimeout(() => input.focus(), 300);
}
if (state.lock) lockScreen(); else { home(); if (!state.named) onboarding(); }
syncPull().then(() => { if (!state.lock && !$('.lesson-head')) home(); }).catch(() => {});
