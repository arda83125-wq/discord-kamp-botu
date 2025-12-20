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

/* =======================
   BOT AYARLARI
======================= */
const PREFIX = "!";
const ROLE_NAME = "DM-Duyuru";
const ICTIMA_CHANNEL_ID = "1451620850993336469"; // 👈 BURAYI DEĞİŞTİR

const ICTIMA_SORULARI = [
  "Askerde disiplin neden önemlidir?",
  "İçtima nedir, neden yapılır?",
  "Bir askerin ilk görevi nedir?",
  "Nöbetçinin sorumlulukları nelerdir?",
  "Komutan emri neden sorgulanmaz?"
];

/* =======================
   CLIENT
======================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

/* =======================
   READY
======================= */
client.once("ready", async () => {
  console.log("Bot online");

  // 🔹 SLASH KOMUTLARI YÜKLE
  const commands = [
    new SlashCommandBuilder().setName("komutlar").setDescription("Tüm komutları gösterir"),
    new SlashCommandBuilder().setName("ictima").setDescription("Rastgele içtima sorusu"),
    new SlashCommandBuilder().setName("nobet").setDescription("Rastgele nöbetçi seçer"),
    new SlashCommandBuilder().setName("komutan").setDescription("Günün komutanını seçer")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash komutlar yüklendi");

  // 🔹 DM DUYURU ROLÜ
  client.guilds.cache.forEach(async guild => {
    let role = guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role) {
      await guild.roles.create({
        name: ROLE_NAME,
        color: "Blue",
        reason: "Otomatik DM duyuru rolü"
      });
      console.log(`${ROLE_NAME} rolü oluşturuldu`);
    }
  });

  // 🕒 OTOMATİK İÇTİMA (GÜNDE 3 KEZ)
  const ictimaKanal = client.channels.cache.get(ICTIMA_CHANNEL_ID);

  if (!ictimaKanal) {
    console.log("❌ İçtima kanalı bulunamadı");
  } else {
    const ictimaGonder = () => {
      const soru = ICTIMA_SORULARI[Math.floor(Math.random() * ICTIMA_SORULARI.length)];
      ictimaKanal.send(`🪖 **İÇTİMA ZAMANI**\n${soru}`);
    };

    cron.schedule("0 9 * * *", ictimaGonder, { timezone: "Europe/Istanbul" });
    cron.schedule("0 14 * * *", ictimaGonder, { timezone: "Europe/Istanbul" });
    cron.schedule("0 21 * * *", ictimaGonder, { timezone: "Europe/Istanbul" });

    console.log("🕒 Otomatik içtima sistemi aktif (günde 3 kez)");
  }
});

/* =======================
   PREFIX KOMUTLARI
======================= */
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "katil") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.add(role);
    return message.reply("✅ DM duyurularına katıldın.");
  }

  if (command === "ayril") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.remove(role);
    return message.reply("❌ DM duyurularından çıktın.");
  }

  if (command === "dm") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Yetkin yok.");

    const text = args.join(" ");
    if (!text) return message.reply("❌ Mesaj yaz.");

    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    let sent = 0;

    for (const member of role.members.values()) {
      try {
        await member.send(`📢 **BIG | Turkish Army Forces Duyuru**\n\n${text}`);
        sent++;
      } catch {}
    }

    message.reply(`✅ ${sent} kişiye DM gönderildi.`);
  }
});

/* =======================
   SLASH KOMUTLAR
======================= */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu – Komutlar")
      .setColor(0x2F3136)
      .setDescription(
`👤 **Genel**
• /komutlar

🪖 **Askerî**
• /ictima
• /nobet
• /komutan

📩 **DM Duyuru**
• !katil
• !ayril
• !dm mesaj

_Disiplinli asker, güçlü birlik._`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.commandName === "ictima") {
    const soru = ICTIMA_SORULARI[Math.floor(Math.random() * ICTIMA_SORULARI.length)];
    return interaction.reply(`🪖 **İÇTİMA SORUSU**\n${soru}`);
  }

  if (interaction.commandName === "nobet") {
    const members = interaction.guild.members.cache.filter(m => !m.user.bot).map(m => m);
    const secilen = members[Math.floor(Math.random() * members.length)];
    return interaction.reply(`🕒 **Bugünün nöbetçisi:** ${secilen}`);
  }

  if (interaction.commandName === "komutan") {
    const members = interaction.guild.members.cache.filter(m => !m.user.bot).map(m => m);
    const secilen = members[Math.floor(Math.random() * members.length)];
    return interaction.reply(`🎖️ **Günün Komutanı:** ${secilen}`);
  }
});

/* =======================
   LOGIN
======================= */
client.login(process.env.DISCORD_TOKEN);
