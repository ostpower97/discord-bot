// index.js – geprüfte Version
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`✅ Bot online als ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  cron.schedule('30 17 * * 1-5', async () => {
    try {
      console.log('📈 Starte API-Abfrage...');
      const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.top_gainers || !data.top_losers) {
        await channel.send('⚠️ Keine Daten empfangen. Bitte API-Key prüfen.');
        return;
      }

      const gainers = data.top_gainers.slice(0, 5)
        .map(g => `📈 **${g.ticker_symbol}**: ${g.price} USD (+${g.change_percentage})`)
        .join('\n');

      const losers = data.top_losers.slice(0, 5)
        .map(l => `📉 **${l.ticker_symbol}**: ${l.price} USD (${l.change_percentage})`)
        .join('\n');

      await channel.send(`**Tägliche Marktübersicht:**\n\n**Top Gewinner:**\n${gainers}\n\n**Top Verlierer:**\n${losers}`);
      console.log('✅ Update gesendet.');

    } catch (err) {
      console.error('❌ Fehler bei der API-Abfrage:', err);
      await channel.send('❌ Fehler bei der API-Abfrage.');
    }
  });
});

client.login(TOKEN);
