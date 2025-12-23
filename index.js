const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

// =====================
// AYARLAR
// =====================
const TOKEN = process.env.DISCORD_TOKEN;
const ICTIMA_CHANNEL_ID = "1451620850993336469";
const DUYURU_ROLE_NAME = "DM-Duyuru";

// İçtima saatleri (günde 3)
const ICTIMA_SAATLERI = ["09:00", "15:00", "21:00"];

// =====================
// BOT
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
  console.log(`✅ ${client.user.tag} online`);

  // Bot durumu
  client.user.setPresence({
    status: "online",
    activities: [
      { name: "🪖 Askerî Kamp", type: ActivityType.Playing }
    ]
  });

  // Slash komutlar
  const commands = [
    new SlashCommandBuilder()
      .setName("komutlar")
      .setDescription("Botun tüm komutlarını gösterir"),

    new SlashCommandBuilder()
      .setName("duyuru_katil")
      .setDescription("DM duyurularına katıl"),

    new SlashCommandBuilder()
      .setName("duyuru_ayril")
      .setDescription("DM duyurularından çık"),

    new SlashCommandBuilder()
      .setName("duyuru_gonder")
      .setDescription("DM duyuru gönder (Yetkili)")
      .addStringOption(opt =>
        opt.setName("mesaj")
          .setDescription("Gönderilecek mesaj")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash komutlar yüklendi");

  otomatikIctimaBaslat();
});

// =====================
// SLASH KOMUTLAR
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const guild = interaction.guild;
  const member = interaction.member;

  // Rol yoksa oluştur
  let role = guild.roles.cache.find(r => r.name === DUYURU_ROLE_NAME);
  if (!role) {
    role = await guild.roles.create({
      name: DUYURU_ROLE_NAME,
      color: "Blue",
      reason: "DM duyuru sistemi"
    });
  }

  // /komutlar
  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu")
      .setColor(0x2f3136)
      .setDescription(
`📌 **Komutlar**

📩 **Duyuru**
• /duyuru_katil
• /duyuru_ayril
• /duyuru_gonder

⏰ **Otomatik**
• Günde 3 içtima (09:00 / 15:00 / 21:00)`
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /duyuru_katil
  if (interaction.commandName === "duyuru_katil") {
    await member.roles.add(role);
    return interaction.reply({ content: "✅ DM duyurularına katıldın.", ephemeral: true });
  }

  // /duyuru_ayril
  if (interaction.commandName === "duyuru_ayril") {
    await member.roles.remove(role);
    return interaction.reply({ content: "❌ DM duyurularından çıktın.", ephemeral: true });
  }

  // /duyuru_gonder
  if (interaction.commandName === "duyuru_gonder") {
    const mesaj = interaction.options.getString("mesaj");
    let gonderilen = 0;

    for (const uye of role.members.values()) {
      try {
        await uye.send(
`📢 **ASKERÎ KAMP DUYURUSU**

${mesaj}`
        );
        gonderilen++;
      } catch {}
    }

    return interaction.reply({
      content: `✅ ${gonderilen} kişiye DM gönderildi.`,
      ephemeral: true
    });
  }
});

// =====================
// OTOMATİK İÇTİMA
// =====================
function otomatikIctimaBaslat() {
  setInterval(() => {
    const now = new Date();
    const saat = now.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (ICTIMA_SAATLERI.includes(saat)) {
      const channel = client.channels.cache.get(ICTIMA_CHANNEL_ID);
      if (!channel) return;

      channel.send(
`🪖 **İÇTİMA VAR!**

📍 Herkes hazır olsun  
⏰ Saat: **${saat}**

❗ Katılım zorunludur.`
      );
    }
  }, 60 * 1000);
}

// =====================
// LOGIN
// =====================
client.login(TOKEN);
