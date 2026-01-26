## Next steps (moving computers)

This file is a checklist so you can pick up fast on a new machine.

### 1) Get the repo on the new machine
- Install Git + Node.js (v20+) + Java (for Minecraft servers)
- Clone:
  ```bash
  git clone https://github.com/404twillCODE/Hexnode.git
  cd Hexnode
  ```

### 2) Run the Desktop App (dev)
```bash
cd App
npm install
npm run dev
```

### 3) Run the Website (dev)
```bash
cd Website
npm install
npm run dev
```
Website runs on port `4000` (see `Website/package.json`).

### 4) Community + marketing
- Discord invite (public): `https://discord.gg/RVTAEbdDBJ`
- Add a “Join Discord” CTA on the website hero (optional)
- Add donation links when ready (GitHub Sponsors / Ko-fi / PayPal) and update:
  - `DONATE.md`
  - Website footer
  - README

### 5) GitHub setup (recommended)
- Enable GitHub Discussions (optional)
- Enable Security Advisories (for private vulnerability reports)
- Create 3 labels: `bug`, `enhancement`, `help wanted`

### 6) Release prep (later)
- Add screenshots + short demo GIF to `README.md`
- Create a GitHub Release checklist
- Decide installer/update story (Electron Builder already present)

