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
const express = require("express");

/* =======================
   AYARLAR
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

  // 🔹 SLASH KOMUTLAR
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

  // 🕒 OTOMATİK İÇTİMA
  const ictimaKanal = client.channels.cache.get(ICTIMA_CHANNEL_ID);

  if (!ictimaKanal) {
    console.log("❌ İçtima kanalı bulunamadı");
  } else {
    const gonder = () => {
      const soru = I
