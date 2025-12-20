// =====================
// MODÜLLER
// =====================
const express = require("express");
const cron = require("node-cron");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

// =====================
// EXPRESS (RENDER PORT)
// =====================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🪖 Askerî Kamp Botu ONLINE");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Dashboard PORT açıldı:", PORT);
});

// =====================
// AYARLAR
// =====================
const TOKEN = process.env.DISCORD_TOKEN;
const ROLE_NAME = "DM-Duyuru";
const ICTIMA_CHANNEL_ID = "1451620850993336469"; // 👈 DEĞİŞTİR

const ICTIMA_SORULARI = [
  "İçtima nedir, neden yapılır?",
  "Disiplin askerde neden önemlidir?",
  "Bir askerin ilk görevi nedir?",
  "Nöbetçinin sorumlulukları nelerdir?",
  "Komutan emri neden önemlidir?"
];

// =====================
// DISCORD CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================
// READY
// =====================
client.once("ready", async () => {
  console.log("🤖 Bot Discord’a bağlandı");

  // 🔹 SLASH KOMUTLAR (HEPSİ GÖRÜNÜR)
  const commands = [
    new SlashCommandBuilder().setName("komutlar").setDescription("Tüm komutları gösterir"),
    new SlashCommandBuilder().setName("ictima").setDescription("Rastgele içtima sorusu"),
    new SlashCommandBuilder().setName("katil").setDescription("DM duyurularına katıl"),
    new SlashCommandBuilder().setName("ayril").setDescription("DM duyurularından çık"),
    new SlashCommandBuilder()
      .setName("duyuru")
      .setDescription("DM-Duyuru rolüne DM gönderir (Yetkili)")
      .addStringOption(o =>
        o.setName("mesaj")
          .setDescription("Gönderilecek mesaj")
          .setRequired(true)
      )
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log("✅ Slash komutlar yüklendi");

  // 🔹 DM DUYURU ROLÜ
  client.guilds.cache.forEach(async guild => {
    if (!guild.roles.cache.find(r => r.name === ROLE_NAME)) {
      await guild.roles.create({
        name: ROLE_NAME,
        color: "Blue",
        reason: "DM Duyuru Rolü"
      });
      console.log("🧩 DM-Duyuru rolü oluşturuldu");
    }
  });

  // 🕒 OTOMATİK İÇTİMA
  const kanal = client.channels.cache.get(ICTIMA_CHANNEL_ID);
  if (!kanal) {
    console.log("❌ İçtima kanalı bulunamadı");
  } else {
    const gonder = () => {
      const soru = ICTIMA_SORULARI[Math.floor(Math.random() * ICTIMA_SORULARI.length)];
      kanal.send(`🪖 **İÇTİMA ZAMANI**\n${soru}`);
    };

    cron.schedule("0 9 * * *", gonder, { timezone: "Europe/Istanbul" });
    cron.schedule("0 14 * * *", gonder, { timezone: "Europe/Istanbul" });
    cron.schedule("0 21 * * *", gonder, { timezone: "Europe/Istanbul" });

    console.log("🕒 Otomatik içtima aktif (09 / 14 / 21)");
  }
});

// =====================
// SLASH KOMUT ÇALIŞMA
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /komutlar
  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu – Komutlar")
      .setColor(0x2f3136)
      .setDescription(
`👤 **Genel**
• /komutlar

🪖 **Askerî**
• /ictima

📩 **DM Duyuru**
• /katil
• /ayril
• /duyuru mesaj`
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /ictima
  if (interaction.commandName === "ictima") {
    const soru = ICTIMA_SORULARI[Math.floor(Math.random() * ICTIMA_SORULARI.length)];
    return interaction.reply(`🪖 **İÇTİMA**\n${soru}`);
  }

  // /katil
  if (interaction.commandName === "katil") {
    const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await interaction.member.roles.add(role);
    return interaction.reply({ content: "✅ DM duyurularına katıldın", ephemeral: true });
  }

  // /ayril
  if (interaction.commandName === "ayril") {
    const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await interaction.member.roles.remove(role);
    return interaction.reply({ content: "❌ DM duyurularından çıktın", ephemeral: true });
  }

  // /duyuru
  if (interaction.commandName === "duyuru") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });

    const text = interaction.options.getString("mesaj");
    const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);

    let sent = 0;
    for (const member of role.members.values()) {
      try {
        await member.send(`📢 **Askerî Kamp Duyuru**\n\n${text}`);
        sent++;
      } catch {}
    }

    return interaction.reply(`✅ ${sent} kişiye DM gönderildi`);
  }
});

// =====================
// LOGIN
// =====================
client.login(TOKEN);
