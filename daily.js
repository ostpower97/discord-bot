import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

// Hilfsfunktion zum Abrufen der Top-Gainer und -Loser
async function getTopMovers() {
  try {
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    const gainers = data.top_gainers?.slice(0, 5) || [];
    const losers = data.top_losers?.slice(0, 5) || [];

    return { gainers, losers };
  } catch (err) {
    console.error('Fehler beim Abrufen der API-Daten:', err);
    return { gainers: [], losers: [] };
  }
}

// Funktion, um alles im Discord-Kanal zu posten
async function postDailyData() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const { gainers, losers } = await getTopMovers();

    let message = '📈 **Top 5 Gainer:**\n';
    gainers.forEach(stock => {
      message += `• ${stock.ticker}: ${stock.change_percentage}\n`;
    });

    message += '\n📉 **Top 5 Loser:**\n';
    losers.forEach(stock => {
      message += `• ${stock.ticker}: ${stock.change_percentage}\n`;
    });

    await channel.send(message);
    console.log('✅ Erfolgreich im Discord gepostet.');
  } catch (err) {
    console.error('Fehler beim Posten:', err);
  }
}

// Wenn der Client bereit ist → direkt posten
client.once('ready', () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);
  postDailyData().then(() => client.destroy());
});

client.login(TOKEN);
