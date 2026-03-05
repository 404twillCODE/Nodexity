/**
 * Discord bot for remote ARK server management via slash commands.
 * Adapted for Nodexity's multi-server architecture.
 */
const { EventEmitter } = require('events');

let discord;
try {
  discord = require('discord.js');
} catch {
  discord = null;
}

class DiscordBot extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.config = null;
    this.running = false;
    this.logs = [];
    this.startTime = null;
    this.zeroPlayersSince = new Map();
    this._uptimeTimer = null;
    this._autoShutdownTimer = null;
    this._serverManager = null;
  }

  _log(message, level = 'INFO') {
    const ts = new Date().toLocaleTimeString();
    const entry = { timestamp: ts, level, message };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.emit('log', entry);
  }

  setServerManager(sm) {
    this._serverManager = sm;
  }

  async start(botConfig) {
    if (this.running) return;
    if (!discord) throw new Error('discord.js is not installed. Run: npm install discord.js');

    this.config = botConfig;
    if (!botConfig.token) throw new Error('Discord bot token not configured');

    const { Client, GatewayIntentBits } = discord;
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

    this.client.on('ready', async () => {
      this._log(`Bot logged in as ${this.client.user.tag}`, 'SUCCESS');
      await this._registerCommands();
      this._startBackgroundTasks();
      this.emit('status', this.getStatus());
    });

    this.client.on('interactionCreate', (interaction) => this._handleInteraction(interaction));

    this.client.on('error', (err) => {
      this._log(`Discord error: ${err.message}`, 'ERROR');
    });

    try {
      await this.client.login(botConfig.token);
      this.running = true;
      this.startTime = new Date();
      this._log('Bot started successfully', 'SUCCESS');
    } catch (err) {
      this._log(`Failed to start bot: ${err.message}`, 'ERROR');
      throw err;
    }
  }

  async stop() {
    if (!this.running) return;
    this._stopBackgroundTasks();
    try {
      if (this.client) {
        this.client.destroy();
        this.client = null;
      }
    } catch {}
    this.running = false;
    this.startTime = null;
    this._log('Bot stopped', 'INFO');
    this.emit('status', this.getStatus());
  }

  getStatus() {
    return {
      running: this.running,
      username: this.client?.user?.tag || null,
      guilds: this.client?.guilds?.cache?.size || 0,
    };
  }

  getLogs() {
    return [...this.logs];
  }

  updateConfig(botConfig) {
    this.config = botConfig;
  }

  async _registerCommands() {
    if (!discord) return;
    const { SlashCommandBuilder } = discord;
    try {
      const cmd = new SlashCommandBuilder()
        .setName('ark')
        .setDescription('ARK server commands')
        .addSubcommand(s => s.setName('start').setDescription('Start an ARK server')
          .addStringOption(o => o.setName('server').setDescription('Server name').setRequired(false)))
        .addSubcommand(s => s.setName('stop').setDescription('Stop an ARK server')
          .addStringOption(o => o.setName('server').setDescription('Server name').setRequired(false)))
        .addSubcommand(s => s.setName('restart').setDescription('Restart an ARK server')
          .addStringOption(o => o.setName('server').setDescription('Server name').setRequired(false)))
        .addSubcommand(s => s.setName('status').setDescription('Show server status'))
        .addSubcommand(s => s.setName('ip').setDescription('Get instructions on how to join'))
        .addSubcommand(s => s.setName('help').setDescription('Show ARK server command help'))
        .addSubcommand(s => s.setName('update').setDescription('Update the ARK server')
          .addBooleanOption(o => o.setName('force').setDescription('Force update even if ahead')));

      await this.client.application.commands.set([cmd]);
      this._log('Slash commands registered', 'SUCCESS');
    } catch (err) {
      this._log(`Failed to register commands: ${err.message}`, 'ERROR');
    }
  }

  _isAllowed(interaction) {
    const allowed = this.config.allowedUserIds || [];
    if (allowed.length === 0) return true;
    return allowed.includes(interaction.user.id);
  }

  async _handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'ark') return;

    const sub = interaction.options.getSubcommand();
    this._log(`Command: /ark ${sub} from ${interaction.user.tag}`);

    try {
      switch (sub) {
        case 'start': return await this._cmdStart(interaction);
        case 'stop': return await this._cmdStop(interaction);
        case 'restart': return await this._cmdRestart(interaction);
        case 'status': return await this._cmdStatus(interaction);
        case 'ip': return await this._cmdIp(interaction);
        case 'help': return await this._cmdHelp(interaction);
        case 'update': return await this._cmdUpdate(interaction);
      }
    } catch (err) {
      this._log(`Command error: ${err.message}`, 'ERROR');
      try {
        const msg = `**Error:** ${err.message}`;
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: msg });
        } else {
          await interaction.reply({ content: msg, ephemeral: true });
        }
      } catch {}
    }
  }

  async _resolveServer(interaction) {
    if (!this._serverManager) throw new Error('Server manager not available');
    const serverArg = interaction.options?.getString?.('server');
    const arkLifecycle = this._serverManager.arkLifecycle;
    if (!arkLifecycle) throw new Error('ARK lifecycle not available');
    const servers = await arkLifecycle.listServers();
    if (servers.length === 0) throw new Error('No servers configured');
    if (serverArg) {
      const found = servers.find(s => s.id === serverArg || s.name.toLowerCase() === serverArg.toLowerCase());
      if (!found) throw new Error(`Server "${serverArg}" not found`);
      return found;
    }
    return servers[0];
  }

  async _cmdStart(interaction) {
    if (!this._isAllowed(interaction)) {
      return interaction.reply({ content: 'You are not allowed to use this command.', ephemeral: true });
    }
    await interaction.reply({ content: '**Starting ARK server...**', ephemeral: true });
    try {
      const server = await this._resolveServer(interaction);
      const arkLifecycle = this._serverManager.arkLifecycle;
      const result = await arkLifecycle.startServer(server.id);
      if (result.success) {
        this._log(`Start command: ${server.name} started via Discord`, 'SUCCESS');
        await interaction.editReply({ content: `**ARK server "${server.name}" is starting!**` });
      } else {
        await interaction.editReply({ content: `**Failed:** ${result.error}` });
      }
    } catch (err) {
      await interaction.editReply({ content: `**Failed:** ${err.message}` });
    }
  }

  async _cmdStop(interaction) {
    if (!this._isAllowed(interaction)) {
      return interaction.reply({ content: 'You are not allowed to use this command.', ephemeral: true });
    }
    await interaction.reply({ content: '**Stopping ARK server...**', ephemeral: true });
    try {
      const server = await this._resolveServer(interaction);
      const arkLifecycle = this._serverManager.arkLifecycle;
      const result = await arkLifecycle.stopServer(server.id);
      if (result.success) {
        this._log(`Server "${server.name}" stopped via Discord`, 'SUCCESS');
        await interaction.editReply({ content: `**ARK server "${server.name}" has been stopped!**` });
      } else {
        await interaction.editReply({ content: `**Failed:** ${result.error}` });
      }
    } catch (err) {
      await interaction.editReply({ content: `**Failed:** ${err.message}` });
    }
  }

  async _cmdRestart(interaction) {
    if (!this._isAllowed(interaction)) {
      return interaction.reply({ content: 'You are not allowed to use this command.', ephemeral: true });
    }
    await interaction.reply({ content: '**Restarting ARK server...**', ephemeral: true });
    try {
      const server = await this._resolveServer(interaction);
      const arkLifecycle = this._serverManager.arkLifecycle;
      const result = await arkLifecycle.restartServer(server.id);
      if (result.success) {
        this._log(`Server "${server.name}" restarted via Discord`, 'SUCCESS');
        await interaction.editReply({ content: `**ARK server "${server.name}" has restarted!**` });
      } else {
        await interaction.editReply({ content: `**Failed:** ${result.error}` });
      }
    } catch (err) {
      await interaction.editReply({ content: `**Failed:** ${err.message}` });
    }
  }

  async _cmdStatus(interaction) {
    if (!discord) return;
    const { EmbedBuilder } = discord;
    try {
      const arkLifecycle = this._serverManager?.arkLifecycle;
      if (!arkLifecycle) throw new Error('Server manager not available');
      const servers = await arkLifecycle.listServers();
      const embed = new EmbedBuilder().setTitle('ARK Server Status').setColor(0x3498DB);
      if (servers.length === 0) {
        embed.setDescription('No servers configured.');
      } else {
        for (const s of servers) {
          const statusIcon = s.status === 'RUNNING' ? '🟢' : s.status === 'STARTING' ? '🟡' : '🔴';
          embed.addFields({
            name: `${statusIcon} ${s.name}`,
            value: `Status: ${s.status} | Port: ${s.port} | Map: ${s.serverType || 'TheIsland'}`,
            inline: false
          });
        }
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `**Error:** ${err.message}`, ephemeral: true });
    }
  }

  async _cmdIp(interaction) {
    if (!discord) return;
    const { EmbedBuilder } = discord;
    const joinIp = this.config.serverJoinIp || 'Not configured';
    const joinPort = this.config.serverJoinPort || '';
    const serverPw = this.config.serverPassword || '';
    const address = joinPort ? `${joinIp}:${joinPort}` : joinIp;

    const embed = new EmbedBuilder()
      .setTitle('How to Join the ARK Server')
      .setDescription(
        '**Step 1:** Open ARK and Steam\n' +
        '**Step 2:** In Steam, go to **View** > **Game Servers** > **Favorites**\n' +
        '**Step 3:** Click the **+ plus button** on the middle bottom right\n' +
        `**Step 4:** Paste this address:\n\`\`\`\n${address}\n\`\`\`\n` +
        (serverPw ? `**Step 5:** Password:\n\`\`\`\n${serverPw}\n\`\`\`\n` : '') +
        '**Step 6:** Load ARK normally and click **Join ARK** to find the server!'
      )
      .setColor(0x2ECC71);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async _cmdHelp(interaction) {
    if (!discord) return;
    const { EmbedBuilder } = discord;
    const embed = new EmbedBuilder()
      .setTitle('ARK Server Commands')
      .setDescription(
        '**Available Commands:**\n\n' +
        '`/ark start [server]` - Start an ARK server\n' +
        '`/ark stop [server]` - Stop an ARK server\n' +
        '`/ark restart [server]` - Restart an ARK server\n' +
        '`/ark status` - Show all server statuses\n' +
        '`/ark update` - Update the server via SteamCMD\n' +
        '`/ark ip` - How to join the server\n' +
        '`/ark help` - Show this help message'
      )
      .setColor(0x3498DB);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async _cmdUpdate(interaction) {
    if (!this._isAllowed(interaction)) {
      return interaction.reply({ content: 'You are not allowed to use this command.', ephemeral: true });
    }
    const force = interaction.options.getBoolean('force') || false;
    await interaction.reply({ content: '**Checking for updates...**', ephemeral: true });
    try {
      const steamcmd = this._serverManager?.steamcmd;
      if (!steamcmd) throw new Error('SteamCMD module not available');
      const result = await steamcmd.updateServer(
        (msg) => interaction.editReply({ content: msg }).catch(() => {}),
        force,
      );
      const icon = result.success ? 'Done:' : 'Failed:';
      await interaction.editReply({ content: `**${icon}** ${result.message}` });
    } catch (err) {
      await interaction.editReply({ content: `**Failed:** ${err.message}` });
    }
  }

  _startBackgroundTasks() {
    if (!discord) return;
    const { ActivityType } = discord;
    this._uptimeTimer = setInterval(() => {
      if (!this.client?.user) return;
      try {
        const arkLifecycle = this._serverManager?.arkLifecycle;
        if (!arkLifecycle) return;
        arkLifecycle.listServers().then((servers) => {
          const running = servers.filter(s => s.status === 'RUNNING');
          if (running.length > 0) {
            this.client.user.setActivity(`${running.length} ARK server(s) online`, { type: ActivityType.Playing });
          } else {
            this.client.user.setActivity('ARK Servers — All Offline', { type: ActivityType.Playing });
          }
        }).catch(() => {});
      } catch {}
    }, 15000);
  }

  _stopBackgroundTasks() {
    if (this._uptimeTimer) { clearInterval(this._uptimeTimer); this._uptimeTimer = null; }
    if (this._autoShutdownTimer) { clearInterval(this._autoShutdownTimer); this._autoShutdownTimer = null; }
  }
}

module.exports = DiscordBot;
