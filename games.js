import { SYLLABLES, WORDS, LETTERS, LETTER_SOUNDS, COUNT_ITEMS, QUIZ, FACTS, DRAWINGS } from './data.js';
import { h, shuffle, pick, rnd, speak, sfx, state, save } from './app.js';

/* ---------- Outils communs ---------- */
function choices(items, okIndex, ctx, { text = false, cols = 3 } = {}) {
  const grid = h('div', { class: `choices ${cols === 2 ? 'two' : ''}` });
  let done = false;
  items.forEach((it, idx) => {
    const b = h('button', { class: `choice ${text ? 'text' : ''}` }, it);
    b.onclick = () => {
      if (done) return;
      if (idx === okIndex) { done = true; b.classList.add('good'); [...grid.children].forEach(c => c !== b && c.classList.add('dim')); ctx.ok(); }
      else { b.classList.add('bad'); setTimeout(() => b.classList.add('dim'), 400); ctx.ko(); }
    };
    grid.append(b);
  });
  return grid;
}
const distinct = (pool, n, exclude = []) => shuffle(pool.filter(x => !exclude.includes(x))).slice(0, n);
const lower = (s) => s.toLowerCase();

/* ---------- 1. Syllabes : recopier un mot ---------- */
function copyWord(word) {
  return {
    prompt: `Recopie le mot : ${word.w}`, say: `Recopie le mot ${lower(word.w)}. ${word.s.map(lower).join(', ')}.`,
    mount(stage, ctx) {
      const slots = word.s.map(() => h('div', { class: 'slot' }));
      let k = 0;
      const extra = distinct(SYLLABLES, Math.min(2, 1 + Math.floor(ctx.level / 2)), word.s);
      const tiles = shuffle([...word.s, ...extra]).map(syl => {
        const t = h('button', { class: 'tile' }, syl);
        t.onclick = () => {
          speak(lower(syl), { rate: 0.8 });
          if (syl === word.s[k]) { t.classList.add('used'); slots[k].textContent = syl; slots[k].classList.add('filled'); k++; if (k === word.s.length) { speak(lower(word.w)); setTimeout(() => ctx.ok(), 400); } }
          else { slots[k].classList.add('wrongslot'); setTimeout(() => slots[k].classList.remove('wrongslot'), 500); ctx.ko(); }
        };
        return t;
      });
      stage.append(
        h('div', { class: 'big' }, word.e),
        h('div', { style: 'font-size:34px;letter-spacing:2px;color:var(--muted)' }, word.s.join('·')),
        h('div', { class: 'slots' }, slots),
        h('div', { class: 'tiles' }, tiles),
      );
    },
  };
}
function pickSyllable(level) {
  const target = pick(SYLLABLES);
  const opts = shuffle([target, ...distinct(SYLLABLES, level >= 3 ? 3 : 2, [target])]);
  return {
    prompt: 'Trouve la syllabe que tu entends', say: `Trouve la syllabe ${lower(target)}.`,
    mount(stage, ctx) {
      stage.append(h('button', { class: 'btn ghost', onclick: () => speak(lower(target), { rate: 0.75 }) }, '🔊 ', h('span', { style: 'font-size:26px' }, 'Écouter')));
      stage.append(choices(opts, opts.indexOf(target), ctx, { text: true, cols: opts.length === 4 ? 2 : 3 }));
    },
  };
}
const syllabes = {
  build(level) {
    const maxS = level <= 1 ? 2 : level <= 3 ? 3 : 4;
    const pool = WORDS.filter(w => w.s.length <= maxS && (level > 1 || w.s.length >= 2));
    const words = shuffle(pool).slice(0, level <= 1 ? 3 : 4);
    const ex = words.map(copyWord);
    while (ex.length < 5) ex.push(pickSyllable(level));
    return shuffle(ex);
  },
};

/* ---------- 2. Écrire : tracer des lettres ---------- */
function traceLetter(letter) {
  return {
    prompt: `Trace la lettre ${letter}`, say: /\d/.test(letter) ? `Trace le chiffre ${letter} avec ton doigt.` : `Trace la lettre ${letter} avec ton doigt.`,
    mount(stage, ctx) {
      const S = 340;
      const wrap = h('div', { class: 'draw-wrap' });
      const model = h('canvas', { width: S, height: S });
      const draw = h('canvas', { width: S, height: S });
      wrap.append(model, draw);
      const mc = model.getContext('2d'), dc = draw.getContext('2d');
      mc.fillStyle = '#F1E6DC'; mc.font = `900 ${S * 0.78}px Nunito, Arial`; mc.textAlign = 'center'; mc.textBaseline = 'middle';
      mc.fillText(letter, S / 2, S / 2 + S * 0.03);
      // Pixels de la lettre (masque) pour mesurer la couverture
      const mask = mc.getImageData(0, 0, S, S).data; let maskCount = 0;
      const idxs = []; for (let i = 3; i < mask.length; i += 4 * 3) if (mask[i] > 100) { idxs.push(i); maskCount++; }
      dc.lineCap = 'round'; dc.lineJoin = 'round'; dc.lineWidth = 30; dc.strokeStyle = '#7FB3FF';
      const bar = h('i'); const cov = h('div', { class: 'coverage' }, bar);
      let drawing = false, last = null, doneFlag = false;
      const pos = (e) => { const r = draw.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
      const measure = () => {
        const d = dc.getImageData(0, 0, S, S).data; let hit = 0;
        for (const i of idxs) if (d[i] > 60) hit++;
        const p = hit / maskCount; bar.style.width = `${Math.min(100, p * 100 / 0.55)}%`;
        if (p >= 0.55 && !doneFlag) { doneFlag = true; setTimeout(() => ctx.ok(), 300); }
      };
      draw.onpointerdown = (e) => { drawing = true; last = pos(e); draw.setPointerCapture(e.pointerId); dc.beginPath(); dc.arc(last[0], last[1], 1, 0, 7); dc.stroke(); };
      draw.onpointermove = (e) => { if (!drawing) return; const p = pos(e); dc.beginPath(); dc.moveTo(last[0], last[1]); dc.lineTo(p[0], p[1]); dc.stroke(); last = p; };
      draw.onpointerup = draw.onpointercancel = () => { if (!drawing) return; drawing = false; measure(); };
      stage.append(wrap, cov, h('button', { class: 'btn ghost sm', onclick: () => { dc.clearRect(0, 0, S, S); bar.style.width = '0'; } }, '🧽 Effacer'));
    },
  };
}
const lettres = { build(level) { const pool = LETTERS[Math.min(level, LETTERS.length) - 1]; return shuffle(pool).slice(0, 5).map(traceLetter); } };

/* ---------- 3. Lire : reconnaître lettres et syllabes ---------- */
function letterBySound(level) {
  const pool = level <= 1 ? ['A', 'E', 'I', 'O', 'U', 'M', 'L', 'S'] : Object.keys(LETTER_SOUNDS).filter(k => k.length === 1);
  const target = pick(pool);
  const opts = shuffle([target, ...distinct(pool, 2, [target])]);
  const sound = LETTER_SOUNDS[target] || target;
  return {
    prompt: 'Quelle lettre fait ce son ?', say: `Quelle lettre fait le son ${sound} ?`,
    mount(stage, ctx) {
      stage.append(h('button', { class: 'btn ghost', onclick: () => speak(sound, { rate: 0.7 }) }, '🔊 ', h('span', { style: 'font-size:26px' }, 'Écouter')));
      stage.append(choices(opts, opts.indexOf(target), ctx, { text: true }));
    },
  };
}
function wordByPicture(level) {
  const pool = WORDS.filter(w => w.s.length <= (level <= 2 ? 2 : 3));
  const target = pick(pool);
  const opts = shuffle([target, ...distinct(pool, 2, [target])]);
  return {
    prompt: `Où est écrit « ${target.w} » ?`, say: `Trouve le mot ${lower(target.w)}.`,
    mount(stage, ctx) {
      stage.append(h('div', { class: 'big' }, target.e));
      stage.append(choices(opts.map(o => o.w), opts.indexOf(target), ctx, { text: true }));
    },
  };
}
const lire = { build(level) { const ex = []; for (let i = 0; i < 5; i++) ex.push(i % 2 === 0 || level <= 1 ? letterBySound(level) : wordByPicture(level)); return ex; } };

/* ---------- 4. Compter ---------- */
function countItems(level) {
  const max = level <= 1 ? 5 : level <= 2 ? 7 : level <= 3 ? 10 : 12;
  const n = rnd(1, max), item = pick(COUNT_ITEMS);
  const wrong = distinct([...Array(max).keys()].map(i => i + 1), 2, [n]);
  const opts = shuffle([n, ...wrong]);
  return {
    prompt: 'Combien y en a-t-il ?', say: 'Compte bien. Combien y en a-t-il ?',
    mount(stage, ctx) {
      stage.append(h('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:300px;font-size:44px' }, Array.from({ length: n }, () => h('span', { onclick: (e) => { sfx.tap(); e.target.style.transform = 'scale(1.25)'; setTimeout(() => e.target.style.transform = '', 200); } }, item))));
      stage.after(choices(opts.map(String), opts.indexOf(n), ctx, { text: true }));
    },
  };
}
function addItems(level) {
  const max = level <= 3 ? 5 : 9;
  const a = rnd(1, max), b = rnd(1, Math.min(max, 10 - a)), item = pick(COUNT_ITEMS);
  const wrong = distinct([...Array(12).keys()].map(i => i + 1), 2, [a + b]);
  const opts = shuffle([a + b, ...wrong]);
  return {
    prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}, ça fait combien ?`,
    mount(stage, ctx) {
      const grp = (k) => h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:130px;font-size:36px' }, Array.from({ length: k }, () => h('span', {}, item)));
      stage.append(h('div', { style: 'display:flex;align-items:center;gap:12px' }, grp(a), h('span', { class: 'big', style: 'font-size:40px' }, '+'), grp(b)));
      stage.after(choices(opts.map(String), opts.indexOf(a + b), ctx, { text: true }));
    },
  };
}
const compter = { build(level) { const ex = []; for (let i = 0; i < 5; i++) ex.push(level >= 3 && i % 2 === 1 ? addItems(level) : countItems(level)); return ex; } };

/* ---------- 5. Dessiner : personnage kawaii guidé ---------- */
const COLORS = ['#4A3F55', '#FF8FAB', '#7FB3FF', '#7BD389', '#FFD166', '#B892FF', '#FFAB76', '#6FD6C8'];
function guidedDrawing(model) {
  return {
    prompt: `Dessine un ${lower(model.name)} ${model.emoji}`, say: `On dessine un ${lower(model.name)} ! Suis le modèle gris, étape par étape.`, gain: 5,
    mount(stage, ctx) {
      const S = 340; let step = 0, color = COLORS[0];
      const wrap = h('div', { class: 'draw-wrap' });
      const svg = h('div', { html: `<svg viewBox="0 0 200 200"></svg>` }).firstChild;
      const draw = h('canvas', { width: S, height: S });
      wrap.append(svg, draw);
      const dc = draw.getContext('2d'); dc.lineCap = 'round'; dc.lineJoin = 'round'; dc.lineWidth = 7;
      const dots = h('div', { class: 'steps' }, model.steps.map(() => h('i')));
      const hint = h('div', { style: 'font-size:18px;text-align:center;min-height:24px' });
      const renderModel = () => {
        svg.innerHTML = model.steps.map((s, i) => i < step
          ? `<path d="${s.d}" fill="none" stroke="#EADFF3" stroke-width="2"/>`
          : i === step ? `<path d="${s.d}" fill="none" stroke="#C9BFD6" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round"/>` : '').join('');
        [...dots.children].forEach((d, i) => d.classList.toggle('on', i <= step));
        hint.textContent = model.steps[step].say; speak(model.steps[step].say);
      };
      let drawing = false, last = null;
      const pos = (e) => { const r = draw.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
      draw.onpointerdown = (e) => { drawing = true; last = pos(e); draw.setPointerCapture(e.pointerId); dc.strokeStyle = color; dc.beginPath(); dc.arc(last[0], last[1], 1, 0, 7); dc.stroke(); };
      draw.onpointermove = (e) => { if (!drawing) return; const p = pos(e); dc.beginPath(); dc.moveTo(last[0], last[1]); dc.lineTo(p[0], p[1]); dc.stroke(); last = p; };
      draw.onpointerup = draw.onpointercancel = () => { drawing = false; };
      const palette = h('div', { class: 'palette' }, COLORS.map(c => { const b = h('button', { class: `swatch ${c === color ? 'on' : ''}`, style: `background:${c}`, 'aria-label': 'couleur' }); b.onclick = () => { color = c; [...palette.children].forEach(x => x.classList.toggle('on', x === b)); }; return b; }));
      const nextBtn = h('button', { class: 'btn purple', onclick: () => {
        sfx.tap();
        if (step < model.steps.length - 1) { step++; renderModel(); if (step === model.steps.length - 1) nextBtn.textContent = 'Terminé ! ✨'; }
        else {
          const out = document.createElement('canvas'); out.width = out.height = 300; const oc = out.getContext('2d');
          oc.fillStyle = '#fff'; oc.fillRect(0, 0, 300, 300); oc.drawImage(draw, 0, 0, 300, 300);
          state.drawings.unshift({ id: Date.now(), name: model.name, png: out.toDataURL('image/png') }); state.drawings = state.drawings.slice(0, 40); save();
          ctx.ok(5);
        }
      } }, 'Étape suivante ➜');
      stage.append(hint, wrap, dots, palette, h('div', { class: 'toolrow' }, h('button', { class: 'btn ghost sm', onclick: () => dc.clearRect(0, 0, S, S) }, '🧽 Effacer'), nextBtn));
      setTimeout(renderModel, 600);
    },
  };
}
const dessin = { build(level) { return [guidedDrawing(DRAWINGS[(level - 1) % DRAWINGS.length])]; } };

/* ---------- 6. Équilibre : la tour qui tremble (mesurer le risque) ---------- */
function tower(round) {
  const PAST = ['#FFD7E2', '#CDEBB8', '#D6E6FF', '#FFF0C2', '#E6D9FF', '#FFE0CC', '#CFF3EE'];
  const FACES = ['🐱', '🐰', '🐻', '🐸', '🐥', '🐼', '🦊'];
  return {
    prompt: `La tour qui tremble · manche ${round}`, say: 'Empile des blocs. Plus la tour est haute, plus elle tremble ! Quand tu t’arrêtes, tu gagnes une étoile par bloc. Si elle tombe, zéro.', gain: 5,
    mount(stage, ctx) {
      let n = 0, over = false;
      const tw = h('div', { class: 'tower' });
      const scene = h('div', { class: 'tower-scene' }, tw, h('div', { class: 'ground' }));
      const score = h('div', { class: 'tower-stars' }, '⭐ 0');
      const risk = (k) => Math.min(0.7, 0.05 * Math.pow(k - 1, 1.6));
      const addBlock = () => {
        n++; tw.append(h('div', { class: 'block', style: `background:${PAST[n % PAST.length]}` }, FACES[n % FACES.length]));
        score.textContent = `⭐ ${Math.min(n, 5)}`;
        tw.style.setProperty('--amp', `${Math.min(14, n * 1.8)}deg`); tw.style.setProperty('--dur', `${Math.max(.5, 1.8 - n * .15)}s`);
        tw.classList.add('sway');
      };
      const more = h('button', { class: 'btn orange', onclick: () => {
        if (over) return; sfx.tap();
        addBlock();
        if (n >= 2 && Math.random() < risk(n)) {
          over = true; more.disabled = stop.disabled = true;
          setTimeout(() => { tw.classList.remove('sway'); tw.classList.add('fall'); ctx.ko({ final: true, msg: 'Oups ! La tour est tombée. La prochaine fois, on s’arrête un peu plus tôt ?' }); }, 500);
        } else if (n >= 3) speak(pick(['Ça tremble !', 'Oh là là, elle bouge !', 'Attention…', 'Tu continues ?']));
      } }, '🧱 Encore un bloc !');
      const stop = h('button', { class: 'btn green', onclick: () => { if (over || n === 0) return; over = true; more.disabled = stop.disabled = true; tw.classList.remove('sway'); ctx.ok(Math.min(n, 5)); } }, '✋ Je m’arrête');
      stage.append(scene, score, h('div', { class: 'toolrow', style: 'width:100%' }, more, stop));
      setTimeout(addBlock, 400);
    },
  };
}
const equilibre = { build() { return [tower(1), tower(2), tower(3)]; } };

/* ---------- 7. Quiz & curiosité ---------- */
function quizItem(q) {
  return { prompt: q.q, say: q.q, mount(stage, ctx) { stage.append(h('div', { class: 'big' }, '🤔')); stage.after(choices(q.a, q.ok, ctx)); } };
}
function factItem(f) {
  return {
    prompt: 'Le savais-tu ?', say: `Le savais-tu ? ${f.t}`,
    mount(stage, ctx) {
      stage.append(h('div', { class: 'huge' }, f.e), h('div', { style: 'font-size:20px;text-align:center;line-height:1.3' }, f.t));
      const btn = h('button', { class: 'btn teal', onclick: () => {
        sfx.tap(); stage.innerHTML = ''; stage.append(h('div', { class: 'big' }, f.e), h('div', { style: 'font-size:20px;text-align:center' }, f.q));
        speak(f.q); stage.after(choices(f.a, f.ok, ctx));
      } }, '💡 Question !');
      stage.append(btn);
    },
  };
}
const quiz = { build(level) { const qs = shuffle(QUIZ).slice(0, 3).map(quizItem); const fs = shuffle(FACTS).slice(0, 2).map(factItem); return shuffle([...qs, ...fs]); } };

export const GAMES = { syllabes, lettres, lire, compter, dessin, equilibre, quiz };
