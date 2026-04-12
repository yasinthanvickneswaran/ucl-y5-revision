/* ── Shared data & utilities ── */

const SPECIALTIES = [
  { id: "child-health",    label: "Child Health",          module: "a", conditions: 39 },
  { id: "camhs",           label: "CAMHS",                 module: "a", conditions: 12 },
  { id: "gp",              label: "General Practice",      module: "gp", conditions: 40 },
  { id: "breast",          label: "Breast",                module: "b", conditions: 5  },
  { id: "dermatology",     label: "Dermatology",           module: "b", conditions: 16 },
  { id: "sexual-health",   label: "Sexual Health & HIV",   module: "b", conditions: 12 },
  { id: "urology",         label: "Urology",               module: "b", conditions: 11 },
  { id: "obs-gynae",       label: "Obstetrics & Gynaecology", module: "b", conditions: 36 },
  { id: "cancer",          label: "Cancer Medicine",       module: "c", conditions: 24 },
  { id: "older-person",    label: "Care of the Older Person", module: "c", conditions: 14 },
  { id: "ophthalmology",   label: "Ophthalmology",         module: "c", conditions: 28 },
  { id: "palliative",      label: "Palliative Care",       module: "c", conditions: 6  },
  { id: "psychiatry",      label: "Psychiatry",            module: "c", conditions: 18 },
];

const MODULE_LABELS = { a: "Module A", b: "Module B", c: "Module C", gp: "GP" };

/* ── Storage helpers ── */
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  // SBA bank: keyed by specialty id
  getSBAs(specId) { return this.get(`sba_${specId}`, []); },
  saveSBAs(specId, questions) { return this.set(`sba_${specId}`, questions); },
  // Timetable checks
  getChecks() { return this.get('ucl_y5_checks', {}); },
  saveChecks(checks) { return this.set('ucl_y5_checks', checks); },
  // Source notes per specialty
  getNotes(specId) { return this.get(`notes_${specId}`, ''); },
  saveNotes(specId, text) { return this.set(`notes_${specId}`, text); },
};

/* ── Toast ── */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

/* ── Active nav link ── */
function setActiveNav() {
  const path = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', path.endsWith(a.getAttribute('href').replace('./', '')));
  });
}

/* ── Export all SBAs as JSON ── */
function exportAllSBAs() {
  const out = {};
  SPECIALTIES.forEach(s => { out[s.id] = Store.getSBAs(s.id); });
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sba_bank.json';
  a.click();
}

/* ── Import SBAs from JSON ── */
function importSBAs(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    Object.entries(data).forEach(([id, qs]) => { if (Array.isArray(qs)) Store.saveSBAs(id, qs); });
    return true;
  } catch { return false; }
}

/* ── Count total SBAs ── */
function countAllSBAs() {
  return SPECIALTIES.reduce((n, s) => n + Store.getSBAs(s.id).length, 0);
}
