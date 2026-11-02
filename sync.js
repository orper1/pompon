// Synchronisation optionnelle entre appareils (tablette de l'enfant ↔ téléphones des parents).
// Backend : Firebase Realtime Database via son API REST, zéro SDK.
// Réglages dans l'espace parents : URL de la base + code famille.
// Sans réglages, l'app fonctionne 100 % en local.

const key = (cfg) => `${cfg.url.replace(/\/+$/, '')}/families/${encodeURIComponent(cfg.code.trim().toLowerCase())}.json`;

export function isConfigured(cfg) {
  return !!(cfg && cfg.url && /^https:\/\//.test(cfg.url) && cfg.code && cfg.code.trim().length >= 4);
}

export async function pull(cfg) {
  if (!isConfigured(cfg)) return null;
  const r = await fetch(key(cfg), { cache: 'no-store' });
  if (!r.ok) throw new Error(`pull ${r.status}`);
  return await r.json();
}

export async function push(cfg, state) {
  if (!isConfigured(cfg)) return false;
  const r = await fetch(key(cfg), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
  if (!r.ok) throw new Error(`push ${r.status}`);
  return true;
}

// Fusion douce : on garde le meilleur des deux côtés.
export function merge(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const out = structuredClone(local);
  out.domains = out.domains || {};
  for (const [id, d] of Object.entries(remote.domains || {})) {
    const l = out.domains[id] || { level: 1, stars: 0, lessons: 0 };
    out.domains[id] = { level: Math.max(l.level, d.level || 1), stars: Math.max(l.stars, d.stars || 0), lessons: Math.max(l.lessons, d.lessons || 0) };
  }
  out.level = Math.max(out.level || 1, remote.level || 1);
  out.levels = out.levels || {};
  for (const [k, v] of Object.entries(remote.levels || {})) out.levels[k] = Math.max(out.levels[k] || 0, v);
  out.time = out.time || {};
  for (const [day, s] of Object.entries(remote.time || {})) out.time[day] = Math.max(out.time[day] || 0, s);
  const seen = new Set((out.drawings || []).map(d => d.id));
  out.drawings = [...(out.drawings || []), ...(remote.drawings || []).filter(d => !seen.has(d.id))]
    .sort((a, b) => b.id - a.id).slice(0, 40);
  if ((remote.updatedAt || 0) > (local.updatedAt || 0)) {
    out.settings = { ...out.settings, ...remote.settings, sync: out.settings.sync };
    out.child = remote.child || out.child;
  }
  out.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);
  return out;
}
