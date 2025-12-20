const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

// ================= SLASH KOMUTLAR =================
const commands = [
  new SlashCommandBuilder()
    .setName("komutlar")
    .setDescription("Botun tüm komutlarını gösterir"),

  new SlashCommandBuilder()
    .setName("ceza")
    .setDescription("Askere ceza verir")
    .addUserOption(o =>
      o.setName("asker").setDescription("Cezalandırılacak asker").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("sebep").setDescription("Ceza sebebi").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("cezakaldir")
    .setDescription("Askerin cezasını kaldırır")
    .addUserOption(o =>
      o.setName("asker").setDescription("Cezası kaldırılacak asker").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("izinver")
    .setDescription("Askere izin verir")
    .addUserOption(o =>
      o.setName("asker").setDescription("İzin verilecek asker").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("sebep").setDescription("İzin sebebi").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("izinkaldir")
    .setDescription("Askerin iznini kaldırır")
    .addUserOption(o =>
      o.setName("asker").setDescription("İzni kaldırılacak asker").setRequired(true)
    )
].map(cmd => cmd.toJSON());

// ================= BOT READY =================
client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  // Slash komut yükleme
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
  console.log("✅ Slash komutlar yüklendi");

  // Roller otomatik oluşturma
  client.guilds.cache.forEach(async guild => {
    const roles = [
      { name: "Ceza", color: "Red" },
      { name: "İzinli", color: "Green" }
    ];

    for (const r of roles) {
      if (!guild.roles.cache.find(role => role.name === r.name)) {
        await guild.roles.create({
          name: r.name,
          color: r.color,
          reason: "Askerî Kamp Botu – Otomatik Rol"
        });
        console.log(`🆕 ${r.name} rolü oluşturuldu (${guild.name})`);
      }
    }
  });
});

// ================= KOMUTLAR =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cezaRol = interaction.guild.roles.cache.find(r => r.name === "Ceza");
  const izinRol = interaction.guild.roles.cache.find(r => r.name === "İzinli");

  // /komutlar
  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("|BIG| Turkish Army Forces – Komutlar")
      .setColor(0x2f3136)
      .setDescription(`
👤 **Genel**
• /komutlar

🚫 **Ceza**
• /ceza @asker sebep
• /cezakaldir @asker

🟢 **İzin**
• /izinver @asker sebep
• /izinkaldir @asker
      `);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Yetki kontrolü
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Yetkin yok.", ephemeral: true });
  }

  // /ceza
  if (interaction.commandName === "ceza") {
    const asker = interaction.options.getMember("asker");
    const sebep = interaction.options.getString("sebep");

    await asker.roles.add(cezaRol);
    return interaction.reply(`🟥 ${asker} cezalandırıldı.\n📄 Sebep: **${sebep}**`);
  }

  // /cezakaldir
  if (interaction.commandName === "cezakaldir") {
    const asker = interaction.options.getMember("asker");

    await asker.roles.remove(cezaRol);
    return interaction.reply(`🟢 ${asker} cezası kaldırıldı.`);
  }

  // /izinver
  if (interaction.commandName === "izinver") {
    const asker = interaction.options.getMember("asker");
    const sebep = interaction.options.getString("sebep");

    await asker.roles.add(izinRol);
    return interaction.reply(`🟢 ${asker} izinli.\n📄 Sebep: **${sebep}**`);
  }

  // /izinkaldir
  if (interaction.commandName === "izinkaldir") {
    const asker = interaction.options.getMember("asker");

    await asker.roles.remove(izinRol);
    return interaction.reply(`🟢 ${asker} izni kaldırıldı.`);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
