# Playit.gg integration in Nodexity

Nodexity optionally uses [playit.gg](https://playit.gg) to give your Minecraft server a public address without port forwarding. The integration runs the official **playit-agent** binary as a background process (no terminal window).

## How it works

- **One agent per server**: Each server can have its own playit agent. The agent is tied to that server’s Minecraft port (from server config, default 25565).
- **Your credentials**: You use your own playit.gg account. Get a secret key from [playit.gg/account/agents](https://playit.gg/account/agents). Nodexity never uses shared credentials.
- **Secret storage**: The app stores the secret in the OS keychain when possible (via `keytar`). If keytar is not available, it falls back to an encrypted file under app data (e.g. `AppData/Roaming/.hexnode/playit/secrets.enc`). The secret is never logged or sent to the renderer after saving.
- **Agent binary**: On first use, Nodexity downloads the correct playit-agent build for your OS/arch from the [playit-agent releases](https://github.com/playit-cloud/playit-agent/releases) into `userData/playit/bin/`. On Windows the process is started with a hidden window (no console).

## Where to use it

1. Open a server in Nodexity.
2. Go to the **EXTERNAL ACCESS** tab.
3. Paste your playit.gg secret key and click **SAVE**.
4. Click **START AGENT**. The agent runs in the background; status and live logs appear in the UI.
5. If the agent prints a claim or connection URL, it is shown and can be copied. You can also open the [playit.gg dashboard](https://playit.gg/dashboard) to add or manage tunnels (e.g. point a tunnel at your server’s local port).

## Attribution and licenses

- The sidebar shows “Powered by playit.gg” and “Powered by Modrinth”.
- **Settings → ABOUT** lists third-party software, including **playit-agent** (with a link to the [playit-agent repo](https://github.com/playit-cloud/playit-agent)) and Modrinth.

## Platform notes

- **Windows**: Agent runs with a hidden console (`CREATE_NO_WINDOW`). No popup.
- **macOS**: No official playit-agent macOS binary; the app may use the Linux build where applicable. For best support, install playit from [playit.gg/download](https://playit.gg/download) and use the system agent if needed.
- **Linux**: Binary is downloaded and made executable (`chmod +x`). Works on common architectures (amd64, aarch64, armv7, i686).

## Manual test checklist

Use this for a quick smoke test of the playit integration.

### Windows

- [ ] Open a server → **EXTERNAL ACCESS** tab. Page loads without errors.
- [ ] Save a playit.gg secret key. “A secret key is saved” (or similar) appears; field does not show the raw key after save.
- [ ] Click **START AGENT**. No console window appears. Status shows “Running” (and optionally “Connected” when the agent connects).
- [ ] Live logs show agent output. If the agent prints a URL, it appears in “Public address” and **COPY** works.
- [ ] Click **STOP**. Agent stops; status shows “Stopped”.
- [ ] Close Nodexity. Reopen; no stray playit processes left behind.

### macOS

- [ ] Same as Windows where applicable. If the app uses a Linux binary, note any arch/behavior differences.
- [ ] If you installed playit from playit.gg, confirm Nodexity does not conflict with the system agent.

### Linux

- [ ] Same as Windows. After **START AGENT**, `playit` binary in app data is executable and the process runs without a visible terminal.
- [ ] Stop and app quit: no orphan playit processes.

### All platforms

- [ ] **Settings → ABOUT**: “playit-agent” and “Modrinth” appear under third-party licenses with correct links.
- [ ] Sidebar: “Powered by playit.gg” and “Powered by Modrinth” are visible and link to the correct sites.
- [ ] Sidebar: Discord and heart (donate/support) icons are present and link correctly.
