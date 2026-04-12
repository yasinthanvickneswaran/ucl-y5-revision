/* ═══════════════════════════════════════════════════════════════
   UCL Y5 Revision — shared.js
   Content  : fetched from /data/sba/[id].html (static files)
   Progress : synced to/from a private GitHub Gist
═══════════════════════════════════════════════════════════════ */

/* ── Specialty manifest ── */
const SPECIALTIES = [
  { id: 'child-health',  label: 'Child Health',             module: 'a',  conditions: 39 },
  { id: 'camhs',         label: 'CAMHS',                    module: 'a',  conditions: 12 },
  { id: 'gp',            label: 'General Practice',         module: 'gp', conditions: 40 },
  { id: 'breast',        label: 'Breast',                   module: 'b',  conditions: 5  },
  { id: 'dermatology',   label: 'Dermatology',              module: 'b',  conditions: 16 },
  { id: 'sexual-health', label: 'Sexual Health & HIV',      module: 'b',  conditions: 12 },
  { id: 'urology',       label: 'Urology',                  module: 'b',  conditions: 11 },
  { id: 'obs-gynae',     label: 'Obstetrics & Gynaecology', module: 'b',  conditions: 36 },
  { id: 'cancer',        label: 'Cancer Medicine',          module: 'c',  conditions: 24 },
  { id: 'older-person',  label: 'Care of the Older Person', module: 'c',  conditions: 14 },
  { id: 'ophthalmology', label: 'Ophthalmology',            module: 'c',  conditions: 28 },
  { id: 'palliative',    label: 'Palliative Care',          module: 'c',  conditions: 6  },
  { id: 'psychiatry',    label: 'Psychiatry',               module: 'c',  conditions: 18 },
];

const MODULE_LABELS = { a: 'Module A', b: 'Module B', c: 'Module C', gp: 'GP' };

/* ── Resolve base URL (works on GitHub Pages and locally) ── */
function baseURL() {
  // Walk up from current page to find repo root (where /data/sba/ lives)
  const loc  = window.location;
  const path = loc.pathname;
  // Strip known sub-paths
  const strip = ['/specialties/', '/sba/', '/timetable/', '/weaknesses/', '/admin/'];
  let base = path;
  for (const s of strip) {
    const idx = path.indexOf(s);
    if (idx !== -1) { base = path.slice(0, idx + 1); break; }
  }
  // Remove trailing filename if present
  if (base.endsWith('.html')) base = base.slice(0, base.lastIndexOf('/') + 1);
  return loc.origin + base;
}

/* ═══════════════════════════════════════════════════════════════
   SBA LOADING  — fetch from static HTML files
═══════════════════════════════════════════════════════════════ */
const _sbaCache = {};

async function loadSBAs(specId) {
  if (_sbaCache[specId]) return _sbaCache[specId];
  try {
    const url  = `${baseURL()}data/sba/${specId}.html`;
    const resp = await fetch(url);
    if (!resp.ok) { _sbaCache[specId] = []; return []; }
    const html = await resp.text();
    const qs   = parseSBAHtml(html);
    _sbaCache[specId] = qs;
    return qs;
  } catch {
    _sbaCache[specId] = [];
    return [];
  }
}

function parseSBAHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const questions = [];
  tmp.querySelectorAll('.question').forEach(qEl => {
    const stem    = qEl.querySelector('.q-stem')?.textContent.trim() || '';
    const correct = parseInt(qEl.dataset.correct ?? 0);
    const imgEl   = qEl.querySelector('.q-image img');
    const image   = imgEl ? imgEl.getAttribute('src') : '';
    const expEl   = qEl.querySelector('.q-explanation');
    const exp     = expEl ? expEl.textContent.trim() : '';
    const options = [];
    qEl.querySelectorAll('.q-options li').forEach(li => {
      // Strip leading "A. " letter prefix
      options.push(li.textContent.replace(/^[A-E]\.\s*/,'').trim());
    });
    questions.push({ stem, options, correct_index: correct, explanation: exp, ...(image && { image }) });
  });
  return questions;
}

async function countAllSBAs() {
  let total = 0;
  await Promise.all(SPECIALTIES.map(async s => {
    const qs = await loadSBAs(s.id);
    total += qs.length;
  }));
  return total;
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS STORE
   Local:  localStorage (instant reads, used as working cache)
   Remote: GitHub Gist (synced on load + after each save)
═══════════════════════════════════════════════════════════════ */
const Progress = {
  /* ── Local helpers ── */
  _get(k, fb = null) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
  },
  _set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },

  getChecks()              { return this._get('ucl_y5_checks', {}); },
  saveChecks(c)            { this._set('ucl_y5_checks', c); this._schedulePush(); },

  getQuizStats(specId)     { return this._get(`qstats_${specId}`, { answered:0, correct:0, wrong:[] }); },
  saveQuizStats(specId, s) { this._set(`qstats_${specId}`, s); this._schedulePush(); },

  recordAnswer(specId, isCorrect, wrongInfo) {
    const s = this.getQuizStats(specId);
    s.answered++;
    if (isCorrect) { s.correct++; }
    else { s.wrong = [wrongInfo, ...(s.wrong||[])].slice(0, 50); }
    this.saveQuizStats(specId, s);
  },

  clearQuizStats(specId)   { this._set(`qstats_${specId}`, { answered:0, correct:0, wrong:[] }); this._schedulePush(); },

  getWeaknessFlags()       { return this._get('weakness_flags', {}); },
  addWeaknessFlag(specId, topic) {
    const w = this.getWeaknessFlags();
    if (!w[specId]) w[specId] = [];
    if (!w[specId].includes(topic)) w[specId].push(topic);
    this._set('weakness_flags', w); this._schedulePush();
  },
  removeWeaknessFlag(specId, topic) {
    const w = this.getWeaknessFlags();
    if (w[specId]) w[specId] = w[specId].filter(t => t !== topic);
    this._set('weakness_flags', w); this._schedulePush();
  },

  getNotesHTML(specId)         { try { return localStorage.getItem(`noteshtml_${specId}`) || ''; } catch { return ''; } },
  saveNotesHTML(specId, html)  { try { localStorage.setItem(`noteshtml_${specId}`, html); } catch {} },

  /* ── Serialise all progress to one object ── */
  _serialise() {
    const stats = {};
    SPECIALTIES.forEach(s => { stats[s.id] = this.getQuizStats(s.id); });
    return {
      v: 1,
      saved_at: new Date().toISOString(),
      checks: this.getChecks(),
      quiz_stats: stats,
      weakness_flags: this.getWeaknessFlags(),
    };
  },

  /* ── Deserialise and write to localStorage ── */
  _hydrate(data) {
    if (!data || data.v !== 1) return;
    if (data.checks)         this._set('ucl_y5_checks', data.checks);
    if (data.weakness_flags) this._set('weakness_flags', data.weakness_flags);
    if (data.quiz_stats) {
      Object.entries(data.quiz_stats).forEach(([id, s]) => this._set(`qstats_${id}`, s));
    }
  },

  /* ── Gist sync ── */
  _pushTimer: null,
  _schedulePush() {
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => Gist.push(), 2000); // debounce 2s
  },

  /* ── Global progress summary ── */
  globalProgress() {
    let answered = 0, correct = 0;
    const bySpec = {};
    SPECIALTIES.forEach(s => {
      const st = this.getQuizStats(s.id);
      answered += st.answered;
      correct  += st.correct;
      bySpec[s.id] = st;
    });
    return { answered, correct, pct: answered > 0 ? Math.round(correct/answered*100) : 0, bySpec };
  },
};

/* ═══════════════════════════════════════════════════════════════
   GIST SYNC
═══════════════════════════════════════════════════════════════ */
const GIST_SETTINGS_KEY = 'ucl_gist_settings'; // { token, gistId }
const GIST_FILENAME     = 'ucl_y5_progress.json';

const Gist = {
  getSettings() {
    try { const v = localStorage.getItem(GIST_SETTINGS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  saveSettings(s) {
    try { localStorage.setItem(GIST_SETTINGS_KEY, JSON.stringify(s)); } catch {}
  },
  isConfigured() {
    const s = this.getSettings();
    return !!(s?.token && s?.gistId);
  },

  /* Pull progress from Gist → hydrate localStorage */
  async pull() {
    const s = this.getSettings();
    if (!s?.token || !s?.gistId) return false;
    try {
      const resp = await fetch(`https://api.github.com/gists/${s.gistId}`, {
        headers: { Authorization: `Bearer ${s.token}`, Accept: 'application/vnd.github+json' }
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      const raw  = data.files?.[GIST_FILENAME]?.content;
      if (!raw) return false;
      Progress._hydrate(JSON.parse(raw));
      return true;
    } catch { return false; }
  },

  /* Push localStorage progress → Gist */
  async push() {
    const s = this.getSettings();
    if (!s?.token || !s?.gistId) return false;
    try {
      const body = { files: { [GIST_FILENAME]: { content: JSON.stringify(Progress._serialise(), null, 2) } } };
      const resp = await fetch(`https://api.github.com/gists/${s.gistId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${s.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return resp.ok;
    } catch { return false; }
  },

  /* Create a new Gist (called on first setup) */
  async create(token) {
    try {
      const body = {
        description: 'UCL Y5 Revision Progress',
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify(Progress._serialise(), null, 2) } }
      };
      const resp = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.id;
    } catch { return null; }
  },
};

/* ═══════════════════════════════════════════════════════════════
   SYNC STATUS INDICATOR
   Call mountSyncindicator() on any page to show a small pill
═══════════════════════════════════════════════════════════════ */
function mountSyncIndicator() {
  const el = document.createElement('div');
  el.id = 'sync-indicator';
  el.style.cssText = 'position:fixed;bottom:1rem;right:1rem;font-size:0.72rem;padding:4px 10px;border-radius:20px;background:var(--surface);border:0.5px solid var(--border);color:var(--text3);z-index:200;display:none;transition:opacity 0.3s';
  document.body.appendChild(el);
  return el;
}

function setSyncStatus(msg, colour) {
  let el = document.getElementById('sync-indicator');
  if (!el) el = mountSyncIndicator();
  el.textContent  = msg;
  el.style.color  = colour || 'var(--text3)';
  el.style.display = 'block';
  el.style.opacity = '1';
  if (colour !== 'syncing') {
    setTimeout(() => { if (el) { el.style.opacity = '0'; setTimeout(() => { el.style.display='none'; },400); } }, 3000);
  }
}

/* ── Pull on page load, show status ── */
async function syncOnLoad() {
  if (!Gist.isConfigured()) return;
  setSyncStatus('↓ Syncing…', 'var(--purple)');
  const ok = await Gist.pull();
  setSyncStatus(ok ? '✓ Synced' : '⚠ Sync failed', ok ? 'var(--teal)' : 'var(--red)');
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT / IMPORT (JSON bank — legacy compat)
═══════════════════════════════════════════════════════════════ */
function exportAllSBAs() {
  // No longer applicable — SBAs are in static files. Export progress instead.
  const blob = new Blob([JSON.stringify(Progress._serialise(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'ucl_y5_progress.json'; a.click();
}

function sanitiseHTML(raw) {
  const tmp = document.createElement('div');
  tmp.innerHTML = raw;
  tmp.querySelectorAll('script').forEach(el => el.remove());
  tmp.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    });
  });
  return tmp.innerHTML;
}
