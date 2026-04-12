/* ── Shared data & utilities ── */

const SPECIALTIES = [
  { id: "child-health",    label: "Child Health",             module: "a",  conditions: 39 },
  { id: "camhs",           label: "CAMHS",                    module: "a",  conditions: 12 },
  { id: "gp",              label: "General Practice",         module: "gp", conditions: 40 },
  { id: "breast",          label: "Breast",                   module: "b",  conditions: 5  },
  { id: "dermatology",     label: "Dermatology",              module: "b",  conditions: 16 },
  { id: "sexual-health",   label: "Sexual Health & HIV",      module: "b",  conditions: 12 },
  { id: "urology",         label: "Urology",                  module: "b",  conditions: 11 },
  { id: "obs-gynae",       label: "Obstetrics & Gynaecology", module: "b",  conditions: 36 },
  { id: "cancer",          label: "Cancer Medicine",          module: "c",  conditions: 24 },
  { id: "older-person",    label: "Care of the Older Person", module: "c",  conditions: 14 },
  { id: "ophthalmology",   label: "Ophthalmology",            module: "c",  conditions: 28 },
  { id: "palliative",      label: "Palliative Care",          module: "c",  conditions: 6  },
  { id: "psychiatry",      label: "Psychiatry",               module: "c",  conditions: 18 },
];

const MODULE_LABELS = { a: "Module A", b: "Module B", c: "Module C", gp: "GP" };

/* ─────────────────────────────────────────────
   Storage helpers
───────────────────────────────────────────── */
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },

  /* SBA bank */
  getSBAs(specId)           { return this.get(`sba_${specId}`, []); },
  saveSBAs(specId, qs)      { return this.set(`sba_${specId}`, qs); },

  /* Timetable */
  getChecks()               { return this.get('ucl_y5_checks', {}); },
  saveChecks(c)             { return this.set('ucl_y5_checks', c); },

  /* Notes – stored as raw HTML string (not JSON-encoded object) */
  getNotesHTML(specId)      {
    try { return localStorage.getItem(`noteshtml_${specId}`) || ''; }
    catch { return ''; }
  },
  saveNotesHTML(specId, html) {
    try { localStorage.setItem(`noteshtml_${specId}`, html); return true; }
    catch { return false; }
  },
  /* Legacy plain-text notes (kept for admin generation) */
  getNotes(specId)          { return this.get(`notes_${specId}`, ''); },
  saveNotes(specId, text)   { return this.set(`notes_${specId}`, text); },

  /* ── Quiz statistics ─────────────────────── */
  // Structure: { answered: n, correct: n, wrong: [{stem, correct_label, chosen_label, ts}] }
  getQuizStats(specId)      { return this.get(`qstats_${specId}`, { answered:0, correct:0, wrong:[] }); },
  recordAnswer(specId, correct, wrongInfo) {
    const s = this.getQuizStats(specId);
    s.answered++;
    if (correct) { s.correct++; }
    else { s.wrong = [wrongInfo, ...(s.wrong||[])].slice(0, 50); }
    this.set(`qstats_${specId}`, s);
  },
  clearQuizStats(specId)    { this.set(`qstats_${specId}`, { answered:0, correct:0, wrong:[] }); },

  /* ── Manual weakness flags ───────────────── */
  // Structure: { [specId]: ['topic1','topic2',...] }
  getWeaknessFlags()        { return this.get('weakness_flags', {}); },
  addWeaknessFlag(specId, topic) {
    const w = this.getWeaknessFlags();
    if (!w[specId]) w[specId] = [];
    if (!w[specId].includes(topic)) w[specId].push(topic);
    this.set('weakness_flags', w);
  },
  removeWeaknessFlag(specId, topic) {
    const w = this.getWeaknessFlags();
    if (w[specId]) w[specId] = w[specId].filter(t => t !== topic);
    this.set('weakness_flags', w);
  },
};

/* ─────────────────────────────────────────────
   Global quiz progress (all specialties)
───────────────────────────────────────────── */
function getGlobalProgress() {
  let totalAnswered = 0, totalCorrect = 0;
  const bySpec = {};
  SPECIALTIES.forEach(s => {
    const st = Store.getQuizStats(s.id);
    totalAnswered += st.answered;
    totalCorrect  += st.correct;
    bySpec[s.id]  = st;
  });
  const pct = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;
  return { totalAnswered, totalCorrect, pct, bySpec };
}

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ─────────────────────────────────────────────
   Export / Import
───────────────────────────────────────────── */
function exportAllSBAs() {
  const out = {};
  SPECIALTIES.forEach(s => { out[s.id] = Store.getSBAs(s.id); });
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'sba_bank.json'; a.click();
}

function importSBAs(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    Object.entries(data).forEach(([id, qs]) => { if (Array.isArray(qs)) Store.saveSBAs(id, qs); });
    return true;
  } catch { return false; }
}

function countAllSBAs() {
  return SPECIALTIES.reduce((n, s) => n + Store.getSBAs(s.id).length, 0);
}

/* ─────────────────────────────────────────────
   Sanitise uploaded HTML for safe iframe display
   – strips <script>, on* handlers, external resources
───────────────────────────────────────────── */
function sanitiseHTML(raw) {
  const tmp = document.createElement('div');
  tmp.innerHTML = raw;
  // Remove scripts
  tmp.querySelectorAll('script,style[data-x]').forEach(el => el.remove());
  // Strip on* attributes and dangerous hrefs
  tmp.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
      if (attr.name === 'href' && attr.value.startsWith('javascript:')) el.removeAttribute(attr.name);
    });
  });
  return tmp.innerHTML;
}
