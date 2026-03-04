const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { status } = require('minecraft-server-util');
const serverManager = require('../serverManager');
const config = require('./config');

let client = null;
let baseConfig = {
  defaultPrefix: '!',
  defaultMinecraft: {
    host: 'play.example.com',
    port: 25565,
  },
  botOwnerIds: [],
};

let currentToken = null;

const GUILD_CONFIGS_PATH = path.join(config.NODEXITY_DIR, 'discord-guilds.json');

let guildConfigs = {};

function loadGuildConfigs() {
  try {
    if (fs.existsSync(GUILD_CONFIGS_PATH)) {
      const raw = fs.readFileSync(GUILD_CONFIGS_PATH, 'utf8');
      guildConfigs = JSON.parse(raw);
    } else {
      guildConfigs = {};
    }
  } catch (err) {
    console.error('[DiscordBot] Failed to read guild config file, starting empty:', err);
    guildConfigs = {};
  }
}

function saveGuildConfigs() {
  try {
    const dir = path.dirname(GUILD_CONFIGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(GUILD_CONFIGS_PATH, JSON.stringify(guildConfigs, null, 2), 'utf8');
  } catch (err) {
    console.error('[DiscordBot] Failed to save guild configs:', err);
  }
}

function getGuildConfig(guildId) {
  if (!guildId) return { ...baseConfig, prefix: baseConfig.defaultPrefix };
  if (!guildConfigs[guildId]) {
    guildConfigs[guildId] = {
      prefix: baseConfig.defaultPrefix,
      minecraft: { ...baseConfig.defaultMinecraft },
      displayName: null,
    };
  }
  return guildConfigs[guildId];
}

const textCommands = {
  ping: {
    description: 'Check that the bot is alive.',
    execute: async (message) => {
      const sent = await message.reply('Pinging...');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      await sent.edit(`Pong! Latency: ${latency}ms`);
    },
  },
  'mc-status': {
    description: 'Show status of the configured Minecraft server.',
    execute: async (message, args, guildConfig) => {
      const host = guildConfig.minecraft.host;
      const port = guildConfig.minecraft.port;

      const sent = await message.reply(`Checking Minecraft server \`${host}:${port}\` ...`);

      try {
        const res = await status(host, port, { timeout: 5000 });
        const online = res.onlinePlayers;
        const max = res.maxPlayers;
        const version = res.version;
        const motd = res.motd?.clean || res.motd || 'No MOTD';

        await sent.edit(
          `✅ **Minecraft server is online!**\n` +
            `**Address**: \`${host}:${port}\`\n` +
            `**Players**: ${online}/${max}\n` +
            `**Version**: ${version}\n` +
            `**MOTD**: ${motd}`
        );
      } catch (err) {
        console.error('[DiscordBot] Error pinging Minecraft server:', err);
        await sent.edit(
          `⚠️ Could not reach \`${host}:${port}\`. ` +
            `Make sure the address is correct and the server is online.`
        );
      }
    },
  },
  'mc-set': {
    description: 'Configure the Minecraft server for this Discord server. (Admin only)',
    usage: '<host> [port]',
    execute: async (message, args, guildConfig) => {
      if (!message.member?.permissions?.has('Administrator')) {
        return message.reply('You need the **Administrator** permission to use this command.');
      }

      if (!args[0]) {
        return message.reply(
          `Usage: \`${guildConfig.prefix}mc-set <host> [port]\`\n` +
            `Current: \`${guildConfig.minecraft.host}:${guildConfig.minecraft.port}\``
        );
      }

      const host = args[0];
      const port = args[1] ? Number(args[1]) : guildConfig.minecraft.port;
      if (Number.isNaN(port) || port <= 0) {
        return message.reply('Port must be a valid number.');
      }

      guildConfig.minecraft.host = host;
      guildConfig.minecraft.port = port;
      guildConfigs[message.guild.id] = guildConfig;
      saveGuildConfigs();

      return message.reply(`Updated Minecraft server to \`${host}:${port}\` for this Discord server.`);
    },
  },
  'set-prefix': {
    description: 'Change the command prefix for this server. (Admin only)',
    usage: '<newPrefix>',
    execute: async (message, args, guildConfig) => {
      if (!message.member?.permissions?.has('Administrator')) {
        return message.reply('You need the **Administrator** permission to use this command.');
      }

      const newPrefix = args[0];
      if (!newPrefix) {
        return message.reply(
          `Usage: \`${guildConfig.prefix}set-prefix <newPrefix>\`\n` +
            `Current prefix: \`${guildConfig.prefix}\``
        );
      }

      guildConfig.prefix = newPrefix;
      guildConfigs[message.guild.id] = guildConfig;
      saveGuildConfigs();

      return message.reply(`Prefix updated to \`${newPrefix}\`.`);
    },
  },
  'set-name': {
    description:
      'Set a custom nickname for the bot in this server (if I have permission). (Admin only)',
    usage: '<newName | reset>',
    execute: async (message, args, guildConfig) => {
      if (!message.member?.permissions?.has('Administrator')) {
        return message.reply('You need the **Administrator** permission to use this command.');
      }

      if (!message.guild?.members?.me) {
        return message.reply('I cannot manage my nickname in this server.');
      }

      const sub = args[0];
      if (!sub) {
        return message.reply(
          `Usage: \`${guildConfig.prefix}set-name <newName | reset>\`\n` +
            `Current nickname: \`${guildConfig.displayName || 'none'}\``
        );
      }

      if (sub.toLowerCase() === 'reset') {
        guildConfig.displayName = null;
        guildConfigs[message.guild.id] = guildConfig;
        saveGuildConfigs();

        try {
          await message.guild.members.me.setNickname(null);
        } catch (err) {
          console.error('[DiscordBot] Failed to reset nickname:', err);
        }

        return message.reply('Nickname reset to default bot name.');
      }

      const newName = args.join(' ');
      guildConfig.displayName = newName;
      guildConfigs[message.guild.id] = guildConfig;
      saveGuildConfigs();

      try {
        await message.guild.members.me.setNickname(newName);
      } catch (err) {
        console.error('[DiscordBot] Failed to set nickname:', err);
      }

      return message.reply(`Bot nickname updated to \`${newName}\`.`);
    },
  },
  'nx-servers': {
    description: 'Show status of Nodexity-managed servers.',
    execute: async (message) => {
      try {
        const servers = await serverManager.listServers();
        if (!servers || servers.length === 0) {
          return message.reply('No servers are configured in Nodexity yet.');
        }
        const lines = servers.map((s) => {
          const statusText = s.status || 'UNKNOWN';
          const players =
            typeof s.playersOnline === 'number' && typeof s.playersMax === 'number'
              ? ` | Players: ${s.playersOnline}/${s.playersMax}`
              : '';
          return `• **${s.name || s.id}** – ${statusText}${players}`;
        });
        return message.reply(
          `**Nodexity Servers**\n` +
            lines.join('\n') +
            `\n\nUse the desktop app to start, stop, and manage servers.`
        );
      } catch (err) {
        console.error('[DiscordBot] Failed to load Nodexity servers:', err);
        return message.reply('Failed to load Nodexity server information.');
      }
    },
  },
  help: {
    description: 'Show available commands.',
    execute: async (message, args, guildConfig) => {
      const prefix = guildConfig.prefix;
      const lines = Object.entries(textCommands).map(([name, cmd]) => {
        const usage = cmd.usage ? ` ${cmd.usage}` : '';
        return `\`${prefix}${name}${usage}\` - ${cmd.description}`;
      });

      return message.reply(
        `**Available commands**\n` +
          lines.join('\n') +
          `\n\nPrefix for this server: \`${prefix}\``
      );
    },
  },
};

async function stopDiscordBot() {
  if (client) {
    try {
      await client.destroy();
    } catch (err) {
      console.error('[DiscordBot] Error while destroying client:', err);
    }
    client = null;
    currentToken = null;
  }
}

async function applyDiscordBotSettings(appSettings) {
  const discord = appSettings?.discordBot || {};
  const enabled = discord.enabled !== false;
  const tokenRaw = discord.token ? String(discord.token).trim() : '';

  if (!enabled || !tokenRaw) {
    if (client) {
      console.log('[DiscordBot] Disabled via settings or no token; stopping bot.');
      await stopDiscordBot();
    }
    return;
  }

  baseConfig = {
    defaultPrefix: discord.defaultPrefix || '!',
    defaultMinecraft: {
      host: discord.defaultHost || 'play.example.com',
      port: Number(discord.defaultPort) || 25565,
    },
    botOwnerIds: [],
  };

  if (client && currentToken === tokenRaw) {
    return;
  }

  await stopDiscordBot();

  currentToken = tokenRaw;
  loadGuildConfigs();

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once('ready', () => {
    console.log('[DiscordBot] Logged in as', client.user?.tag);
    const prefix = baseConfig.defaultPrefix || '!';
    const host = baseConfig.defaultMinecraft.host;
    client.user
      ?.setActivity(`MC: ${host} | ${prefix}help`, { type: 0 })
      .catch(() => {});
  });

  client.on('guildCreate', (guild) => {
    console.log('[DiscordBot] Joined guild:', guild.name, `(${guild.id})`);
    const cfg = getGuildConfig(guild.id);
    if (cfg.displayName && guild.members.me) {
      guild.members.me.setNickname(cfg.displayName).catch(() => {});
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildConfig = getGuildConfig(message.guild.id);
    const prefix = guildConfig.prefix || baseConfig.defaultPrefix;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = textCommands[commandName];
    if (!command) return;

    try {
      await command.execute(message, args, guildConfig);
    } catch (err) {
      console.error(`[DiscordBot] Error running command ${commandName}:`, err);
      message.reply('Something went wrong executing that command.').catch(() => {});
    }
  });

  try {
    await client.login(tokenRaw);
  } catch (err) {
    console.error('[DiscordBot] Failed to login; disabling bot:', err);
    await stopDiscordBot();
  }
}

module.exports = {
  applyDiscordBotSettings,
  stopDiscordBot,
};

