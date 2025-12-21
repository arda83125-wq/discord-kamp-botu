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
const PORT = process.env.PORT || 3000;

const ICTIMA_CHANNEL_ID = "1451620850993336469";
const LOG_CHANNEL_ID = "1451620849907138695";

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ================= GÜVENLİ KANAL ÇEKME =================
async function getChannelSafe(id) {
  try {
    return await client.channels.fetch(id);
  } catch {
    console.log("⚠️ Kanal erişilemedi:", id);
    return null;
  }
}

// ================= SLASH KOMUTLAR =================
const commands = [
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
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log("✅ Slash komutlar yüklendi");

  // Roller
  client.guilds.cache.forEach(async guild => {
    const roles = [
      { name: "Ceza", color: "Red" },
      { name: "İzinli", color: "Green" }
    ];

    for (const r of roles) {
      if (!guild.roles.cache.find(role => role.name === r.name)) {
        try {
          await guild.roles.create({
            name: r.name,
            color: r.color,
            reason: "Askerî Kamp Botu"
          });
          console.log(`🆕 ${r.name} rolü oluşturuldu`);
        } catch (e) {
          console.log("⚠️ Rol oluşturulamadı:", r.name);
        }
      }
    }
  });

  // ⏰ 8 saatte bir içtima (günde 3 kez)
  setInterval(sendIctima, 8 * 60 * 60 * 1000);
  sendIctima();
});

// ================= İÇTİMA =================
async function sendIctima() {
  const channel = await getChannelSafe(ICTIMA_CHANNEL_ID);
  if (!channel) return;

  const sorular = [
    "🪖 İçtima! Disiplin nedir?",
    "🪖 İçtima! Emir–komuta zinciri neden önemlidir?",
    "🪖 İçtima! Askerin görevi nedir?",
    "🪖 İçtima! Birliğin önemi nedir?"
  ];

  const soru = sorular[Math.floor(Math.random() * sorular.length)];
  await channel.send(`📢 **İÇTİMA ZAMANI**\n${soru}`);

  const log = await getChannelSafe(LOG_CHANNEL_ID);
  if (log) log.send("📝 Otomatik içtima gönderildi.");
}

// ================= KOMUTLAR =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cezaRol = interaction.guild.roles.cache.find(r => r.name === "Ceza");
  const izinRol = interaction.guild.roles.cache.find(r => r.name === "İzinli");

  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu")
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

  const log = await getChannelSafe(LOG_CHANNEL_ID);

  if (interaction.commandName === "ceza") {
    const asker = interaction.options.getMember("asker");
    const sebep = interaction.options.getString("sebep");

    if (cezaRol) await asker.roles.add(cezaRol);
    await interaction.reply(`🚫 ${asker} cezalı.\nSebep: **${sebep}**`);

    if (log) log.send(`🚫 CEZA → ${asker.user.tag} | ${sebep}`);
  }

  if (interaction.commandName === "izinver") {
    const asker = interaction.options.getMember("asker");

    if (izinRol) await asker.roles.add(izinRol);
    await interaction.reply(`🟢 ${asker} izinli.`);

    if (log) log.send(`🟢 İZİN → ${asker.user.tag}`);
  }
});

// ================= LOGIN =================
client.login(TOKEN);

// ================= DASHBOARD =================
const app = express();

app.get("/", (req, res) => {
  res.send(`
    <h1>🪖 Askerî Kamp Botu</h1>
    <p>Bot çalışıyor ✅</p>
    <p>Otomatik içtima aktif</p>
    <p>Log sistemi aktif</p>
  `);
});

app.listen(PORT, () => {
  console.log("🌐 Dashboard açık | Port:", PORT);
});

// ================= CRASH KORUMA =================
process.on("unhandledRejection", err => {
  console.error("❌ UNHANDLED:", err);
});

process.on("uncaughtException", err => {
  console.error("❌ CRASH:", err);
});

