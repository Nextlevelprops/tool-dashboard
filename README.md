# ⚡ Tool Hub — Personal Dashboard for Custom Tools

A clean, self-hosted dashboard to organize, access, and document all your custom HTML tools and web apps.  
Built for: **Next Level Properties LLC** | Version 1.0 | No backend required.

---

## What It Does

- **Cards for every tool** with status, category, tags, and quick-open button
- **Tool detail view** with full instructions, video tutorials, and resource links
- **Add/Edit/Delete/Duplicate** tools via a clean admin form
- **Video embeds** — YouTube, Vimeo, and Loom auto-embed; Google Drive/Dropbox show an Open button
- **Search + filter** by status, category, tag; sort by name, date, category
- **Dark/light mode** toggle
- **LocalStorage persistence** — data survives browser closes
- **JSON export/import** — backup and restore your data anytime

---

## Folder Structure

```
tool-dashboard/
├── index.html             ← Main dashboard
├── styles.css             ← All styling (dark/light themes)
├── app.js                 ← All logic (no dependencies)
├── data/
│   └── sample-tools.json  ← Default sample data (8 tools)
├── tools/                 ← Your actual tool files live here
│   ├── zillow-airdna-lead-viewer/
│   │   └── index.html
│   ├── redfin-property-tracker/
│   │   └── index.html
│   ├── restaurant-map/
│   │   └── index.html
│   └── ... (add more as needed)
└── README.md
```

---

## Quick Start

### Option A: Just Open It
Drop the folder anywhere on your computer and open `index.html` in Chrome or Edge.  
Sample data loads automatically.

> **Note:** When running from `file://`, the dashboard uses embedded sample data (no fetch needed).  
> Everything works except loading from `sample-tools.json` on some browsers — your edits still save to localStorage.

### Option B: Local Dev Server (Recommended)
If you have Node.js installed:

```bash
cd tool-dashboard
npx serve .
```
Then open `http://localhost:3000`.

Or with Python:
```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

---

## Linking Your Tools

The dashboard supports two types of tool URLs:

**Relative links** (tools in the same folder):
```
/tools/zillow-airdna-lead-viewer/index.html
/tools/redfin-property-tracker/index.html
```

**External links** (hosted tools):
```
https://yourapp.vercel.app
https://yourapp.pages.dev
https://docs.google.com/spreadsheets/d/...
http://localhost:3001
```

When editing a tool, paste either type in the **Tool URL** field.

---

## Adding a Tutorial Video

The dashboard detects the video platform automatically:

| Platform | What Happens |
|----------|-------------|
| YouTube (`youtube.com/watch?v=...` or `youtu.be/...`) | Embeds directly in the tool detail panel |
| Vimeo (`vimeo.com/123456`) | Embeds directly |
| Loom (`loom.com/share/...`) | Embeds directly |
| Google Drive, Dropbox, or any other URL | Shows a clean "Open Video" button that opens in a new tab |

Paste the URL into the **Video / Tutorial URL** field when adding or editing a tool.

---

## Backup & Restore

Your data is saved in your browser's `localStorage`. To protect against loss:

**Export backup:**
Click **↓ Export** in the sidebar → downloads a `.json` file with all your tools.

**Import backup:**
Click **↑ Import** → select your `.json` file → confirm.

**Tip:** Export to Google Drive or Dropbox after making big changes.

---

## Hosting Options

### Cloudflare Pages (Recommended — Free)
1. Push your folder to a GitHub repo
2. Log into [dash.cloudflare.com](https://dash.cloudflare.com)
3. Go to Pages → Create a project → Connect GitHub repo
4. Build command: *(leave blank)*  
5. Build output directory: `/` (root)
6. Deploy — you get a `*.pages.dev` URL instantly

**Pros:** Free, fast CDN, custom domain, HTTPS automatic  
**Cons:** Requires GitHub account

---

### GitHub Pages (Free)
1. Push to a GitHub repo (public or private with Pages enabled)
2. Go to repo Settings → Pages → Source: `main` branch, root folder
3. Access at `https://yourusername.github.io/tool-dashboard/`

**Pros:** Free, easy  
**Cons:** Must be public repo (or have GitHub Pro for private Pages)

---

### Netlify (Free Tier)
1. Drag and drop your folder at [netlify.com/drop](https://app.netlify.com/drop)
2. That's it — you get a live URL in under 30 seconds

**Pros:** Fastest deployment, no account needed for basic drop  
**Cons:** Random URL until you connect a domain

---

### Vercel (Free Tier)
```bash
npm i -g vercel
cd tool-dashboard
vercel
```

**Pros:** Fast deploys, great CLI, preview URLs  
**Cons:** Slight overkill for a static HTML project

---

## Important: Browser Storage Limitations

| Concern | Detail |
|---------|--------|
| Data persists across sessions | ✅ Yes, localStorage survives browser closes |
| Data persists across devices | ❌ No — each browser has its own storage |
| What clears your data | Clearing browser cache, private/incognito mode, some browser updates |
| Max storage | ~5MB per domain (enough for hundreds of tools) |
| Solution | Export JSON backup regularly |

---

## Security Note

Version 1 has **no login or password protection**.  

If you host this publicly (e.g., on Cloudflare Pages with a public URL), anyone with the URL can access and edit your dashboard.  

**Options:**
- Keep the URL private / don't share it (simplest)
- Add Cloudflare Access (free for 1 app) — puts a Google login gate in front of your whole site
- In Version 2, add Supabase Auth for a real login system

Front-end-only passwords (e.g., a prompt asking for a password stored in JavaScript) are **not secure** — they can be bypassed by anyone who inspects the code. Don't rely on them for sensitive data.

---

## Version 2 Upgrade Path

When you're ready to go beyond localStorage:

### Supabase (Recommended)
- Free tier, hosted Postgres database
- Add `supabase-js` library
- Replace `localStorage.getItem/setItem` with `supabase.from('tools').select()`
- Add real auth with Google/GitHub login
- Data syncs across all your devices

### Cloudflare D1
- SQLite at the edge, built into Cloudflare
- Pair with Cloudflare Workers for an API layer
- Best if you're already on Cloudflare Pages

### Feature Ideas for V2
- [ ] Tool usage tracking (how often you open each tool)
- [ ] Notes history / changelog per tool
- [ ] File attachments (screenshots, specs)
- [ ] Team access / shared view
- [ ] Notifications for broken tools
- [ ] Tool ratings / personal scoring
- [ ] Import from URL (auto-fill tool name from page title)

---

## Tips

- **⌘K** (or **Ctrl+K**) focuses the search bar from anywhere
- Click any **stat card** at the top to filter by that status
- Click any **tag chip** on a card to filter by that tag
- The sidebar can be **collapsed** with the `‹` button
- **Duplicate** a tool when building a variant of an existing one
- Add `localhost:3001` style URLs for tools in active development

---

*Built for Next Level Properties LLC | Powered by vanilla JS + localStorage*
