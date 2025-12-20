const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = "!";
const ROLE_NAME = "DM-Duyuru";

/* =======================
   BOT READY
======================= */
client.once("ready", async () => {
  console.log("Bot online");

  // 🔹 SLASH KOMUT YÜKLE
  const commands = [
    new SlashCommandBuilder()
      .setName("komutlar")
      .setDescription("Askerî kamp botunun tüm komutlarını gösterir")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash komut yüklendi");
  } catch (err) {
    console.error(err);
  }

  // 🔹 DM-DUYURU ROLÜ OLUŞTUR
  client.guilds.cache.forEach(async (guild) => {
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
});

/* =======================
   PREFIX KOMUTLARI
======================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "katil") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role) return message.reply("❌ Rol bulunamadı.");
    await message.member.roles.add(role);
    message.reply("✅ DM duyurularına katıldın.");
  }

  if (command === "ayril") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role) return message.reply("❌ Rol bulunamadı.");
    await message.member.roles.remove(role);
    message.reply("❌ DM duyurularından çıktın.");
  }

  if (command === "dm") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Yetkin yok.");

    const text = args.join(" ");
    if (!text) return message.reply("❌ Mesaj yaz.");

    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role) return message.reply("❌ Rol bulunamadı.");

    let sent = 0;
    for (const member of role.members.values()) {
      try {
        await member.send(
          `📢 **BIG | Turkish Army Forces Duyuru**\n\n${text}`
        );
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

📩 **DM Duyuru**
• !katil
• !ayril
• !dm mesaj

🎖️ **RP / Eğlence**
• !nobet
• !komutan
• !terfi @kisi
• !alarm
• !ictima

_Disiplinli asker, güçlü birlik._`
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

/* =======================
   LOGIN
======================= */
client.login(process.env.DISCORD_TOKEN);
