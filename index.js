require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const express = require("express");

// ================= AYARLAR =================
const TOKEN = process.env.DISCORD_TOKEN;
const ICTIMA_CHANNEL_ID = "1451620850993336469";
const LOG_CHANNEL_ID = "1451620849907138695";

// ================= DISCORD BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= SLASH KOMUTLAR =================
const slashCommands = [
  new SlashCommandBuilder()
    .setName("komutlar")
    .setDescription("Botun tüm komutlarını gösterir"),

  new SlashCommandBuilder()
    .setName("ceza")
    .setDescription("Askere ceza verir")
    .addUserOption(o =>
      o.setName("asker").setDescription("Asker").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("sebep").setDescription("Sebep").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("izinver")
    .setDescription("Askere izin verir")
    .addUserOption(o =>
      o.setName("asker").setDescription("Asker").setRequired(true)
    )
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  // Slash yükle
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: slashCommands
  });
  console.log("✅ Slash komutlar yüklendi");

  // Roller
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
          reason: "Askerî Kamp Botu"
        });
      }
    }
  });

  // ================= GÜNLÜK İÇTİMA (3 KEZ) =================
  setInterval(sendIctima, 8 * 60 * 60 * 1000); // 8 saatte bir
  sendIctima();
});

// ================= İÇTİMA FONKSİYONU =================
async function sendIctima() {
  try {
    const channel = await client.channels.fetch(ICTIMA_CHANNEL_ID);
    if (!channel) return;

    const sorular = [
      "🪖 İçtima! Bugün görevin nedir?",
      "🪖 İçtima! Komutanın kim?",
      "🪖 İçtima! Disiplinin önemi nedir?",
      "🪖 İçtima! Bugün kaç saat eğitim yapılacak?",
      "🪖 İçtima! Emir–komuta neden önemlidir?"
    ];

    const soru = sorular[Math.floor(Math.random() * sorular.length)];

    await channel.send(`📢 **İÇTİMA ZAMANI!**\n${soru}`);

    // Log
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    logChannel.send("📝 İçtima otomatik olarak gönderildi.");

  } catch (err) {
    console.log("İçtima hatası:", err.message);
  }
}

// ================= KOMUTLAR =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cezaRol = interaction.guild.roles.cache.find(r => r.name === "Ceza");
  const izinRol = interaction.guild.roles.cache.find(r => r.name === "İzinli");
  const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

  // /komutlar
  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu – Komutlar")
      .setColor(0x2f3136)
      .setDescription(`
• /komutlar
• /ceza @asker sebep
• /izinver @asker
      `);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Yetkin yok.", ephemeral: true });
  }

  // /ceza
  if (interaction.commandName === "ceza") {
    const asker = interaction.options.getMember("asker");
    const sebep = interaction.options.getString("sebep");

    await asker.roles.add(cezaRol);
    interaction.reply(`🚫 ${asker} cezalı.\nSebep: **${sebep}**`);

    logChannel.send(`🚫 **CEZA**\nAsker: ${asker}\nSebep: ${sebep}`);
  }

  // /izinver
  if (interaction.commandName === "izinver") {
    const asker = interaction.options.getMember("asker");

    await asker.roles.add(izinRol);
    interaction.reply(`🟢 ${asker} izinli.`);

    logChannel.send(`🟢 **İZİN**\nAsker: ${asker}`);
  }
});

client.login(TOKEN);

// ================= DASHBOARD =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <h1>🪖 Askerî Kamp Botu Dashboard</h1>
    <p>Bot çalışıyor ✅</p>
    <p>Otomatik içtima aktif</p>
    <p>Log sistemi aktif</p>
  `);
});

app.listen(PORT, () => {
  console.log("🌐 Dashboard açık: " + PORT);
});
