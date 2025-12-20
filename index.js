const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder 
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

client.once("ready", () => {
  console.log("Bot online");
  const commands = [
  new SlashCommandBuilder()
    .setName("komutlar")
    .setDescription("Askerî kamp botunun tüm komutlarını gösterir")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash komut yüklendi");
  } catch (err) {
    console.error(err);
  }
})();

});

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

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "katil") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.add(role);
    message.reply("✅ DM duyurularına katıldın.");
  }

  if (command === "ayril") {
    const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
    await message.member.roles.remove(role);
    message.reply("❌ DM duyurularından çıktın.");
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
        await member.send(`📢 **Haydi oyuna!!!! | BIG | Turkish Army Forces Tarafından Gönderildi.**\n\n${text}`);
        sent++;
      } catch {}
    }

    message.reply(`✅ ${sent} kişiye DM gönderildi.`);
  }
});
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
• !ictima`
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);


if (command === "komutlar") {
  message.reply(
`🪖 **ASKERÎ KAMP BOTU – KOMUT LİSTESİ**

👤 **Genel Komutlar**
• \`!komutlar\` → Komut listesini gösterir
• \`!katil\` → DM duyurularına katıl
• \`!ayril\` → DM duyurularından çık

📩 **Duyuru**
• \`!dm mesaj\` → DM-Duyuru rolündekilere mesaj gönderir (Yetkili)

🎖️ **Eğlence / RP**
• \`!nobet\` → Rastgele nöbetçi seçer
• \`!komutan\` → Günün komutanını seçer
• \`!terfi @kisi\` → Şaka amaçlı terfi
• \`!alarm\` → Acil durum alarmı

🪖 **Askerî Kamp**
• \`!ictima\` → Rastgele içtima sorusu

📌 **Not**
Komutlar zamanla güncellenebilir.
Disiplinli asker, güçlü birlik!
`
  );
}

const { REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
