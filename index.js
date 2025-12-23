const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType,
  EmbedBuilder
} = require("discord.js");

// =====================
// AYARLAR
// =====================
const TOKEN = process.env.DISCORD_TOKEN;
const ICTIMA_CHANNEL_ID = "1451620850993336469";

// Günde 3 içtima (saatler)
const ICTIMA_SAATLERI = ["09:00", "15:00", "21:00"];

// =====================
// BOT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// READY
// =====================
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} online`);

  // BOT DURUMU
  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "🪖 Askerî Kamp",
        type: ActivityType.Playing
      }
    ]
  });

  // SLASH KOMUTLAR
  const commands = [
    new SlashCommandBuilder()
      .setName("komutlar")
      .setDescription("Botun komutlarını gösterir")
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash komut yüklendi");
  } catch (err) {
    console.error("❌ Slash yüklenemedi:", err);
  }

  // OTOMATİK İÇTİMA BAŞLAT
  baslatIctima();
});

// =====================
// SLASH KOMUT
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🪖 Askerî Kamp Botu")
      .setColor(0x2f3136)
      .setDescription(
`📌 **Komutlar**
• /komutlar

⏰ **Otomatik**
• Günde 3 içtima (09:00 / 15:00 / 21:00)`
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// =====================
// OTOMATİK İÇTİMA
// =====================
function baslatIctima() {
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

📍 Herkes hazır olsun.
⏰ Saat: **${saat}**

❗ Katılım zorunludur.`
      );
    }
  }, 60 * 1000); // her dakika kontrol
}

// =====================
// LOGIN
// =====================
client.login(TOKEN);
