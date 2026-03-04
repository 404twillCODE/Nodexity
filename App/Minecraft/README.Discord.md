## Nodexity Minecraft – Discord Bot Integration

This desktop app includes a **built-in Discord bot** so your community can see Minecraft and Nodexity server information right inside Discord.

Everything runs **inside this app** – no separate Node project is required.

---

### 1. Create a Discord bot (one-time)

1. Go to the Discord Developer Portal (`https://discord.com/developers/applications`).
2. Click **"New Application"**, give it a name (you can change it later), and create it.
3. In the **Bot** tab:
   - Click **"Add Bot"** (if there is no bot yet).
   - Enable **"Message Content Intent"**.
   - (Optional) Enable **"Server Members Intent"** for nickname changes and future features.
4. Copy the **Bot Token** – you will paste this into Nodexity.
5. In the **General Information** tab, copy the **Application (Client) ID** – you will also paste this into Nodexity.

> Keep your bot token secret. Do **not** share it publicly.

---

### 2. Enable Discord integration in Nodexity

1. Launch the **Nodexity Minecraft** desktop app.
2. In the left sidebar, click the **Discord** tab (Discord icon).
3. In the **Discord Bot Settings** section:
   - Toggle **"Enable Discord integration"** **ON**.
   - Paste your **Bot Token** into the **Bot Token** field.
   - Paste your **Application (Client) ID** into the **Application (Client) ID** field.
   - Set your **Default Command Prefix** (for example `!` or `?`).
4. In the **Minecraft Defaults for Bot** section:
   - Set **Default Server Address** (for example `play.example.com`).
   - Set **Default Port** (for example `25565`).

Nodexity saves these values in your **local app settings** and automatically starts the Discord bot **inside the app** when:

- The app is running, and
- Discord integration is enabled, and
- A valid token is configured.

If you change the settings and click away, Nodexity will re-apply them and restart or stop the bot as needed.

---

### 3. Invite the bot to your Discord server

1. Once you have entered your **Application (Client) ID**, Nodexity shows an **Invite URL** in the Discord tab.
2. Copy the Invite URL, paste it into your browser, and choose the Discord server where you want to add the bot.
3. Accept the permissions and confirm.

> If you change permissions in the Developer Portal later, regenerate the invite link there.

---

### 4. Using the bot in Discord

With Nodexity open and Discord integration enabled, your bot will be online in the servers you invited it to.

By default, the prefix is `!` (or whatever you configured). Use these commands in Discord:

- `!help` – list all available commands.
- `!ping` – check that the bot is alive.
- `!mc-status` – show the status of the configured Minecraft server (online/offline, players, version, MOTD).
- `!mc-set <host> [port]` – set the Minecraft server for the current Discord server (Admin only).
- `!set-prefix <newPrefix>` – change the command prefix for this Discord server (Admin only).
- `!set-name <new name | reset>` – set or reset the bot’s nickname in the current server (Admin only).
- `!nx-servers` – list Nodexity-managed servers and their status.

Each Discord server can have its own prefix, Minecraft server address and nickname – this is stored per-guild in `discord-guilds.json` inside your Nodexity data directory.

---

### 5. Troubleshooting

- **Bot shows as offline**
  - Make sure the **Nodexity app is running**.
  - Ensure **Discord integration is enabled** in the Discord tab.
  - Check that the **Bot Token** is correct (no extra spaces).
  - If you recently regenerated the token in the Developer Portal, paste the new one into Nodexity.

- **Commands don’t respond**
  - Make sure you are using the **correct prefix** for that server (`!set-prefix` may have changed it).
  - Check that the bot has permission to **read and send messages** in that channel.
  - Ensure **Message Content Intent** is enabled in the Developer Portal.

- **Minecraft status always fails**
  - Verify the **Default Server Address** and **Port** in Nodexity’s Discord tab.
  - Confirm that the Minecraft server is reachable from the public internet (or from the machine Nodexity runs on).

If you run into issues or have ideas for more Discord features, feel free to open an issue or pull request on GitHub.

