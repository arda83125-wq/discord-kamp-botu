const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

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

client.once("ready", async () => {
  console.log("Bot aktif!");

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
