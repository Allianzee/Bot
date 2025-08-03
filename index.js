const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const OWNER_ID = process.env.OWNER_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL'],
});

// ==== Slash Commands ====
client.once('ready', async () => {
  console.log(`🟢 Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('Send a message to a channel')
      .addChannelOption(opt =>
        opt.setName('channel').setDescription('Where to send').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(opt =>
        opt.setName('message').setDescription('What to say').setRequired(true))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Send an embed')
      .addChannelOption(opt =>
        opt.setName('channel').setDescription('Where to send').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(opt =>
        opt.setName('title').setDescription('Embed title').setRequired(true))
      .addStringOption(opt =>
        opt.setName('description').setDescription('Embed text').setRequired(true))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('dm')
      .setDescription('DM a user')
      .addUserOption(opt =>
        opt.setName('target').setDescription('Who to DM').setRequired(true))
      .addStringOption(opt =>
        opt.setName('message').setDescription('What to send').setRequired(true))
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
});

// ==== Slash Command Handler ====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ You can’t use this', ephemeral: true });
  }

  const cmd = interaction.commandName;

  if (cmd === 'say') {
    const channel = interaction.options.getChannel('channel');
    const msg = interaction.options.getString('message');
    await channel.send(msg);
    await interaction.reply({ content: '✅ Message sent!', ephemeral: true });
  }

  if (cmd === 'embed') {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const desc = interaction.options.getString('description');
    const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(0x00BFFF).setTimestamp();
    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Embed sent!', ephemeral: true });
  }

  if (cmd === 'dm') {
    const user = interaction.options.getUser('target');
    const msg = interaction.options.getString('message');
    try {
      await user.send(msg);
      await interaction.reply({ content: '✅ DM sent!', ephemeral: true });
    } catch {
      await interaction.reply({ content: '❌ Couldn’t DM them.', ephemeral: true });
    }
  }
});

// ==== Auto Message Every X Mins ====
const AUTO_CHANNEL_ID = process.env.AUTO_CHANNEL_ID;
const AUTO_MSG = process.env.AUTO_MSG || "🚨 Reminder: Check out the new event!";
const AUTO_INTERVAL = parseInt(process.env.AUTO_INTERVAL_MINS || "5") * 60000;

client.on('ready', () => {
  setInterval(() => {
    const channel = client.channels.cache.get(AUTO_CHANNEL_ID);
    if (channel) channel.send(AUTO_MSG);
  }, AUTO_INTERVAL);
});

// ==== Log DMs to You ====
client.on('messageCreate', async msg => {
  if (!msg.guild && msg.author.id !== client.user.id) {
    const owner = await client.users.fetch(OWNER_ID);
    owner.send(`📩 **${msg.author.tag}** sent: ${msg.content}`);
  }
});

client.login(TOKEN);
