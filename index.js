// =====================
// GEREKLİ MODÜLLER
// =====================
const express = require("express");
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");
const cron = require("node-cron");

// =====================
// EXPRESS (PORT AÇMA)
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
// BOT AYARLARI
// =====================
const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = "!";
const ROLE_NAME = "DM-Duyuru";
const ICTIMA_CHANNEL_ID = "KANAL_ID_BURAYA"; // 👈 BURAYI DEĞİŞTİR

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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================
// BOT READY
// =====================
client.once("ready", async () => {
  console.log("🤖 Bot Discord’a bağlandı");

  // SLASH KOMUTLAR
  const commands = [
    new SlashCommandBuilder().setName("komutlar").setDescription("Tüm komutları gösterir"),
    new SlashCommandBuilder().setName("ictima").setDescription("Rastgele içtima sorusu")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log("✅ Slash komutlar yüklendi");

  // DM DUYURU ROLÜ
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

  // OTOMATİK İÇTİMA
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

    console.log("🕒 Otomatik içtima AKTİF (09 / 14 / 21)");
  }
});

// =====================
// PREFIX KOMUTLARI
// =====================
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(1).split(" ");
  const cmd = args.shift().toLowerCase();

  if (cmd === "katil") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.add(role);
    message.reply("✅ DM duyurularına katıldın");
  }

  if (cmd === "ayril") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.remove(role);
    message.reply("❌ DM duyurularından çıktın");
  }

  if (cmd === "dm") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Yetkin yok");

    const text = args.join(" ");
    if (!text) return message.reply("❌ Mesaj yaz");

    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    let count = 0;

    for (const member of role.members.values()) {
      try {
        await member.send(`📢 **Askerî Kamp Duyuru**\n\n${text}`);
        count++;
      } catch {}
    }

    message.reply(`✅ ${count} kişiye DM gönderildi`);
  }
});

// =====================
// SLASH KOMUTLAR
// =====================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Komutlar")
      .setDescription(
`/komutlar
/ictima

!katil
!ayril
!dm mesaj`
      );
    i.reply({ embeds: [embed], ephemeral: true });
  }

  if (i.commandName === "ictima") {
    const soru = ICTIMA_SORULARI[Math.floor(Math.random() * ICTIMA_SORULARI.length)];
    i.reply(`🪖 **İÇTİMA**\n${soru}`);
  }
});

// =====================
// BOT LOGIN
// =====================
client.login(TOKEN);
