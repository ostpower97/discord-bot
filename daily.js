import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

// Hilfsfunktion: gestriges Datum als Text
function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// API-Abfrage Top Gainer / Loser
async function getTopMovers() {
  try {
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    const gainers = data.top_gainers?.slice(0, 20) || [];
    const losers = data.top_losers?.slice(0, 20) || [];

    return { gainers, losers };
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der API-Daten:', err);
    return { gainers: [], losers: [] };
  }
}

// Discord-Post
async function postDailyData() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const { gainers, losers } = await getTopMovers();
    const dateText = getYesterdayDate();

    let message = `📊 **Top 20 Aktien vom ${dateText}**\n\n`;

    message += '📈 **Top 20 Gainer:**\n';
    gainers.forEach((s, i) => {
      message += `${i + 1}. **${s.ticker}** (${s.name}) — ${s.change_percentage}\n`;
    });

    message += '\n📉 **Top 20 Loser:**\n';
    losers.forEach((s, i) => {
      message += `${i + 1}. **${s.ticker}** (${s.name}) — ${s.change_percentage}\n`;
    });

    await channel.send(message);
    console.log('✅ Erfolgreich im Discord gepostet.');
  } catch (err) {
    console.error('❌ Fehler beim Posten:', err);
  }
}

// Wenn der Client bereit ist → Daten posten
client.once('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
  postDailyData().then(() => client.destroy());
});

client.login(TOKEN);
