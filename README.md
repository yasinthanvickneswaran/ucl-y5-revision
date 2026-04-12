# UCL Y5 MBBS Revision Hub

Personal revision site for UCL Year 5 MBBS — 30-day timetable, AI-generated SBA bank, and specialty notes.

**Live site:** https://yasinthanvickneswaran.github.io/ucl-y5-revision

---

## Features

- **30-day timetable** — all 221 core conditions across Modules A, B, C and GP, with checkbox progress tracking
- **SBA bank** — 13 specialty pages with quiz mode, scoring, and edit/delete
- **AI generation** — paste notes or upload PDFs → Claude generates SBAs → you review/edit/approve before saving
- **Export/import** — download your SBA bank as JSON to commit to this repo (makes it available on any device)

---

## Setup (5 minutes)

### 1. Fork or create the repo

```bash
# Option A: clone this and push to your own repo
git clone https://github.com/yasinthanvickneswaran/ucl-y5-revision.git
cd ucl-y5-revision

# Option B: create a new repo on GitHub named ucl-y5-revision
# then push this folder to it
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Source**, choose **GitHub Actions**
3. Push any commit — the site will deploy automatically

Your site will be live at: `https://yasinthanvickneswaran.github.io/ucl-y5-revision`

### 3. Get an Anthropic API key

1. Go to https://console.anthropic.com
2. Create an API key
3. On the live site, go to **Admin** and paste it in — it's stored only in your browser's localStorage

---

## Persisting your SBA bank across devices

Progress (timetable checks) and SBAs are stored in `localStorage` — they persist across sessions on the same browser/device.

To sync across devices:
1. On your main device: **Admin → Export all SBAs as JSON** → downloads `sba_bank.json`
2. Commit this file to the repo root
3. On another device: **Admin → Import JSON** → select the file

---

## File structure

```
/
├── index.html              Homepage
├── timetable/
│   └── index.html          30-day timetable
├── sba/
│   ├── index.html          SBA bank (all specialties)
│   └── specialty.html      Individual specialty quiz page
├── admin/
│   └── index.html          Generate, review, and manage SBAs
├── assets/
│   ├── css/style.css       Shared styles
│   └── js/shared.js        Shared data & utilities
├── sba_bank.json           (optional) exported SBA bank
└── .github/workflows/
    └── deploy.yml          Auto-deploy to GitHub Pages
```

---

## Specialties

| Module | Specialties |
|--------|------------|
| A – CFH | Child Health, CAMHS |
| B – WHMH | Breast, Dermatology, Sexual Health & HIV, Urology, Obstetrics & Gynaecology |
| C – HOPE | Cancer Medicine, Care of the Older Person, Ophthalmology, Palliative Care, Psychiatry |
| GP | General Practice (40 presentations) |

---

## OSCE date: 30 June 2025
